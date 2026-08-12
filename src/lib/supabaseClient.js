/**
 * supabaseClient.js
 * Inisialisasi dan ekspor satu instance klien Supabase untuk dipakai di seluruh aplikasi.
 *
 * Kenapa hanya SATU instance?
 * Membuat banyak instance supabase = membuat banyak koneksi ke database yang tidak perlu.
 * Dengan mengekspor satu instance dari file ini, semua komponen pakai koneksi yang sama
 * (pola Singleton) — lebih efisien dan state autentikasi juga konsisten di seluruh app.
 *
 * Cara pakai di komponen lain:
 * ```js
 * import { supabase } from '../lib/supabaseClient'
 * const { data } = await supabase.from('items').select('*')
 * ```
 */
import { createClient } from '@supabase/supabase-js'

/**
 * URL project Supabase.
 * Dibaca dari environment variable VITE_SUPABASE_URL di file .env.local.
 * Format: https://<project-id>.supabase.co
 *
 * Kenapa import.meta.env, bukan process.env?
 * Vite (bukan Node.js) yang menjalankan kode ini di browser — Vite menggunakan
 * import.meta.env untuk membaca env variables, bukan process.env.
 * Prefix VITE_ wajib ada agar Vite tahu variable ini boleh di-expose ke browser.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

/**
 * Kunci publik (anon key) Supabase.
 * Dibaca dari environment variable VITE_SUPABASE_ANON_KEY di file .env.local.
 *
 * Perbedaan anon key vs service role key:
 * - anon key     → aman dipakai di frontend; akses dibatasi oleh Row Level Security (RLS)
 * - service role → melewati semua RLS; JANGAN pernah dipakai di frontend/browser
 */
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validasi awal: jika env variable belum diisi, tampilkan pesan yang jelas di console
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[supabaseClient] Environment variables belum diisi!\n' +
    'Pastikan file .env.local ada dan berisi:\n' +
    '  VITE_SUPABASE_URL=https://your-project.supabase.co\n' +
    '  VITE_SUPABASE_ANON_KEY=your-anon-key'
  )
}

/**
 * Instance klien Supabase yang sudah dikonfigurasi.
 * Import ini untuk melakukan semua operasi database dan storage.
 *
 * @type {import('@supabase/supabase-js').SupabaseClient}
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
