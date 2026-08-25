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
 * @param {object} props
 * @param {Function} [props.onItemClick] - Jika diberikan, klik barang akan memanggil fungsi ini (digunakan di dalam TransactionWizard)
 * @returns {JSX.Element}
 */
import { useState, useMemo } from 'react'
import { useItems } from '../hooks/useItems'
import ItemCard from '../components/ItemCard'
import ItemDetailModal from '../components/ItemDetailModal'
import AddItemModal from '../components/AddItemModal'
import { supabase } from '../lib/supabaseClient'
import { syncAllItemsToGoogle } from '../lib/googleSyncService'
import { ITEM_CATEGORIES, CATEGORY_ICONS } from '../lib/constants'
import '../components/ItemCard.css'

function CatalogPage({ onItemClick, onOpenHistory, cartItems = [], wizardType = null }) {
  const { 
    items, 
    isLoading, 
    error, 
    searchQuery, 
    setSearchQuery, 
    selectedCategory, 
    setSelectedCategory, 
    categoryCounts, 
    totalItems, 
    refetch 
  } = useItems()
  const [selectedItem, setSelectedItem] = useState(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  /**
   * Menghitung stok barang yang disesuaikan secara real-time jika ada barang yang sedang dipilih di local cart.
   * - wizard_pemakaian: mengurangi sisa stock_available
   * - wizard_pengembalian: mengurangi stock_in_use dan menambah sisa stock_available
   */
  const displayedItems = useMemo(() => {
    if (!cartItems || cartItems.length === 0) return items

    return items.map((item) => {
      const inCart = cartItems.find((c) => c.item.id === item.id)
      if (!inCart) return item

      if (wizardType === 'wizard_pemakaian') {
        return {
          ...item,
          raw_stock_available: item.stock_available,
          stock_available: Math.max(0, item.stock_available - inCart.quantity)
        }
      } else if (wizardType === 'wizard_pengembalian') {
        return {
          ...item,
          raw_stock_in_use: item.stock_in_use,
          stock_in_use: Math.max(0, item.stock_in_use - inCart.quantity),
          stock_available: item.stock_available + inCart.quantity
        }
      }
      return item
    })
  }, [items, cartItems, wizardType])

  // Handler sinkronisasi seluruh stok barang ke Google Spreadsheet
  const handleSyncToSpreadsheet = async () => {
    setIsSyncing(true)
    try {
      // Ambil seluruh master data barang dari Supabase (termasuk status archived untuk rekap lengkap)
      const { data, error: fetchErr } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: true })

      if (fetchErr) throw fetchErr

      if (!data || data.length === 0) {
        alert('Tidak ada barang inventaris untuk disinkronkan.')
        return
      }

      await syncAllItemsToGoogle(data)
      alert(`Rekap seluruh barang (${data.length} item) berhasil dikirim ke sheet "Rekap Stok Barang" di Google Spreadsheet Anda!`)
    } catch (err) {
      console.error('Gagal sinkronisasi ke Spreadsheet:', err)
      alert('Gagal menyinkronkan ke Spreadsheet: ' + (err.message || 'Periksa koneksi/URL'))
    } finally {
      setIsSyncing(false)
    }
  }

  // Apakah halaman ini sedang disematkan di dalam Wizard transaksi?
  const isEmbedded = Boolean(onItemClick)

  return (
    <div className={`catalog-page ${isEmbedded ? 'catalog-page--embedded' : ''}`}>
      {/* === Header Halaman === */}
      <div className="catalog-header">
        {!isEmbedded && (
          <div className="catalog-header__top">
            <div className="catalog-header__title-group">
              <h2 className="catalog-header__title">Katalog Barang</h2>
              {!isLoading && (
                <span className="catalog-header__count">
                  {searchQuery || selectedCategory !== 'all'
                    ? `${items.length} dari ${totalItems} barang`
                    : `${totalItems} barang tersedia`}
                </span>
              )}
            </div>

            <div className="catalog-header__actions">
              {/* Tombol Sinkronkan Rekap ke Google Spreadsheet */}
              <button
                type="button"
                className="btn-sync-spreadsheet"
                onClick={handleSyncToSpreadsheet}
                disabled={isSyncing || isLoading}
                title="Sinkronkan master data seluruh barang ke sheet 'Rekap Stok Barang' di Google Spreadsheet"
              >
                <span>{isSyncing ? '⏳' : '📊'}</span>
                <span>{isSyncing ? 'Menyinkronkan...' : 'Sync Rekap Sheet'}</span>
              </button>

              {/* Tombol Tambah Barang untuk PIC Gudang */}
              <button 
                type="button" 
                className="btn-add-item-trigger"
                onClick={() => setIsAddModalOpen(true)}
                aria-label="Tambah barang baru ke inventaris"
              >
                <span className="btn-add-icon">+</span> Tambah Barang
              </button>
            </div>
          </div>
        )}

        {/* === Search Bar === */}
        <div className="catalog-search">
          <span className="catalog-search__icon" aria-hidden="true">🔍</span>
          <input
            id="catalog-search-input"
            type="search"
            className="catalog-search__input"
            placeholder={isEmbedded ? "Ketik untuk mencari barang yang mau dipilih..." : "Cari nama atau deskripsi barang..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Cari barang"
          />
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

        {/* === Category Filter Bar (Pills Horizontal Scrollable) === */}
        <div className="catalog-category-bar" role="tablist" aria-label="Filter kategori barang">
          <button
            type="button"
            role="tab"
            aria-selected={selectedCategory === 'all'}
            className={`category-pill ${selectedCategory === 'all' ? 'category-pill--active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            <span>✨ Semua</span>
            <span className="category-pill__badge">{categoryCounts.all || 0}</span>
          </button>

          {ITEM_CATEGORIES.map((cat) => {
            const count = categoryCounts[cat] || 0
            const icon = CATEGORY_ICONS[cat] || '📦'
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={selectedCategory === cat}
                className={`category-pill ${selectedCategory === cat ? 'category-pill--active' : ''} ${count === 0 ? 'category-pill--empty' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                <span>{icon} {cat}</span>
                <span className="category-pill__badge">{count}</span>
              </button>
            )
          })}
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
          {searchQuery ? (
            <button
              className="catalog-state__action-btn"
              onClick={() => setSearchQuery('')}
            >
              Hapus Pencarian
            </button>
          ) : (
            <button
              className="catalog-state__action-btn"
              onClick={() => setIsAddModalOpen(true)}
            >
              + Tambah Barang Pertama
            </button>
          )}
        </div>
      )}

      {/* === Grid Barang === */}
      {!isLoading && !error && displayedItems.length > 0 && (
        <div className="catalog-grid" role="list" aria-label="Daftar barang">
          {displayedItems.map((item) => (
            <div key={item.id} role="listitem">
              <ItemCard 
                item={item} 
                onClick={() => {
                  if (onItemClick) {
                    onItemClick(item) // Mode Wizard: memicu penambahan barang ke form
                  } else {
                    setSelectedItem(item) // Mode Default: membuka modal detail
                  }
                }} 
              />
            </div>
          ))}
        </div>
      )}

      {/* Render modal detail jika ada barang yang dipilih (dan bukan dalam mode onItemClick) */}
      {!onItemClick && selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onItemDeleted={() => {
            refetch()
          }}
          onItemUpdated={() => {
            refetch()
          }}
          onOpenHistory={onOpenHistory}
        />
      )}

      {/* Render modal tambah barang untuk PIC */}
      {!isEmbedded && (
        <AddItemModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onItemAdded={() => {
            refetch()
          }}
        />
      )}
    </div>
  )
}

export default CatalogPage
