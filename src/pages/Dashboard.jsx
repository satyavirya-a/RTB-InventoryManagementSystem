import React, { useState } from 'react'
import CatalogPage from './CatalogPage'
import DepositedItemsList from '../components/DepositedItemsList'
import HistoryModal from '../components/HistoryModal'
import './Dashboard.css'

function Dashboard({ onNavigate }) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [historySearchQuery, setHistorySearchQuery] = useState('')
  const [historyFilterType, setHistoryFilterType] = useState('all')
  const [activeTab, setActiveTab] = useState('catalog') // 'catalog' | 'deposits'

  const handleOpenHistory = (searchQuery = '', filter = 'all') => {
    setHistorySearchQuery(searchQuery)
    setHistoryFilterType(filter)
    setIsHistoryOpen(true)
  }

  return (
    <div className="dashboard">
      {/* Header Dashboard & Tombol Riwayat */}
      <header className="dashboard__header">
        <div className="dashboard__header-top">
          <div className="dashboard__brand">
            <h1>📦 Gudang RTB</h1>
            <p>Pilih jenis transaksi yang ingin Anda lakukan</p>
          </div>

          <button 
            type="button" 
            className="btn-history-trigger"
            onClick={() => handleOpenHistory('', 'all')}
            aria-label="Lihat riwayat transaksi"
          >
            <span className="history-icon">📜</span>
            <span>Riwayat Transaksi</span>
          </button>
        </div>
      </header>

      {/* 4 Menu Hero Utama */}
      <div className="dashboard__actions">
        <button 
          className="dashboard-btn dashboard-btn--pemakaian"
          onClick={() => onNavigate('wizard_pemakaian')}
        >
          <span className="dashboard-btn__icon">📤</span>
          <div className="dashboard-btn__text">
            <h3>Pemakaian</h3>
            <p>Ambil / pinjam barang inventaris gudang</p>
          </div>
        </button>

        <button 
          className="dashboard-btn dashboard-btn--pengembalian"
          onClick={() => onNavigate('wizard_pengembalian')}
        >
          <span className="dashboard-btn__icon">📥</span>
          <div className="dashboard-btn__text">
            <h3>Pengembalian</h3>
            <p>Kembalikan barang inventaris yang sedang dipinjam</p>
          </div>
        </button>

        <button 
          className="dashboard-btn dashboard-btn--penitipan"
          onClick={() => onNavigate('wizard_penitipan')}
        >
          <span className="dashboard-btn__icon">🎒</span>
          <div className="dashboard-btn__text">
            <h3>Penitipan</h3>
            <p>Titipkan barang dari luar ke dalam gudang</p>
          </div>
        </button>

        <button 
          className="dashboard-btn dashboard-btn--pengambilan"
          onClick={() => onNavigate('wizard_pengambilan')}
        >
          <span className="dashboard-btn__icon">🏷️</span>
          <div className="dashboard-btn__text">
            <h3>Pengambilan</h3>
            <p>Ambil kembali barang titipan yang ada di gudang</p>
          </div>
        </button>
      </div>

      {/* Selector Tampilan: Tab di Desktop, Dropdown di Mobile */}
      <div className="dashboard__tab-container">
        {/* Versi Tab (Desktop/Tablet) */}
        <div className="dashboard__tab-switcher">
          <button
            type="button"
            className={`dashboard-tab ${activeTab === 'catalog' ? 'dashboard-tab--active' : ''}`}
            onClick={() => setActiveTab('catalog')}
          >
            <span>📦</span>
            <span>Katalog Barang Gudang</span>
          </button>

          <button
            type="button"
            className={`dashboard-tab ${activeTab === 'deposits' ? 'dashboard-tab--active' : ''}`}
            onClick={() => setActiveTab('deposits')}
          >
            <span>🎒</span>
            <span>Barang Titipan Aktif</span>
          </button>
        </div>

        {/* Versi Dropdown Pilihan (Mobile) */}
        <div className="dashboard__tab-dropdown-wrapper">
          <label htmlFor="dashboard-view-select" className="dashboard__tab-dropdown-label">
            Tampilkan Tampilan:
          </label>
          <div className="dashboard__select-wrapper">
            <select
              id="dashboard-view-select"
              className="dashboard__tab-dropdown"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
            >
              <option value="catalog">📦 Katalog Barang Gudang</option>
              <option value="deposits">🎒 Barang Titipan Aktif</option>
            </select>
            <span className="dashboard__select-chevron" aria-hidden="true">▼</span>
          </div>
        </div>
      </div>

      {/* Konten Tab Aktif */}
      <div className="dashboard__content-section">
        {activeTab === 'catalog' ? (
          <CatalogPage onOpenHistory={handleOpenHistory} />
        ) : (
          <DepositedItemsList 
            onPickupItem={(depositItem) => onNavigate('wizard_pengambilan', depositItem)}
          />
        )}
      </div>

      {/* Modal Riwayat Transaksi */}
      <HistoryModal 
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        initialSearchQuery={historySearchQuery}
        initialFilter={historyFilterType}
      />
    </div>
  )
}

export default Dashboard
