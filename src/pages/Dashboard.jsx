import React from 'react'
import CatalogPage from './CatalogPage'
import './Dashboard.css'

function Dashboard({ onNavigate }) {
  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <h1>📦 Gudang RTB</h1>
        <p>Pilih jenis transaksi yang ingin Anda lakukan</p>
      </header>

      <div className="dashboard__actions">
        <button 
          className="dashboard-btn dashboard-btn--pemakaian"
          onClick={() => onNavigate('wizard_pemakaian')}
        >
          <span className="dashboard-btn__icon">📤</span>
          <div className="dashboard-btn__text">
            <h3>Pemakaian</h3>
            <p>Ambil barang habis pakai / Pinjam barang</p>
          </div>
        </button>

        <button 
          className="dashboard-btn dashboard-btn--pengembalian"
          onClick={() => onNavigate('wizard_pengembalian')}
        >
          <span className="dashboard-btn__icon">📥</span>
          <div className="dashboard-btn__text">
            <h3>Pengembalian</h3>
            <p>Kembalikan barang yang sedang Anda pinjam</p>
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
      </div>

      <div className="dashboard__catalog-section">
        {/* Render CatalogPage inside Dashboard */}
        <CatalogPage />
      </div>
    </div>
  )
}

export default Dashboard
