/**
 * main.jsx — Titik masuk utama aplikasi React.
 *
 * File ini bertanggung jawab untuk:
 * 1. Mengambil elemen DOM dengan id="root" dari index.html
 * 2. Membuat React "root" (titik kendali React di DOM)
 * 3. Me-render komponen <App /> ke dalam root tersebut
 *
 * Kamu tidak perlu sering mengubah file ini — biasanya hanya ditambah
 * Context Provider (seperti CartContext, AuthContext) di masa depan.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// StrictMode adalah alat bantu pengembangan dari React.
// Dalam mode ini, React akan menjalankan beberapa fungsi DUA KALI
// (di development saja, bukan production) untuk mendeteksi side effects
// yang tidak sengaja. Ini NORMAL dan sengaja — jangan hapus StrictMode.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
