/**
 * ItemCard.jsx — Komponen kartu untuk satu item barang di katalog.
 *
 * Komponen ini menerima data barang via props dan menampilkannya sebagai kartu.
 * ItemCard TIDAK fetch data sendiri — data dikirim dari komponen induk (CatalogPage).
 * Ini adalah prinsip "dumb/presentational component": fokus hanya tampilan.
 *
 * @param {object} props
 * @param {object} props.item - Data barang dari tabel items
 * @param {string} props.item.id
 * @param {string} props.item.name
 * @param {string} [props.item.description]
 * @param {string} [props.item.photo_url]
 * @param {boolean} props.item.is_consumable
 * @param {number} props.item.stock_available
 * @param {number} props.item.stock_in_use
 * @param {string} props.item.unit
 * @param {Function} [props.onClick] - Callback saat card diklik (untuk buka modal)
 */
import { useCart } from '../contexts/CartContext'

function ItemCard({ item, onClick }) {
  const { addToCart, cartItems } = useCart()
  /**
   * Menentukan warna dan label badge stok berdasarkan jumlah stok tersedia.
   * Logika ini membantu panitia langsung tahu urgensi stok tanpa hitung manual.
   *
   * @param {number} stock - Jumlah stok tersedia
   * @returns {{ label: string, modifier: string }}
   */
  function getStockBadgeInfo(stock) {
    if (stock === 0)  return { label: 'Habis',        modifier: 'danger'  }
    if (stock <= 3)   return { label: `Sisa ${stock}`, modifier: 'warning' }
    return               { label: `${stock} tersedia`, modifier: 'success' }
  }

  const stockBadge     = getStockBadgeInfo(item.stock_available)
  const isConsumable   = item.is_consumable
  const isOutOfStock   = item.stock_available === 0

  // Cek apakah barang ini sudah di cart
  const cartEntry    = cartItems.find((e) => e.item.id === item.id)
  const qtyInCart    = cartEntry ? cartEntry.quantity : 0
  const isMaxInCart  = qtyInCart >= item.stock_available

  return (
    <article
      className="item-card item-card--clickable"
      aria-label={`Barang: ${item.name}`}
      onClick={onClick}
    >
      {/* === Foto Barang === */}
      <div className="item-card__image-wrapper">
        {item.photo_url ? (
          <img
            src={item.photo_url}
            alt={item.name}
            className="item-card__image"
            loading="lazy" // Lazy load: gambar hanya dimuat saat masuk viewport
          />
        ) : (
          // Placeholder jika tidak ada foto
          <div className="item-card__image-placeholder" aria-hidden="true">
            📦
          </div>
        )}

        {/* Badge tipe barang (kanan atas foto) */}
        <span className={`item-card__type-badge item-card__type-badge--${isConsumable ? 'consumable' : 'non-consumable'}`}>
          {isConsumable ? 'Habis Pakai' : 'Pinjam'}
        </span>
      </div>

      {/* === Info Barang === */}
      <div className="item-card__body">
        <h3 className="item-card__name">{item.name}</h3>

        {item.description && (
          <p className="item-card__description">{item.description}</p>
        )}

        {/* === Stok Info === */}
        <div className="item-card__stock-row">
          <span className={`item-card__stock-badge item-card__stock-badge--${stockBadge.modifier}`}>
            {stockBadge.label} {item.unit}
          </span>

          {/* Tampilkan "X sedang dipinjam" khusus non-consumable */}
          {!isConsumable && item.stock_in_use > 0 && (
            <span className="item-card__in-use">
              {item.stock_in_use} dipinjam
            </span>
          )}
        </div>

        {/* === Tombol Aksi (placeholder untuk Fase 4) === */}
        <button
          className="item-card__btn"
          disabled={isOutOfStock || isMaxInCart}
          onClick={(e) => {
            e.stopPropagation() // Cegah event klik tembus ke <article> (yang membuka modal)
            addToCart(item, 1)
          }}
          aria-label={`Tambah ${item.name} ke keranjang`}
        >
          {isOutOfStock
            ? 'Stok Habis'
            : isMaxInCart
              ? `Di Keranjang (${qtyInCart})`
              : '+ Tambah ke Keranjang'
          }
        </button>
      </div>
    </article>
  )
}

export default ItemCard
