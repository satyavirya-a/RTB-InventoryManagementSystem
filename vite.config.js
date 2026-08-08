import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// defineConfig() memberikan type-checking dan autocomplete saat kita tulis konfigurasi.
// Tanpa wrapper ini, Vite tetap bisa jalan — wrapper ini hanya membantu developer experience.
export default defineConfig({
  plugins: [
    // Plugin ini yang "mengajarkan" Vite cara mem-proses file .jsx dan .tsx.
    // Tanpa ini, Vite tidak tahu cara mengubah JSX menjadi JavaScript biasa.
    react()
  ],
  server: {
    // Port default dev server. Bisa diubah jika port 5173 sedang dipakai aplikasi lain.
    port: 5173,
    open: false,  // Set true jika ingin browser otomatis terbuka saat `npm run dev`
  }
})
