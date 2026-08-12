/**
 * App.jsx — Komponen root aplikasi Gudang RTB.
 *
 * Fase 3: App sekarang menjadi "shell" yang berisi layout utama (header + main),
 * sementara konten halaman dirender oleh CatalogPage.
 *
 * Di fase selanjutnya (Fase routing), App akan berisi React Router
 * yang memilih halaman mana yang dirender berdasarkan URL.
 *
 * @returns {JSX.Element}
 */
import CatalogPage from './pages/CatalogPage'

function App() {
  return (
    <div className="app-container">
      {/* === App Header — tetap tampil di semua halaman === */}
      <header className="app-header">
        <h1>📦 Gudang RTB</h1>
        <p className="app-header__subtitle">Sistem Manajemen Inventaris Panitia</p>
      </header>

      {/* === Konten Halaman === */}
      <main className="app-main" style={{ maxWidth: 'none', padding: 0 }}>
        <CatalogPage />
      </main>
    </div>
  )
}

export default App
