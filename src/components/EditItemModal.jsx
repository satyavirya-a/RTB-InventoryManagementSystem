/**
 * EditItemModal.jsx — Modal untuk mengedit data barang inventaris dan mengganti foto katalog.
 *
 * Fitur:
 * 1. Form pre-filled dengan data barang saat ini (nama, deskripsi, satuan, tipe consumable).
 * 2. Upload / ganti foto barang dengan kompresi otomatis di background Web Worker (~200KB).
 * 3. Mengunggah foto baru ke Supabase Storage bucket 'item-photos'.
 * 4. Melakukan UPDATE baris data di tabel PostgreSQL 'items'.
 * 5. Menjalankan auto-sync ke Google Spreadsheet agar sheet "Rekap Stok Barang" langsung terbarui.
 *
 * @param {object} props
 * @param {boolean} props.isOpen - Status visibilitas modal
 * @param {object} props.item - Data barang yang akan diedit
 * @param {Function} props.onClose - Callback saat modal ditutup
 * @param {Function} props.onItemUpdated - Callback saat data barang berhasil diperbarui
 */
import React, { useState, useEffect } from 'react'
import PhotoUpload from './PhotoUpload'
import { supabase } from '../lib/supabaseClient'
import { uploadImageToStorage } from '../lib/storageService'
import { syncAllItemsToGoogle } from '../lib/googleSyncService'
import { ITEM_CATEGORIES, CATEGORY_ICONS } from '../lib/constants'
import './EditItemModal.css'

function EditItemModal({ isOpen, item, onClose, onItemUpdated }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Lain-lain')
  const [description, setDescription] = useState('')
  const [unit, setUnit] = useState('pcs')
  const [stockAvailable, setStockAvailable] = useState(0)
  const [isConsumable, setIsConsumable] = useState(true)
  
  // State Foto
  const [newPhotoFile, setNewPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)

  const [isSaving, setIsSaving] = useState(false)
  const [statusText, setStatusText] = useState('')

  // Inisialisasi form dengan data barang yang dipilih saat modal terbuka
  useEffect(() => {
    if (isOpen && item) {
      setName(item.name || '')
      setCategory(item.category || 'Lain-lain')
      setDescription(item.description || '')
      setUnit(item.unit || 'pcs')
      setStockAvailable(item.stock_available ?? 0)
      setIsConsumable(item.is_consumable ?? true)
      setPhotoPreview(item.photo_url || null)
      setNewPhotoFile(null)
      setIsSaving(false)
      setStatusText('')
    }
  }, [isOpen, item])

  // Menutup modal dengan tombol Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSaving) onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isSaving, onClose])

  if (!isOpen || !item) return null

  // Handler Submit Perubahan Data Barang
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!name.trim()) {
      alert('Nama barang wajib diisi.')
      return
    }

    setIsSaving(true)
    setStatusText('Memproses perubahan...')

    try {
      let finalPhotoUrl = item.photo_url || null

      // 1. Jika ada file foto baru yang diunggah, simpan ke Supabase Storage
      if (newPhotoFile) {
        setStatusText('Mengunggah foto baru...')
        finalPhotoUrl = await uploadImageToStorage(newPhotoFile, 'item-photos')
      } else if (!photoPreview) {
        // Jika user menghapus foto
        finalPhotoUrl = null
      }

      setStatusText('Memperbarui database...')

      const parsedStock = Math.max(0, parseInt(stockAvailable, 10) || 0)
      const stockChanged = parsedStock !== (item.stock_available ?? 0)

      // Payload data yang akan diperbarui
      const updatePayload = {
        name: name.trim(),
        category: category || 'Lain-lain',
        description: description.trim() || null,
        unit: unit.trim() || 'pcs',
        stock_available: parsedStock,
        is_consumable: isConsumable,
        photo_url: finalPhotoUrl,
        updated_at: new Date().toISOString()
      }

      // Jika stok bertambah dari 0 dan status sebelumnya archived, aktifkan kembali
      if (parsedStock > 0 && item.status === 'archived') {
        updatePayload.status = 'active'
      }

      // 2. Update data barang di tabel items
      const { data: updatedItem, error: updateError } = await supabase
        .from('items')
        .update(updatePayload)
        .eq('id', item.id)
        .select()
        .single()

      if (updateError) throw updateError

      // 3. Catat riwayat log penyesuaian jika stok diubah secara manual
      if (stockChanged) {
        try {
          await supabase.from('transactions').insert({
            transaction_type: 'penyesuaian',
            actor_name: 'PIC Gudang',
            event_name: 'Koreksi Stok Opname',
            notes: `Koreksi stok barang "${name.trim()}" dari ${item.stock_available ?? 0} menjadi ${parsedStock} ${unit}.`
          })
        } catch (logErr) {
          console.warn('[EditItem] Log penyesuaian stok gagal dicatat (non-blocking):', logErr)
        }
      }

      // 4. Auto-sync data seluruh master barang ke Google Spreadsheet di latar belakang
      try {
        const { data: allItems } = await supabase
          .from('items')
          .select('*')
          .order('created_at', { ascending: true })

        if (allItems && allItems.length > 0) {
          syncAllItemsToGoogle(allItems)
        }
      } catch (syncErr) {
        console.warn('[EditItem] Auto-sync spreadsheet di latar belakang gagal (non-blocking):', syncErr)
      }

      alert(`Data barang "${name}" dan stok berhasil diperbarui!`)

      if (onItemUpdated) {
        onItemUpdated(updatedItem)
      }
      onClose()
    } catch (err) {
      console.error('Gagal memperbarui barang:', err)
      alert(`Gagal menyimpan perubahan: ${err.message || 'Terjadi kesalahan sistem'}`)
    } finally {
      setIsSaving(false)
      setStatusText('')
    }
  }

  const QUICK_UNITS = ['pcs', 'unit', 'roll', 'set', 'box', 'lembar', 'meter', 'pack']

  return (
    <>
      {/* Overlay Gelap */}
      <div className="edit-modal-overlay" onClick={() => !isSaving && onClose()} aria-hidden="true" />

      {/* Container Modal Form */}
      <div
        className="edit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-modal-title"
      >
        <div className="edit-modal__header">
          <h2 id="edit-modal-title" className="edit-modal__title">
            ✏️ Edit Data & Foto Barang
          </h2>
          <button
            type="button"
            className="edit-modal__close-btn"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Tutup form edit"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-modal__form">
          {/* Input Nama Barang */}
          <div className="edit-form-group">
            <label htmlFor="edit-item-name">Nama Barang *</label>
            <input
              id="edit-item-name"
              type="text"
              className="edit-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Kabel HDMI 5m"
              required
              disabled={isSaving}
            />
          </div>

          {/* Input Kategori Barang */}
          <div className="edit-form-group">
            <label htmlFor="edit-item-category">Kategori Barang *</label>
            <select
              id="edit-item-category"
              className="select-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isSaving}
              required
            >
              {ITEM_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_ICONS[cat] || '📦'} {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Input Deskripsi Barang */}
          <div className="edit-form-group">
            <label htmlFor="edit-item-desc">Deskripsi / Lokasi Rak</label>
            <textarea
              id="edit-item-desc"
              className="edit-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Disimpan di Lemari B2 Rak Atas. Kabel hitam gold-plated."
              rows={2}
              disabled={isSaving}
            />
          </div>

          {/* Baris 1: Stok Tersedia & Satuan (Gaya Kompak) */}
          <div className="compact-stock-unit-grid">
            {/* Stepper Stok Tersedia */}
            <div className="form-group">
              <label htmlFor="edit-item-stock">Stok Tersedia *</label>
              <div className="quantity-stepper">
                <button
                  type="button"
                  className="stepper-btn stepper-btn--minus"
                  onClick={() => setStockAvailable(prev => Math.max(0, prev - 1))}
                  disabled={isSaving || stockAvailable <= 0}
                  aria-label="Kurangi 1 stok"
                >
                  −
                </button>
                <input
                  id="edit-item-stock"
                  type="number"
                  min="0"
                  className="stepper-input"
                  value={stockAvailable}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10)
                    setStockAvailable(isNaN(val) ? 0 : Math.max(0, val))
                  }}
                  required
                  disabled={isSaving}
                />
                <button
                  type="button"
                  className="stepper-btn stepper-btn--plus"
                  onClick={() => setStockAvailable(prev => prev + 1)}
                  disabled={isSaving}
                  aria-label="Tambah 1 stok"
                >
                  +
                </button>
              </div>
            </div>

            {/* Input Satuan */}
            <div className="form-group">
              <label htmlFor="edit-item-unit">Satuan (Unit) *</label>
              <input
                id="edit-item-unit"
                type="text"
                className="edit-input"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="pcs, roll, unit"
                required
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Pilihan Cepat Satuan */}
          <div className="compact-quick-units">
            <span className="compact-quick-units-label">Pilihan cepat:</span>
            {QUICK_UNITS.map((u) => (
              <button
                key={u}
                type="button"
                className={`quick-unit-btn ${unit === u ? 'quick-unit-btn--active' : ''}`}
                onClick={() => setUnit(u)}
                disabled={isSaving}
              >
                {u}
              </button>
            ))}
          </div>

          {/* Baris 2: Sifat Barang (Segmented Tab Bar Kompak) */}
          <div className="form-group">
            <label>Sifat / Karakteristik Barang *</label>
            <div className="compact-segmented-control">
              <button
                type="button"
                className={`compact-segment-tab ${isConsumable ? 'compact-segment-tab--active' : ''}`}
                onClick={() => setIsConsumable(true)}
                disabled={isSaving}
              >
                <span>📦 Habis Pakai</span>
              </button>

              <button
                type="button"
                className={`compact-segment-tab ${!isConsumable ? 'compact-segment-tab--active' : ''}`}
                onClick={() => setIsConsumable(false)}
                disabled={isSaving}
              >
                <span>🔄 Pinjam-Kembali</span>
              </button>
            </div>
          </div>

          {/* Info Status Barang Sedang Dipakai (jika non-consumable dan ada yg pinjam) */}
          {item.stock_in_use > 0 && (
            <div className="edit-in-use-banner">
              <span>ℹ️ <strong>{item.stock_in_use} {item.unit || 'pcs'}</strong> saat ini sedang dibawa/dipinjam oleh panitia. Total unit fisik: <strong>{stockAvailable + item.stock_in_use} {unit}</strong>.</span>
            </div>
          )}

          {/* Upload / Ganti Foto Barang */}
          <div className="edit-form-group">
            <PhotoUpload
              label="Foto Katalog Barang"
              hint="Pilih gambar baru untuk mengganti foto (otomatis dikompresi ~200KB)"
              value={newPhotoFile}
              previewUrl={photoPreview}
              onChange={({ file, previewUrl }) => {
                setNewPhotoFile(file)
                setPhotoPreview(previewUrl)
              }}
              disabled={isSaving}
            />
          </div>

          {/* Footer Actions */}
          <div className="edit-modal__actions">
            <button
              type="button"
              className="btn-edit-cancel"
              onClick={onClose}
              disabled={isSaving}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-edit-submit"
              disabled={isSaving || !name.trim()}
            >
              {isSaving ? (statusText || 'Menyimpan...') : '💾 Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

export default EditItemModal
