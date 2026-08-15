/**
 * TransactionWizard.jsx — Form alur bertahap (Wizard) untuk transaksi gudang.
 *
 * Mendukung 4 jenis transaksi:
 * 1. wizard_pemakaian: Identitas -> Pilih Barang (Katalog) -> Konfirmasi & Upload Bukti (opsional) -> Submit
 * 2. wizard_pengembalian: Identitas -> Pilih Barang Dipinjam -> Konfirmasi & Upload Bukti (opsional) -> Submit
 * 3. wizard_penitipan: Identitas -> Detail Barang Titipan & Foto Bukti (wajib) -> Konfirmasi -> Submit
 * 4. wizard_pengambilan: Identitas -> Pilih Barang Titipan Aktif & Foto Bukti (opsional) -> Konfirmasi -> Submit
 *
 * @param {object} props
 * @param {'wizard_pemakaian'|'wizard_pengembalian'|'wizard_penitipan'|'wizard_pengambilan'} props.type - Tipe transaksi
 * @param {Function} props.onCancel - Callback untuk kembali ke Dashboard
 * @param {object|null} [props.initialDepositItem=null] - Item titipan yang sudah dipilih dari dashboard (jika ada)
 */
import React, { useState } from 'react'
import CatalogPage from './CatalogPage'
import DepositedItemsList from '../components/DepositedItemsList'
import PhotoUpload from '../components/PhotoUpload'
import { supabase } from '../lib/supabaseClient'
import { uploadImageToStorage } from '../lib/storageService'
import { syncTransactionToGoogle } from '../lib/googleSyncService'
import './TransactionWizard.css'

function TransactionWizard({ type, onCancel, initialDepositItem = null }) {
  // Step saat ini: 1, 2, atau 3
  const [step, setStep] = useState(1)
  
  // Data Identitas
  const [actorName, setActorName] = useState('')
  const [eventName, setEventName] = useState('')
  const [notes, setNotes] = useState('')

  // Data Khusus Penitipan Barang
  const [depositItemName, setDepositItemName] = useState('')
  const [depositItemDescription, setDepositItemDescription] = useState('')

  // Data Khusus Pengambilan Barang Titipan
  const [selectedDeposit, setSelectedDeposit] = useState(initialDepositItem)

  // State Foto Bukti (File terkompresi & URL Pratinjau)
  const [proofPhotoFile, setProofPhotoFile] = useState(null)
  const [proofPhotoPreview, setProofPhotoPreview] = useState(null)

  // Keranjang lokal untuk transaksi Pemakaian & Pengembalian
  const [cartItems, setCartItems] = useState([])
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatusText, setSubmitStatusText] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  
  const isPenitipan = type === 'wizard_penitipan'
  const isPengambilan = type === 'wizard_pengambilan'
  
  // Judul Header
  let title = ''
  if (type === 'wizard_pemakaian') title = 'Pemakaian Barang'
  if (type === 'wizard_pengembalian') title = 'Pengembalian Barang'
  if (type === 'wizard_penitipan') title = 'Penitipan Barang'
  if (type === 'wizard_pengambilan') title = 'Pengambilan Barang Titipan'

  // Navigasi Step
  const nextStep = () => setStep((s) => s + 1)
  const prevStep = () => setStep((s) => s - 1)

  // Logika Cart Lokal
  const handleItemClick = (item) => {
    // 1. Validasi awal untuk transaksi Pengembalian
    if (type === 'wizard_pengembalian' && item.stock_in_use <= 0) {
      alert('Tidak ada unit barang ini yang sedang dipakai/dipinjam.')
      return
    }

    // 2. Validasi awal untuk transaksi Pemakaian
    if (type === 'wizard_pemakaian' && item.stock_available <= 0) {
      alert('Stok barang tersedia habis!')
      return
    }

    // 3. Validasi kuantitas barang yang sudah ada di cart (di luar state updater)
    const existing = cartItems.find(i => i.item.id === item.id)
    if (existing) {
      if (type === 'wizard_pemakaian' && existing.quantity >= item.stock_available) {
        alert(`Kuantitas pemakaian tidak boleh melebihi stok tersedia (${item.stock_available} ${item.unit}).`)
        return
      }
      if (type === 'wizard_pengembalian' && existing.quantity >= item.stock_in_use) {
        alert(`Kuantitas pengembalian tidak boleh melebihi jumlah yang sedang dipinjam (${item.stock_in_use} ${item.unit}).`)
        return
      }
    }

    // 4. Pure state updater: tidak memuat side-effect seperti alert()
    setCartItems(prev => {
      const idx = prev.findIndex(i => i.item.id === item.id)
      if (idx !== -1) {
        return prev.map((i, index) => index === idx ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { item, quantity: 1 }]
    })
  }

  const handleUpdateQty = (itemId, delta) => {
    // Cari item yang ingin diubah kuantitasnya
    const existing = cartItems.find(i => i.item.id === itemId)
    if (!existing) return

    const newQty = existing.quantity + delta

    // Validasi batas kuantitas dilakukan SEBELUM masuk ke state updater
    if (newQty > 0) {
      if (type === 'wizard_pemakaian' && newQty > existing.item.stock_available) {
        alert(`Kuantitas tidak boleh melebihi stok tersedia (${existing.item.stock_available} ${existing.item.unit}).`)
        return
      }

      if (type === 'wizard_pengembalian' && newQty > existing.item.stock_in_use) {
        alert(`Kuantitas tidak boleh melebihi jumlah yang sedang dipinjam (${existing.item.stock_in_use} ${existing.item.unit}).`)
        return
      }
    }

    // Pure state updater
    setCartItems(prev => {
      return prev.map(i => {
        if (i.item.id === itemId) {
          const qty = i.quantity + delta
          if (qty <= 0) return null // Hapus item jika kuantitas jadi 0
          return { ...i, quantity: qty }
        }
        return i
      }).filter(Boolean)
    })
  }

  // Handler Submit Transaksi
  const handleSubmit = async () => {
    setIsSubmitting(true)
    setErrorMsg('')
    setSubmitStatusText('Mengunggah foto bukti...')
    
    try {
      let finalPhotoUrl = null

      // 1. Upload foto bukti ke Supabase Storage (jika ada)
      if (proofPhotoFile) {
        try {
          finalPhotoUrl = await uploadImageToStorage(proofPhotoFile, 'transaction-proofs')
        } catch (uploadErr) {
          console.warn('Upload foto bukti gagal, melanjutkan transaksi tanpa foto:', uploadErr)
          if (isPenitipan) {
            throw new Error(`Gagal mengunggah foto bukti penitipan: ${uploadErr.message || 'Periksa koneksi/bucket Supabase'}`)
          }
        }
      }

      setSubmitStatusText('Menyimpan data transaksi...')

      // =========================================================================
      // CABANG 1: ALUR PENGAMBILAN BARANG TITIPAN
      // =========================================================================
      if (isPengambilan) {
        if (!selectedDeposit) {
          throw new Error('Harap pilih barang titipan yang ingin diambil.')
        }

        const depositDesc = selectedDeposit.notes || 'Barang Titipan'
        const pickupNotes = `Mengambil barang titipan: ${depositDesc}\n(Dititipkan oleh: ${selectedDeposit.depositor_name || selectedDeposit.actor_name || '-'})` +
          (notes ? `\nCatatan Pengambil: ${notes}` : '')

        // Simpan langsung ke tabel transactions dengan relasi related_transaction_id
        const { error: pickupError } = await supabase
          .from('transactions')
          .insert({
            transaction_type: 'pengambilan',
            actor_name: actorName,
            event_name: eventName,
            proof_photo_url: finalPhotoUrl,
            related_transaction_id: selectedDeposit.id,
            notes: pickupNotes
          })

        if (pickupError) throw pickupError

        // Sync ke Google Sheets & Drive (Non-blocking di background)
        syncTransactionToGoogle({
          transactionType: 'pengambilan',
          actorName,
          eventName,
          itemsSummary: selectedDeposit?.notes || 'Barang Titipan',
          notes: pickupNotes,
          proofPhotoUrl: finalPhotoUrl
        })

        alert('Barang titipan berhasil diambil dan statusnya telah diperbarui!')
        onCancel()
        return
      }

      // =========================================================================
      // CABANG 2: ALUR TRANSAKSI PEMAKAIAN, PENGEMBALIAN, & PENITIPAN (RPC)
      // =========================================================================
      let finalNotes = notes || null
      if (isPenitipan) {
        finalNotes = `Barang: ${depositItemName}\nRincian: ${depositItemDescription}${notes ? `\nCatatan: ${notes}` : ''}`
      }

      // Map format item untuk RPC: [{"item_id": "...", "quantity": 1}]
      const cartJson = isPenitipan ? [] : cartItems.map(i => ({
        item_id: i.item.id,
        quantity: i.quantity
      }))
      
      const transactionTypeString = type.replace('wizard_', '') // 'pemakaian', 'pengembalian', 'penitipan'

      // Eksekusi fungsi atomik PostgreSQL RPC
      const { data, error } = await supabase.rpc('process_checkout_transaction', {
        p_transaction_type: transactionTypeString,
        p_actor_name: actorName,
        p_event_name: eventName,
        p_proof_photo_url: finalPhotoUrl,
        p_notes: finalNotes,
        p_cart_items: cartJson
      })

      if (error) throw error

      // Sync ke Google Sheets & Drive (Non-blocking di background)
      const itemsSummaryStr = isPenitipan
        ? `Penitipan: ${depositItemName}`
        : cartItems.map(i => `${i.quantity}x ${i.item.name}`).join(', ')

      syncTransactionToGoogle({
        transactionType: transactionTypeString,
        actorName,
        eventName,
        itemsSummary: itemsSummaryStr,
        notes: finalNotes,
        proofPhotoUrl: finalPhotoUrl
      })
      
      alert('Transaksi berhasil dikirim dan dicatat!')
      onCancel() // Kembali ke dashboard
    } catch (err) {
      console.error('Transaksi gagal:', err)
      setErrorMsg(err.message || 'Terjadi kesalahan saat memproses transaksi.')
    } finally {
      setIsSubmitting(false)
      setSubmitStatusText('')
    }
  }

  return (
    <div className="wizard-container">
      <header className="wizard-header">
        <button className="btn-back" onClick={onCancel} disabled={isSubmitting}>← Batal</button>
        <h2>{title}</h2>
        <div className="wizard-progress">Langkah {step} dari 3</div>
      </header>

      <main className="wizard-body">
        {errorMsg && (
          <div className="wizard-error">
            <strong>Gagal: </strong> {errorMsg}
          </div>
        )}

        {/* STEP 1: IDENTITAS */}
        {step === 1 && (
          <div className="wizard-step fade-in">
            <h3>
              {isPenitipan 
                ? 'Identitas Penitip' 
                : isPengambilan 
                  ? 'Identitas Pengambil' 
                  : type === 'wizard_pemakaian' 
                    ? 'Identitas Pemakai' 
                    : 'Identitas Pengembali'}
            </h3>
            <p>Masukkan identitas panitia yang bertanggung jawab atas transaksi ini.</p>
            
            <div className="wizard-form">
              <div className="form-group">
                <label>Nama Panitia *</label>
                <input 
                  type="text" 
                  value={actorName} 
                  onChange={e => setActorName(e.target.value)} 
                  placeholder="Contoh: Budi Santoso"
                  required
                />
              </div>
              <div className="form-group">
                <label>Nama Event / Divisi *</label>
                <input 
                  type="text" 
                  value={eventName} 
                  onChange={e => setEventName(e.target.value)} 
                  placeholder="Contoh: RTB 2026 - Logistik"
                  required
                />
              </div>
              {!isPenitipan && (
                <div className="form-group">
                  <label>Catatan Tambahan (Opsional)</label>
                  <textarea 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)} 
                    placeholder="Contoh: Untuk keperluan gladi bersih panggung utama..."
                    rows={3}
                  />
                </div>
              )}
            </div>
            
            <div className="wizard-actions">
              <button 
                className="btn-primary" 
                onClick={nextStep}
                disabled={!actorName.trim() || !eventName.trim()}
              >
                Lanjut ke Langkah 2 →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2A: PILIH BARANG KATALOG (Khusus Pemakaian & Pengembalian) */}
        {!isPenitipan && !isPengambilan && step === 2 && (
          <div className="wizard-step fade-in">
            <h3>Pilih Barang</h3>
            <p>Klik barang pada katalog di bawah untuk menambahkan ke daftar transaksi.</p>
            
            {cartItems.length > 0 && (
              <div className="local-cart">
                <h4>Barang Terpilih:</h4>
                <ul>
                  {cartItems.map(i => (
                    <li key={i.item.id} className="local-cart-item">
                      <span>{i.item.name}</span>
                      <div className="local-cart-actions">
                        <button onClick={() => handleUpdateQty(i.item.id, -1)}>-</button>
                        <span className="qty-badge">{i.quantity}</span>
                        <button onClick={() => handleUpdateQty(i.item.id, 1)}>+</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="catalog-wrapper">
              <CatalogPage onItemClick={handleItemClick} />
            </div>

            <div className="wizard-actions">
              <button className="btn-secondary" onClick={prevStep}>← Kembali</button>
              <button 
                className="btn-primary" 
                onClick={nextStep}
                disabled={cartItems.length === 0}
              >
                Lanjut ke Konfirmasi →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2B: DETAIL BARANG TITIPAN & FOTO (Khusus Penitipan) */}
        {isPenitipan && step === 2 && (
          <div className="wizard-step fade-in">
            <h3>Detail Barang Titipan</h3>
            <p>Masukkan informasi barang dari luar yang dititipkan ke dalam gudang.</p>
            
            <div className="wizard-form">
              <div className="form-group">
                <label>Nama Barang yang Dititipkan *</label>
                <input 
                  type="text" 
                  value={depositItemName} 
                  onChange={e => setDepositItemName(e.target.value)} 
                  placeholder="Contoh: Banner Backdrop 3x4m & Standing Stand"
                  required
                />
              </div>

              <div className="form-group">
                <label>Rincian / Keterangan Barang *</label>
                <textarea 
                  value={depositItemDescription} 
                  onChange={e => setDepositItemDescription(e.target.value)} 
                  placeholder="Contoh: 1 tas kain hitam berisi tiang standing tripod dan 2 rol banner backdrop."
                  rows={3}
                  required
                />
              </div>

              <PhotoUpload 
                label="Upload Foto Bukti Barang Dititipkan"
                hint="Wajib upload foto barang yang dititipkan (otomatis dikompresi)"
                value={proofPhotoFile}
                previewUrl={proofPhotoPreview}
                onChange={({ file, previewUrl }) => {
                  setProofPhotoFile(file)
                  setProofPhotoPreview(previewUrl)
                }}
                required={true}
              />
            </div>

            <div className="wizard-actions">
              <button className="btn-secondary" onClick={prevStep}>← Kembali</button>
              <button 
                className="btn-primary" 
                onClick={nextStep}
                disabled={!depositItemName.trim() || !depositItemDescription.trim() || !proofPhotoFile}
              >
                Lanjut ke Konfirmasi →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2C: PILIH BARANG TITIPAN (Khusus Pengambilan) */}
        {isPengambilan && step === 2 && (
          <div className="wizard-step fade-in">
            <h3>Pilih Barang Titipan yang Mau Diambil</h3>
            <p>Pilih salah satu barang titipan dari daftar aktif di bawah ini.</p>
            
            <div style={{ margin: 'var(--space-4) 0' }}>
              <DepositedItemsList 
                isSelectMode={true}
                selectedDepositId={selectedDeposit?.id}
                onSelect={(depositItem) => setSelectedDeposit(depositItem)}
              />
            </div>

            {/* Foto Bukti Pengambilan (Opsional) */}
            <div style={{ marginTop: 'var(--space-6)' }}>
              <PhotoUpload 
                label="Upload Foto Bukti Serah Terima / Pengambilan (Opsional)"
                hint="Foto bukti barang sudah diserahkan kembali kepada pemiliknya"
                value={proofPhotoFile}
                previewUrl={proofPhotoPreview}
                onChange={({ file, previewUrl }) => {
                  setProofPhotoFile(file)
                  setProofPhotoPreview(previewUrl)
                }}
              />
            </div>

            <div className="wizard-actions">
              <button className="btn-secondary" onClick={prevStep}>← Kembali</button>
              <button 
                className="btn-primary" 
                onClick={nextStep}
                disabled={!selectedDeposit}
              >
                Lanjut ke Konfirmasi →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: KONFIRMASI TRANSAKSI */}
        {step === 3 && (
          <div className="wizard-step fade-in">
            <h3>Konfirmasi Transaksi</h3>
            <p>Periksa kembali rincian transaksi sebelum mengirim ke sistem.</p>
            
            <div className="summary-box">
              <p><strong>Nama Panitia:</strong> {actorName}</p>
              <p><strong>Divisi / Event:</strong> {eventName}</p>
              
              {isPenitipan ? (
                <>
                  <p><strong>Barang Dititipkan:</strong> {depositItemName}</p>
                  <p><strong>Rincian:</strong> {depositItemDescription}</p>
                </>
              ) : isPengambilan && selectedDeposit ? (
                <>
                  <p><strong>Barang yang Diambil:</strong> {selectedDeposit.notes || 'Barang Titipan'}</p>
                  <p><strong>Penitip Asal:</strong> {selectedDeposit.depositor_name || selectedDeposit.actor_name}</p>
                  <p><strong>Divisi Asal:</strong> {selectedDeposit.event_name || '-'}</p>
                </>
              ) : (
                notes && <p><strong>Catatan:</strong> {notes}</p>
              )}
            </div>

            {/* Pratinjau Barang untuk Pemakaian / Pengembalian */}
            {!isPenitipan && !isPengambilan && (
              <div className="summary-items">
                <h4>Daftar Barang:</h4>
                <ul>
                  {cartItems.map(i => (
                    <li key={i.item.id}>
                      {i.quantity}x {i.item.name}
                    </li>
                  ))}
                </ul>

                {/* Upload Bukti Opsional untuk Pemakaian / Pengembalian */}
                <div style={{ marginTop: 'var(--space-6)' }}>
                  <PhotoUpload 
                    label="Upload Foto Bukti Transaksi (Opsional)"
                    hint="Foto bukti serah terima barang (opsional)"
                    value={proofPhotoFile}
                    previewUrl={proofPhotoPreview}
                    onChange={({ file, previewUrl }) => {
                      setProofPhotoFile(file)
                      setProofPhotoPreview(previewUrl)
                    }}
                  />
                </div>
              </div>
            )}

            {/* Pratinjau Foto Bukti untuk Penitipan / Pengambilan */}
            {proofPhotoPreview && (
              <div style={{ marginTop: 'var(--space-4)' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 'var(--space-2)' }}>
                  Foto Bukti Transaksi:
                </label>
                <img 
                  src={proofPhotoPreview} 
                  alt="Bukti Transaksi" 
                  style={{ width: '100%', maxHeight: '240px', objectFit: 'contain', borderRadius: 'var(--radius-md)', background: 'var(--bg-base)', border: '1px solid var(--bg-border)' }} 
                />
              </div>
            )}

            <div className="wizard-actions">
              <button className="btn-secondary" onClick={prevStep} disabled={isSubmitting}>
                ← Kembali
              </button>
              <button 
                className="btn-success" 
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (submitStatusText || 'Memproses...') : 'Kirim Transaksi'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default TransactionWizard

