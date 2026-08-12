/**
 * App.jsx — Komponen root aplikasi Gudang RTB.
 *
 * Fase 2: Ditambahkan test koneksi Supabase yang ditampilkan di UI.
 * Ini adalah kode sementara untuk verifikasi — akan diganti di Fase 3
 * dengan komponen CatalogPage yang sesungguhnya.
 *
 * @returns {JSX.Element} Tampilan utama aplikasi
 */
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'

function App() {
  // State untuk menyimpan hasil test koneksi
  const [connectionStatus, setConnectionStatus] = useState('checking') // 'checking' | 'success' | 'error'
  const [errorMessage, setErrorMessage]         = useState(null)

  useEffect(() => {
    /**
     * Fungsi test koneksi ke Supabase.
     * Melakukan query sederhana ke tabel items untuk memverifikasi koneksi aktif.
     * Dijalankan sekali saat komponen pertama kali dimuat (dependency array kosong []).
     */
    async function testSupabaseConnection() {
      const { error } = await supabase
        .from('items')
        .select('id')  // Ambil kolom minimal untuk efisiensi
        .limit(1)

      if (error) {
        console.error('[App] Koneksi Supabase gagal:', error)
        setConnectionStatus('error')
        setErrorMessage(error.message)
      } else {
        console.log('[App] Koneksi Supabase berhasil ✅')
        setConnectionStatus('success')
      }
    }

    testSupabaseConnection()
  }, []) // [] = jalankan hanya sekali, saat komponen pertama mount

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>📦 Gudang RTB</h1>
        <p className="app-header__subtitle">Sistem Manajemen Inventaris Panitia</p>
      </header>

      <main className="app-main">
        {/* Status Supabase */}
        <div className={`setup-status setup-status--${connectionStatus}`}>
          <span className={`status-dot status-dot--${connectionStatus === 'success' ? 'success' : connectionStatus === 'error' ? 'danger' : 'warning'}`} />
          <span>
            {connectionStatus === 'checking' && 'Menghubungkan ke Supabase...'}
            {connectionStatus === 'success'  && 'Terhubung ke Supabase ✅'}
            {connectionStatus === 'error'    && `Koneksi gagal: ${errorMessage}`}
          </span>
        </div>

        {connectionStatus === 'error' && (
          <div className="error-hint">
            <p><strong>Kemungkinan penyebab:</strong></p>
            <ul>
              <li>File <code>.env.local</code> belum dibuat dari <code>.env.example</code></li>
              <li><code>VITE_SUPABASE_URL</code> atau <code>VITE_SUPABASE_ANON_KEY</code> belum diisi</li>
              <li>Tabel <code>items</code> belum dibuat di Supabase (jalankan <code>docs/sql-schema.sql</code>)</li>
            </ul>
          </div>
        )}

        {connectionStatus === 'success' && (
          <p className="info-text">
            Fase 2 selesai. Lanjut ke Fase 3: komponen katalog barang.
          </p>
        )}
      </main>
    </div>
  )
}

export default App
