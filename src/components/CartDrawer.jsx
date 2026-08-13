/**
 * CartDrawer.jsx — Panel keranjang yang muncul dari kanan layar.
 *
 * Drawer ini menampilkan semua barang yang sudah ditambahkan ke cart,
 * dengan kontrol quantity per item dan tombol untuk melanjutkan ke checkout.
 *
 * Komponen ini bersifat "controlled" — terbuka/tutupnya diatur oleh parent
 * lewat props `isOpen` dan `onClose`, bukan state internal.
 *
 * @param {object}   props
 * @param {boolean}  props.isOpen  - Apakah drawer sedang terbuka
 * @param {Function} props.onClose - Callback untuk menutup drawer
 * @param {Function} props.onCheckout - Callback untuk lanjut ke form checkout
 */
import { useCart } from '../contexts/CartContext'
import './CartDrawer.css'

function CartDrawer({ isOpen, onClose, onCheckout }) {
  const { cartItems, totalQuantity, removeFromCart, updateQuantity, clearCart } = useCart()

  const isEmpty = cartItems.length === 0

  return (
    <>
      {/* === Overlay (area gelap di belakang drawer) === */}
      {isOpen && (
        <div
          className="cart-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* === Drawer Panel === */}
      <aside
        className={`cart-drawer ${isOpen ? 'cart-drawer--open' : ''}`}
        aria-label="Keranjang belanja"
        aria-hidden={!isOpen}
      >
        {/* --- Header Drawer --- */}
        <div className="cart-drawer__header">
          <div className="cart-drawer__title-group">
            <h2 className="cart-drawer__title">🛒 Keranjang</h2>
            {totalQuantity > 0 && (
              <span className="cart-drawer__count">{totalQuantity} item</span>
            )}
          </div>

          <div className="cart-drawer__header-actions">
            {/* Tombol kosongkan cart — hanya tampil jika ada isi */}
            {!isEmpty && (
              <button
                className="cart-drawer__clear-btn"
                onClick={clearCart}
                aria-label="Kosongkan keranjang"
              >
                Kosongkan
              </button>
            )}

            {/* Tombol tutup */}
            <button
              className="cart-drawer__close-btn"
              onClick={onClose}
              aria-label="Tutup keranjang"
            >
              ✕
            </button>
          </div>
        </div>

        {/* --- Isi Cart --- */}
        <div className="cart-drawer__body">
          {/* State: Cart Kosong */}
          {isEmpty ? (
            <div className="cart-drawer__empty">
              <span className="cart-drawer__empty-icon">🛒</span>
              <p className="cart-drawer__empty-text">Keranjang masih kosong</p>
              <p className="cart-drawer__empty-hint">
                Tambahkan barang dari katalog
              </p>
            </div>
          ) : (
            /* Daftar Item Cart */
            <ul className="cart-items-list" role="list">
              {cartItems.map(({ item, quantity }) => (
                <li key={item.id} className="cart-item" role="listitem">
                  {/* Foto kecil atau placeholder */}
                  <div className="cart-item__image">
                    {item.photo_url ? (
                      <img src={item.photo_url} alt={item.name} loading="lazy" />
                    ) : (
                      <span aria-hidden="true">📦</span>
                    )}
                  </div>

                  {/* Info Barang */}
                  <div className="cart-item__info">
                    <p className="cart-item__name">{item.name}</p>
                    <p className="cart-item__meta">
                      Maks {item.stock_available} {item.unit}
                    </p>
                  </div>

                  {/* Kontrol Quantity */}
                  <div className="cart-item__qty-control">
                    <button
                      className="cart-item__qty-btn"
                      onClick={() => {
                        if (quantity <= 1) {
                          removeFromCart(item.id) // Hapus jika sudah di 1
                        } else {
                          updateQuantity(item.id, quantity - 1)
                        }
                      }}
                      aria-label={`Kurangi ${item.name}`}
                    >
                      −
                    </button>

                    <span className="cart-item__qty-value">{quantity}</span>

                    <button
                      className="cart-item__qty-btn"
                      onClick={() => updateQuantity(item.id, quantity + 1)}
                      disabled={quantity >= item.stock_available}
                      aria-label={`Tambah ${item.name}`}
                    >
                      +
                    </button>
                  </div>

                  {/* Tombol hapus */}
                  <button
                    className="cart-item__remove-btn"
                    onClick={() => removeFromCart(item.id)}
                    aria-label={`Hapus ${item.name} dari keranjang`}
                    title="Hapus dari keranjang"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* --- Footer: Tombol Checkout --- */}
        {!isEmpty && (
          <div className="cart-drawer__footer">
            <p className="cart-drawer__footer-summary">
              {cartItems.length} jenis barang · {totalQuantity} item total
            </p>
            <button
              id="btn-checkout"
              className="cart-drawer__checkout-btn"
              onClick={onCheckout}
            >
              Lanjut ke Checkout →
            </button>
          </div>
        )}
      </aside>
    </>
  )
}

export default CartDrawer
