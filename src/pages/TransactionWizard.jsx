import React, { useState } from 'react'
import CatalogPage from './CatalogPage'
import { supabase } from '../lib/supabaseClient'
import './TransactionWizard.css'

export default function TransactionWizard({ type, onCancel }) {
  // type: 'wizard_pemakaian', 'wizard_pengembalian', 'wizard_penitipan'
  const [step, setStep] = useState(1)
  
  // Data Identitas
  const [actorName, setActorName] = useState('')
  const [eventName, setEventName] = useState('')
  const [notes, setNotes] = useState('')
  // Untuk MVP, photo dikosongkan/mock dulu sampai kompresi gambar diimplementasikan
  const [proofPhotoUrl, setProofPhotoUrl] = useState('') 

  // Keranjang lokal untuk transaksi ini
  const [cartItems, setCartItems] = useState([])
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  
  const isPenitipan = type === 'wizard_penitipan'
  
  // Judul
  let title = ''
  if (type === 'wizard_pemakaian') title = 'Pemakaian Barang'
  if (type === 'wizard_pengembalian') title = 'Pengembalian Barang'
  if (type === 'wizard_penitipan') title = 'Penitipan Barang'

  // Navigasi Step
  const nextStep = () => setStep((s) => s + 1)
  const prevStep = () => setStep((s) => s - 1)

  // Logika Cart Lokal
  const handleItemClick = (item) => {
    // 1. Validasi untuk transaksi Pengembalian
    if (type === 'wizard_pengembalian') {
      if (item.stock_in_use <= 0) {
        alert('Tidak ada unit barang ini yang sedang dipakai/dipinjam.')
        return
      }
    }

    // 2. Validasi untuk transaksi Pemakaian
    if (type === 'wizard_pemakaian' && item.stock_available <= 0) {
      alert('Stok barang tersedia habis!')
      return
    }

    setCartItems(prev => {
      const existing = prev.find(i => i.item.id === item.id)
      if (existing) {
        // Cek limit stok untuk Pemakaian (max: stock_available)
        if (type === 'wizard_pemakaian' && existing.quantity >= item.stock_available) {
          alert(`Kuantitas pemakaian tidak boleh melebihi stok tersedia (${item.stock_available} ${item.unit}).`)
          return prev
        }
        // Cek limit stok untuk Pengembalian (max: stock_in_use)
        if (type === 'wizard_pengembalian' && existing.quantity >= item.stock_in_use) {
          alert(`Kuantitas pengembalian tidak boleh melebihi jumlah yang sedang dipinjam (${item.stock_in_use} ${item.unit}).`)
          return prev
        }
        return prev.map(i => i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      }

      // Kuantitas awal = 1
      return [...prev, { item, quantity: 1 }]
    })
  }

  const handleUpdateQty = (itemId, delta) => {
    setCartItems(prev => {
      return prev.map(i => {
        if (i.item.id === itemId) {
          const newQty = i.quantity + delta
          if (newQty <= 0) return null // Hapus item jika kuantitas jadi 0

          // Validasi batas maksimum Pemakaian
          if (type === 'wizard_pemakaian' && newQty > i.item.stock_available) {
            alert(`Kuantitas tidak boleh melebihi stok tersedia (${i.item.stock_available} ${i.item.unit}).`)
            return i
          }

          // Validasi batas maksimum Pengembalian
          if (type === 'wizard_pengembalian' && newQty > i.item.stock_in_use) {
            alert(`Kuantitas tidak boleh melebihi jumlah yang sedang dipinjam (${i.item.stock_in_use} ${i.item.unit}).`)
            return i
          }

          return { ...i, quantity: newQty }
        }
        return i
      }).filter(Boolean)
    })
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setErrorMsg('')
    try {
      // Map format item untuk RPC: [{"item_id": "...", "quantity": 1}]
      const cartJson = cartItems.map(i => ({
        item_id: i.item.id,
        quantity: i.quantity
      }))

      // Penitipan tidak kirim cart
      const finalCart = isPenitipan ? [] : cartJson
      
      const transactionTypeString = type.replace('wizard_', '') // 'pemakaian', 'pengembalian', 'penitipan'

      const { data, error } = await supabase.rpc('process_checkout_transaction', {
        p_transaction_type: transactionTypeString,
        p_actor_name: actorName,
        p_event_name: eventName,
        p_proof_photo_url: proofPhotoUrl || null,
        p_notes: notes || null,
        p_cart_items: finalCart
      })

      if (error) throw error
      
      alert('Transaksi berhasil dikirim!')
      onCancel() // Kembali ke dashboard
    } catch (err) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat memproses transaksi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="wizard-container">
      <header className="wizard-header">
        <button className="btn-back" onClick={onCancel} disabled={isSubmitting}>← Batal</button>
        <h2>{title}</h2>
        <div className="wizard-progress">Langkah {step} dari {isPenitipan ? 2 : 3}</div>
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
            <h3>Identitas Peminjam</h3>
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
              <div className="form-group">
                <label>Catatan Tambahan (Opsional)</label>
                <textarea 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  placeholder={isPenitipan ? "Sebutkan barang-barang apa saja yang dititipkan..." : "Catatan tambahan..."}
                  rows={4}
                />
              </div>
            </div>
            
            <div className="wizard-actions">
              <button 
                className="btn-primary" 
                onClick={nextStep}
                disabled={!actorName.trim() || !eventName.trim()}
              >
                Lanjut →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PILIH BARANG (Dilewati jika Penitipan) */}
        {!isPenitipan && step === 2 && (
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

        {/* STEP 3 (atau 2 jika Penitipan): KONFIRMASI */}
        {((!isPenitipan && step === 3) || (isPenitipan && step === 2)) && (
          <div className="wizard-step fade-in">
            <h3>Konfirmasi Transaksi</h3>
            
            <div className="summary-box">
              <p><strong>Nama:</strong> {actorName}</p>
              <p><strong>Event:</strong> {eventName}</p>
              {notes && <p><strong>Catatan:</strong> {notes}</p>}
            </div>

            {!isPenitipan && (
              <div className="summary-items">
                <h4>Daftar Barang:</h4>
                <ul>
                  {cartItems.map(i => (
                    <li key={i.item.id}>
                      {i.quantity}x {i.item.name}
                    </li>
                  ))}
                </ul>
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
                {isSubmitting ? 'Memproses...' : 'Kirim Transaksi'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
