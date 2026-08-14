/**
 * ItemCard.jsx — Komponen kartu untuk satu item barang di katalog.
 *
 * Komponen ini menerima data barang via props dan menampilkannya sebagai kartu.
 * ItemCard TIDAK fetch data sendiri — data dikirim dari komponen induk (CatalogPage).
 * Ini adalah prinsip "dumb/presentational component": fokus hanya pada tampilan.
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
 * @param {Function} [props.onClick] - Callback saat card diklik
 * @param {React.ReactNode} [props.action] - Tombol aksi custom (jika ada)
 */
function ItemCard({ item, onClick, action }) {
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

  const stockBadge = getStockBadgeInfo(item.stock_available)

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
          <div className="item-card__image-placeholder" aria-hidden="true">
            📦
          </div>
        )}
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

          {/* Tampilkan unit yang sedang dipakai/dipinjam jika ada */}
          {item.stock_in_use > 0 && (
            <span className="item-card__in-use">
              {item.stock_in_use} dipakai
            </span>
          )}
        </div>

        {/* === Custom Action === */}
        {action && (
          <div className="item-card__action-container" onClick={(e) => e.stopPropagation()}>
            {action}
          </div>
        )}
      </div>
    </article>
  )
}

export default ItemCard
