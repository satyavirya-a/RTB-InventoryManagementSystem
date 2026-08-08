/**
 * App.jsx — Komponen root / induk dari seluruh aplikasi Gudang RTB.
 *
 * Saat ini hanya berisi halaman placeholder sementara kita belum setup routing.
 * Di fase selanjutnya, file ini akan berisi React Router dan layout utama.
 *
 * @returns {JSX.Element} Tampilan awal aplikasi
 */
function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>📦 Gudang RTB</h1>
        <p>Sistem Manajemen Inventaris Panitia</p>
      </header>
      <main className="app-main">
        <div className="setup-status">
          <span className="status-dot status-dot--success" />
          <span>Setup berhasil! Project React + Vite sudah aktif.</span>
        </div>
        <p className="info-text">
          Fase 1 selesai. Lanjut ke Fase 2: koneksi ke Supabase.
        </p>
      </main>
    </div>
  )
}

export default App
