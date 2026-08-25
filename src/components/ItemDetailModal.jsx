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
 * @param {Function} [props.onOpenHistory] - Callback untuk membuka modal riwayat transaksi terfilter
 */
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import EditItemModal from './EditItemModal'
import { CATEGORY_ICONS } from '../lib/constants'
import './ItemDetailModal.css'

function ItemDetailModal({ item, onClose, onItemDeleted, onItemUpdated, onOpenHistory }) {
  // State data barang saat ini (bisa diperbarui saat diedit)
  const [currentItem, setCurrentItem] = useState(item)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Fallback data barang aktif
  const activeItem = currentItem || item || {}

  // State untuk menyimpan daftar peminjam / pemakai aktif
  const [activeLoans, setActiveLoans] = useState([])
  const [isLoadingLoans, setIsLoadingLoans] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Sinkronisasi data saat prop item berubah
  useEffect(() => {
    if (item) {
      setCurrentItem(item)
    }
  }, [item])

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
      if (e.key === 'Escape' && !isDeleting && !isEditModalOpen) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDeleting, isEditModalOpen, onClose])

  // Mengambil data peminjam/pemakai aktif dari SQL View 'active_loans'
  useEffect(() => {
    async function fetchLoans() {
      if (!activeItem || !activeItem.id || activeItem.stock_in_use === 0) return

      setIsLoadingLoans(true)
      try {
        // Menggunakan select('*') agar fleksibel terhadap nama kolom
        const { data, error } = await supabase
          .from('active_loans')
          .select('*')
          .eq('item_id', activeItem.id)

        if (error) throw error
        if (data) setActiveLoans(data)
      } catch (err) {
        console.error('Gagal mengambil data peminjam dari active_loans:', err)
      } finally {
        setIsLoadingLoans(false)
      }
    }
    fetchLoans()
  }, [activeItem.id, activeItem.stock_in_use])

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

      // 2. Catat audit trail di tabel transactions
      await supabase.from('transactions').insert({
        transaction_type: 'penghapusan',
        actor_name: 'PIC Gudang',
        event_name: 'Manajemen Inventaris',
        notes: `Barang "${item.name}" dinonaktifkan/dihapus dari katalog oleh PIC Gudang.`
      })

      alert(`Barang "${item.name}" berhasil dihapus dari katalog.`)
      if (onItemDeleted) onItemDeleted(item.id)
      onClose()
    } catch (err) {
      console.error('Gagal menghapus barang:', err)
      alert(`Gagal menghapus barang: ${err.message || 'Terjadi kesalahan sistem'}`)
    } finally {
      setIsDeleting(false)
    }
  }

  // Handler saat barang selesai diedit di EditItemModal
  const handleItemUpdated = (updatedItem) => {
    setCurrentItem(updatedItem)
    if (onItemUpdated) {
      onItemUpdated(updatedItem)
    }
  }

  if (!item) return null

  const categoryName = activeItem.category || 'Lain-lain'
  const categoryIcon = CATEGORY_ICONS[categoryName] || '📦'

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
          {activeItem.photo_url ? (
            <img src={activeItem.photo_url} alt={activeItem.name} className="item-modal__image" />
          ) : (
            <div className="item-modal__image-placeholder">📦</div>
          )}
        </div>

        {/* Konten Detail */}
        <div className="item-modal__content">
          <div className="item-modal__header">
            <div className="item-modal__tags">
              <span className="item-modal__category-badge">
                <span>{categoryIcon}</span> {categoryName}
              </span>
              <span className={`item-modal__type-badge ${activeItem.is_consumable ? 'consumable' : 'non-consumable'}`}>
                {activeItem.is_consumable ? '📦 Habis Pakai' : '🔄 Pinjam-Kembali'}
              </span>
            </div>
            <h2 id="modal-title" className="item-modal__title">{activeItem.name}</h2>
          </div>

          {/* Info Stok Lengkap */}
          <div className="item-modal__stock-info">
            <div className="stock-box available">
              <span className="stock-box__label">Tersedia</span>
              <span className="stock-box__value">{activeItem.stock_available ?? 0} {activeItem.unit || 'pcs'}</span>
            </div>
            {activeItem.stock_in_use > 0 && (
              <div className="stock-box in-use">
                <span className="stock-box__label">Sedang Dipakai</span>
                <span className="stock-box__value">{activeItem.stock_in_use} {activeItem.unit || 'pcs'}</span>
              </div>
            )}
          </div>

          <p className="item-modal__description">
            {activeItem.description || 'Tidak ada deskripsi tersedia untuk barang ini.'}
          </p>

          {/* Daftar Pemakai / Peminjam Aktif */}
          {activeItem.stock_in_use > 0 && (
            <div className="item-modal__borrowers">
              <div className="item-modal__borrowers-header">
                <h4 className="item-modal__borrowers-title">Sedang Dibawa Oleh:</h4>
                <span className="item-modal__borrowers-hint">Klik nama untuk lihat riwayat 🔍</span>
              </div>
              {isLoadingLoans ? (
                <p className="item-modal__borrowers-loading">Memuat data pemakai...</p>
              ) : activeLoans.length > 0 ? (
                <ul className="item-modal__borrowers-list">
                  {activeLoans.map((loan, idx) => (
                    <li 
                      key={idx}
                      className="item-modal__borrower-item"
                      onClick={() => {
                        onClose()
                        if (onOpenHistory) {
                          onOpenHistory(loan.actor_name, 'pemakaian')
                        }
                      }}
                      title={`Klik untuk melihat riwayat transaksi ${loan.actor_name}`}
                    >
                      <div className="borrower-info">
                        <strong>👤 {loan.actor_name}</strong>
                        {loan.event_name && <span className="item-modal__borrower-event"> ({loan.event_name})</span>}
                      </div>
                      <div className="borrower-right">
                        <span className="borrower-qty">
                          {loan.qty_borrowed ?? loan.unreturned_quantity ?? 0} {activeItem.unit || 'pcs'}
                        </span>
                        <span className="borrower-arrow">→</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="item-modal__borrowers-empty">Belum ada data pemakai tercatat.</p>
              )}
            </div>
          )}

          {/* Aksi PIC Gudang: Edit Data / Ganti Foto & Hapus Barang */}
          <div className="item-modal__footer-actions">
            <button
              type="button"
              className="btn-edit-item"
              onClick={() => setIsEditModalOpen(true)}
              disabled={isDeleting}
              aria-label="Edit data dan foto barang"
            >
              <span className="btn-edit-icon">✏️</span>
              <span>Edit Data & Foto</span>
            </button>

            <button
              type="button"
              className="btn-delete-item"
              onClick={handleDeleteItem}
              disabled={isDeleting}
              aria-label="Hapus barang ini dari katalog"
            >
              <span className="btn-delete-icon">🗑️</span>
              <span>{isDeleting ? 'Menghapus...' : 'Hapus'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Form Edit Data & Ganti Foto */}
      <EditItemModal
        isOpen={isEditModalOpen}
        item={activeItem}
        onClose={() => setIsEditModalOpen(false)}
        onItemUpdated={(updated) => {
          setCurrentItem(updated)
          if (onItemUpdated) {
            onItemUpdated(updated)
          }
        }}
      />
    </>
  )
}

export default ItemDetailModal

