/**
 * ItemDetailModal.jsx — Modal pop-up untuk menampilkan detail lengkap barang dan aksi PIC (Hapus Barang).
 *
 * Komponen ini ditampilkan saat panitia mengklik salah satu kartu barang (ItemCard) di katalog.
 * Berisi informasi foto, status stok (tersedia & sedang dipinjam), deskripsi,
 * daftar nama peminjam aktif, serta tombol aksi "Hapus Barang" untuk PIC Gudang.
 *
 * @param {object} props
 * @param {object} props.item - Data barang yang dipilih dari tabel items
 * @param {Function} props.onClose - Callback function untuk menutup modal
 * @param {Function} [props.onItemDeleted] - Callback saat barang berhasil dihapus dari katalog
 */
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import './ItemDetailModal.css'

function ItemDetailModal({ item, onClose, onItemDeleted }) {
  // State untuk menyimpan daftar peminjam / pemakai aktif
  const [activeLoans, setActiveLoans] = useState([])
  const [isLoadingLoans, setIsLoadingLoans] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Mencegah background body scrolling saat modal pop-up sedang aktif
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  // Menutup modal secara instan jika user menekan tombol 'Escape' di keyboard
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isDeleting) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDeleting, onClose])

  // Mengambil data peminjam/pemakai aktif dari SQL View 'active_loans'
  useEffect(() => {
    async function fetchLoans() {
      if (!item || item.stock_in_use === 0) return

      setIsLoadingLoans(true)
      try {
        // Menggunakan select('*') agar fleksibel terhadap nama kolom
        const { data, error } = await supabase
          .from('active_loans')
          .select('*')
          .eq('item_id', item.id)

        if (error) throw error
        if (data) setActiveLoans(data)
      } catch (err) {
        console.error('Gagal mengambil data peminjam dari active_loans:', err)
      } finally {
        setIsLoadingLoans(false)
      }
    }
    fetchLoans()
  }, [item])

  /**
   * Menangani aksi hapus barang dari katalog oleh PIC Gudang.
   * Menggunakan metode Soft-Delete (set status = 'archived') dan mencatat transaksi 'penghapusan'.
   */
  const handleDeleteItem = async () => {
    const confirmMessage = item.stock_in_use > 0
      ? `PERINGATAN: Barang "${item.name}" masih memiliki ${item.stock_in_use} ${item.unit} yang sedang dibawa/dipinjam oleh panitia.\n\nApakah Anda yakin tetap ingin menghapus barang ini dari katalog aktif?`
      : `Apakah Anda yakin ingin menghapus barang "${item.name}" dari katalog inventaris?`

    if (!window.confirm(confirmMessage)) return

    setIsDeleting(true)
    try {
      // 1. Soft-delete barang di tabel items (status = 'archived')
      const { error: updateError } = await supabase
        .from('items')
        .update({ status: 'archived' })
        .eq('id', item.id)

      if (updateError) throw updateError

      // 2. Catat riwayat aksi penghapusan ke tabel transactions
      const { data: transData, error: transError } = await supabase
        .from('transactions')
        .insert({
          transaction_type: 'penghapusan',
          actor_name: 'PIC Gudang',
          event_name: 'Manajemen Inventaris',
          notes: `Menghapus barang "${item.name}" dari katalog aktif. (Stok terakhir: ${item.stock_available} ${item.unit})`
        })
        .select()
        .single()

      if (transError) {
        console.warn('Gagal mencatat transaksi log penghapusan (mungkin perlu update check constraint):', transError)
      }

      // 3. Catat detail barang yang dihapus jika log berhasil
      if (transData) {
        await supabase.from('transaction_details').insert({
          transaction_id: transData.id,
          item_id: item.id,
          quantity: Math.max(1, item.stock_available)
        })
      }

      alert(`Barang "${item.name}" berhasil dihapus dari katalog!`)
      if (onItemDeleted) {
        onItemDeleted(item.id)
      }
      onClose()
    } catch (err) {
      console.error('Gagal menghapus barang:', err)
      alert(`Gagal menghapus barang: ${err.message || 'Terjadi kesalahan sistem'}`)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!item) return null

  return (
    <>
      {/* Overlay Gelap */}
      <div className="modal-overlay" onClick={() => !isDeleting && onClose()} aria-hidden="true" />

      {/* Container Modal */}
      <div
        className="item-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <button
          className="item-modal__close-btn"
          onClick={onClose}
          disabled={isDeleting}
          aria-label="Tutup detail barang"
        >
          ✕
        </button>

        {/* Gambar Barang */}
        <div className="item-modal__image-container">
          {item.photo_url ? (
            <img src={item.photo_url} alt={item.name} className="item-modal__image" />
          ) : (
            <div className="item-modal__image-placeholder">📦</div>
          )}
        </div>

        {/* Konten Detail */}
        <div className="item-modal__content">
          <div className="item-modal__header">
            <h2 id="modal-title" className="item-modal__title">{item.name}</h2>
          </div>

          {/* Info Stok Lengkap */}
          <div className="item-modal__stock-info">
            <div className="stock-box available">
              <span className="stock-box__label">Tersedia</span>
              <span className="stock-box__value">{item.stock_available} {item.unit}</span>
            </div>
            {item.stock_in_use > 0 && (
              <div className="stock-box in-use">
                <span className="stock-box__label">Sedang Dipakai</span>
                <span className="stock-box__value">{item.stock_in_use} {item.unit}</span>
              </div>
            )}
          </div>

          <p className="item-modal__description">
            {item.description || 'Tidak ada deskripsi tersedia untuk barang ini.'}
          </p>

          {/* Daftar Pemakai / Peminjam Aktif */}
          {item.stock_in_use > 0 && (
            <div className="item-modal__borrowers">
              <h4 className="item-modal__borrowers-title">Sedang Dibawa Oleh:</h4>
              {isLoadingLoans ? (
                <p className="item-modal__borrowers-loading">Memuat data pemakai...</p>
              ) : activeLoans.length > 0 ? (
                <ul className="item-modal__borrowers-list">
                  {activeLoans.map((loan, idx) => (
                    <li key={idx}>
                      <span>
                        <strong>{loan.actor_name}</strong>
                        {loan.event_name && <span className="item-modal__borrower-event"> ({loan.event_name})</span>}
                      </span>
                      <span>
                        {loan.qty_borrowed ?? loan.unreturned_quantity ?? 0} {item.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="item-modal__borrowers-empty">Belum ada data pemakai tercatat.</p>
              )}
            </div>
          )}

          {/* Aksi Hapus Barang untuk PIC Gudang */}
          <div className="item-modal__footer-actions">
            <button
              type="button"
              className="btn-delete-item"
              onClick={handleDeleteItem}
              disabled={isDeleting}
              aria-label="Hapus barang ini dari katalog"
            >
              <span className="btn-delete-icon">🗑️</span>
              <span>{isDeleting ? 'Menghapus...' : 'Hapus Barang dari Katalog'}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default ItemDetailModal

