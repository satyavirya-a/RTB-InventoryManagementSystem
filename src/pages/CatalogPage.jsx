/**
 * CatalogPage.jsx — Halaman utama: daftar semua barang aktif dalam grid responsif.
 *
 * Halaman ini bertugas:
 * 1. Mengambil data barang via custom hook useItems()
 * 2. Menampilkan search bar untuk filter barang
 * 3. Me-render grid ItemCard dalam layout responsif
 * 4. Menangani state loading dan empty state
 *
 * Pola arsitektur:
 * CatalogPage (smart/container) → mengambil data, mengatur state
 *   └─ ItemCard (dumb/presentational) → hanya tampilkan data yang diterima
 *
 * @returns {JSX.Element}
 */
import { useState } from 'react'
import { useItems } from '../hooks/useItems'
import ItemCard from '../components/ItemCard'
import ItemDetailModal from '../components/ItemDetailModal'
import '../components/ItemCard.css'

function CatalogPage() {
  const { items, isLoading, error, searchQuery, setSearchQuery, totalItems } = useItems()
  const [selectedItem, setSelectedItem] = useState(null)

  return (
    <div className="catalog-page">
      {/* === Header Halaman === */}
      <div className="catalog-header">
        <div className="catalog-header__title-group">
          <h2 className="catalog-header__title">Katalog Barang</h2>
          {/* Tampilkan jumlah hasil hanya saat tidak loading */}
          {!isLoading && (
            <span className="catalog-header__count">
              {searchQuery
                ? `${items.length} dari ${totalItems} barang`
                : `${totalItems} barang tersedia`}
            </span>
          )}
        </div>

        {/* === Search Bar === */}
        <div className="catalog-search">
          <span className="catalog-search__icon" aria-hidden="true">🔍</span>
          <input
            id="catalog-search-input"
            type="search"
            className="catalog-search__input"
            placeholder="Cari nama barang..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Cari barang"
          />
          {/* Tombol hapus search yang muncul saat ada teks */}
          {searchQuery && (
            <button
              className="catalog-search__clear"
              onClick={() => setSearchQuery('')}
              aria-label="Hapus pencarian"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* === State: Loading === */}
      {isLoading && (
        <div className="catalog-state catalog-state--loading" aria-live="polite">
          <div className="catalog-skeleton-grid">
            {/* Render 6 skeleton card sebagai placeholder saat loading */}
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="skeleton-card" aria-hidden="true">
                <div className="skeleton skeleton--image" />
                <div className="skeleton-card__body">
                  <div className="skeleton skeleton--text skeleton--text-lg" />
                  <div className="skeleton skeleton--text" />
                  <div className="skeleton skeleton--badge" />
                  <div className="skeleton skeleton--btn" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === State: Error === */}
      {!isLoading && error && (
        <div className="catalog-state catalog-state--error" role="alert">
          <span className="catalog-state__icon">⚠️</span>
          <p className="catalog-state__title">Gagal memuat katalog</p>
          <p className="catalog-state__message">{error}</p>
        </div>
      )}

      {/* === State: Empty (tidak ada barang atau tidak ada hasil search) === */}
      {!isLoading && !error && items.length === 0 && (
        <div className="catalog-state catalog-state--empty">
          <span className="catalog-state__icon">
            {searchQuery ? '🔍' : '📦'}
          </span>
          <p className="catalog-state__title">
            {searchQuery ? `Tidak ada barang "${searchQuery}"` : 'Belum ada barang'}
          </p>
          <p className="catalog-state__message">
            {searchQuery
              ? 'Coba kata kunci lain atau hapus filter pencarian.'
              : 'Barang akan muncul di sini setelah ditambahkan ke gudang.'}
          </p>
          {searchQuery && (
            <button
              className="catalog-state__action-btn"
              onClick={() => setSearchQuery('')}
            >
              Hapus Pencarian
            </button>
          )}
        </div>
      )}

      {/* === Grid Barang === */}
      {!isLoading && !error && items.length > 0 && (
        <div className="catalog-grid" role="list" aria-label="Daftar barang">
          {items.map((item) => (
            <div key={item.id} role="listitem">
              <ItemCard item={item} onClick={() => setSelectedItem(item)} />
            </div>
          ))}
        </div>
      )}

      {/* Render modal jika ada barang yang dipilih */}
      <ItemDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  )
}

export default CatalogPage
