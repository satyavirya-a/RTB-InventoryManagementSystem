/**
 * ItemDetailModal.jsx — Modal pop-up untuk menampilkan detail lengkap barang.
 *
 * Ditampilkan saat user mengklik ItemCard di katalog.
 * Memiliki fungsi untuk menambah barang ke keranjang secara langsung.
 *
 * @param {object} props
 * @param {object} props.item - Data barang yang sedang ditampilkan
 * @param {Function} props.onClose - Callback saat modal ditutup
 */
import { useEffect } from 'react'
import { useCart } from '../contexts/CartContext'
import './ItemDetailModal.css'

function ItemDetailModal({ item, onClose }) {
  const { addToCart, cartItems } = useCart()

  // Mencegah body scrolling saat modal terbuka
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  // Menutup modal dengan tombol Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!item) return null

  const isConsumable = item.is_consumable
  const isOutOfStock = item.stock_available === 0

  // Status barang di keranjang
  const cartEntry = cartItems.find((e) => e.item.id === item.id)
  const qtyInCart = cartEntry ? cartEntry.quantity : 0
  const isMaxInCart = qtyInCart >= item.stock_available

  return (
    <>
      {/* Overlay Gelap */}
      <div className="modal-overlay" onClick={onClose} aria-hidden="true" />

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
            <span className={`item-modal__type-badge ${isConsumable ? 'consumable' : 'non-consumable'}`}>
              {isConsumable ? 'HABIS PAKAI' : 'PINJAM'}
            </span>
          </div>

          {/* Info Stok Lengkap */}
          <div className="item-modal__stock-info">
            <div className="stock-box available">
              <span className="stock-box__label">Tersedia</span>
              <span className="stock-box__value">{item.stock_available} {item.unit}</span>
            </div>
            {!isConsumable && (
              <div className="stock-box in-use">
                <span className="stock-box__label">Sedang Dipinjam</span>
                <span className="stock-box__value">{item.stock_in_use} {item.unit}</span>
              </div>
            )}
          </div>

          <p className="item-modal__description">
            {item.description || 'Tidak ada deskripsi tersedia untuk barang ini.'}
          </p>

          {/* Tombol Aksi */}
          <div className="item-modal__actions">
            <button
              className="item-modal__add-btn"
              disabled={isOutOfStock || isMaxInCart}
              onClick={() => addToCart(item, 1)}
            >
              {isOutOfStock
                ? 'Stok Habis'
                : isMaxInCart
                  ? `Sudah Max di Keranjang (${qtyInCart})`
                  : '+ Tambah ke Keranjang'
              }
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default ItemDetailModal
