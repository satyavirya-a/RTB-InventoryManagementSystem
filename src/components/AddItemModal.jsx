/**
 * AddItemModal.jsx — Modal formulir untuk PIC/Admin menambahkan barang baru ke katalog.
 *
 * Alur kerja:
 * 1. PIC memasukkan nama barang, deskripsi, stok awal, dan satuan.
 * 2. PIC dapat mengunggah foto barang (dikompresi otomatis via PhotoUpload).
 * 3. Saat disubmit:
 *    - Foto diunggah ke Supabase Storage (bucket 'item-photos').
 *    - Data disimpan ke tabel PostgreSQL 'items'.
 *    - Callback onItemAdded dipanggil agar katalog langsung menampilkan barang baru.
 *
 * @param {object} props
 * @param {boolean} props.isOpen - Status apakah modal sedang terbuka
 * @param {Function} props.onClose - Callback untuk menutup modal
 * @param {Function} [props.onItemAdded] - Callback saat barang baru berhasil disimpan
 */
import React, { useState, useEffect } from 'react'
import PhotoUpload from './PhotoUpload'
import { supabase } from '../lib/supabaseClient'
import { uploadImageToStorage } from '../lib/storageService'
import { syncTransactionToGoogle } from '../lib/googleSyncService'
import './AddItemModal.css'

function AddItemModal({ isOpen, onClose, onItemAdded }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [stockAvailable, setStockAvailable] = useState(1)
  const [unit, setUnit] = useState('pcs')
  
  // State Foto Barang
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusText, setStatusText] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Pilihan satuan cepat yang sering dipakai
  const QUICK_UNITS = ['pcs', 'unit', 'roll', 'set', 'box', 'lembar', 'meter', 'pack']

  // Kunci scrolling body saat modal terbuka
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Tombol Escape untuk menutup modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting) onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isSubmitting, onClose])

  if (!isOpen) return null

  const resetForm = () => {
    setName('')
    setDescription('')
    setStockAvailable(1)
    setUnit('pcs')
    setPhotoFile(null)
    setPhotoPreview(null)
    setErrorMsg('')
    setStatusText('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setErrorMsg('Nama barang wajib diisi.')
      return
    }

    if (stockAvailable < 1) {
      setErrorMsg('Jumlah stok awal minimal 1.')
      return
    }

    setIsSubmitting(true)
    setErrorMsg('')
    setStatusText('Mengunggah foto barang...')

    try {
      let finalPhotoUrl = null

      // 1. Upload foto barang ke bucket 'item-photos' (jika ada)
      if (photoFile) {
        try {
          finalPhotoUrl = await uploadImageToStorage(photoFile, 'item-photos')
        } catch (uploadErr) {
          console.error('Upload foto katalog gagal:', uploadErr)
          throw new Error(`Gagal mengunggah foto ke Supabase Storage: ${uploadErr.message || 'Periksa koneksi/bucket item-photos'}. Pastikan bucket 'item-photos' sudah dibuat dengan status Public di Supabase Dashboard.`)
        }
      }

      setStatusText('Menyimpan data ke database...')

      // 2. Insert baris baru ke tabel 'items'
      const { data, error: insertError } = await supabase
        .from('items')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          stock_available: parseInt(stockAvailable, 10),
          stock_in_use: 0,
          unit: unit.trim() || 'pcs',
          photo_url: finalPhotoUrl,
          status: 'active'
        })
        .select()
        .single()

      if (insertError) throw insertError

      // 3. Catat riwayat aksi penambahan barang baru ke tabel transactions
      try {
        const { data: transData, error: transError } = await supabase
          .from('transactions')
          .insert({
            transaction_type: 'penambahan',
            actor_name: 'PIC Gudang',
            event_name: 'Manajemen Inventaris',
            proof_photo_url: finalPhotoUrl,
            notes: `Menambahkan barang baru: "${name.trim()}" (Stok awal: ${parseInt(stockAvailable, 10)} ${unit.trim() || 'pcs'})`
          })
          .select()
          .single()

        if (transError) {
          console.warn('Gagal mencatat log transaksi penambahan (mungkin perlu update check constraint):', transError)
        } else if (transData) {
          await supabase.from('transaction_details').insert({
            transaction_id: transData.id,
            item_id: data.id,
            quantity: parseInt(stockAvailable, 10)
          })
        }
      } catch (logErr) {
        console.warn('Gagal mencatat log transaksi penambahan:', logErr)
      }

      // 4. Sync ke Google Sheets & Drive (Non-blocking di background)
      syncTransactionToGoogle({
        transactionType: 'penambahan',
        actorName: 'PIC Gudang',
        eventName: 'Manajemen Inventaris',
        itemsSummary: `${name.trim()} (${parseInt(stockAvailable, 10)} ${unit.trim() || 'pcs'})`,
        notes: `Menambahkan barang baru: "${name.trim()}" (Stok awal: ${parseInt(stockAvailable, 10)} ${unit.trim() || 'pcs'})`,
        proofPhotoUrl: finalPhotoUrl
      })

      alert(`Barang "${name}" berhasil ditambahkan ke inventaris!`)
      
      if (onItemAdded) {
        onItemAdded(data)
      }

      resetForm()
      onClose()
    } catch (err) {
      console.error('Gagal menambah barang baru:', err)
      setErrorMsg(err.message || 'Gagal menyimpan barang baru.')
    } finally {
      setIsSubmitting(false)
      setStatusText('')
    }
  }

  return (
    <>
      <div className="modal-overlay" onClick={() => !isSubmitting && onClose()} aria-hidden="true" />
      
      <div className="add-item-modal" role="dialog" aria-modal="true" aria-labelledby="add-item-title">
        <header className="add-item-modal__header">
          <h2 id="add-item-title">📦 Tambah Barang Baru</h2>
          <button 
            type="button" 
            className="add-item-modal__close-btn"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Tutup form"
          >
            ✕
          </button>
        </header>

        <form onSubmit={handleSubmit} className="add-item-modal__form">
          {errorMsg && (
            <div className="wizard-error">
              <strong>Gagal: </strong> {errorMsg}
            </div>
          )}

          {/* Nama Barang */}
          <div className="form-group">
            <label htmlFor="item-name">Nama Barang *</label>
            <input
              id="item-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Kabel HDMI 5 Meter"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Deskripsi Barang */}
          <div className="form-group">
            <label htmlFor="item-desc">Deskripsi / Spesifikasi (Opsional)</label>
            <textarea
              id="item-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Warna hitam, support 4K 60Hz, ada di lemari B2..."
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          {/* Baris Stok & Satuan */}
          <div className="add-item-modal__row">
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="item-stock">Stok Awal *</label>
              <input
                id="item-stock"
                type="number"
                min="1"
                value={stockAvailable}
                onChange={(e) => setStockAvailable(Math.max(1, parseInt(e.target.value) || 1))}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group" style={{ flex: 1.2 }}>
              <label htmlFor="item-unit">Satuan (Unit) *</label>
              <input
                id="item-unit"
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Contoh: pcs, roll, unit"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Pilihan Cepat Satuan */}
          <div className="add-item-modal__quick-units">
            <span className="quick-units-label">Pilihan cepat:</span>
            {QUICK_UNITS.map((u) => (
              <button
                key={u}
                type="button"
                className={`quick-unit-btn ${unit === u ? 'quick-unit-btn--active' : ''}`}
                onClick={() => setUnit(u)}
                disabled={isSubmitting}
              >
                {u}
              </button>
            ))}
          </div>

          {/* Upload Foto Barang */}
          <PhotoUpload
            label="Foto Barang Katalog (Opsional)"
            hint="Upload foto barang agar mudah dikenali di katalog (otomatis dikompresi)"
            value={photoFile}
            previewUrl={photoPreview}
            onChange={({ file, previewUrl }) => {
              setPhotoFile(file)
              setPhotoPreview(previewUrl)
            }}
            disabled={isSubmitting}
          />

          {/* Tombol Aksi */}
          <div className="add-item-modal__actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? (statusText || 'Menyimpan...') : 'Simpan Barang Baru'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

export default AddItemModal
