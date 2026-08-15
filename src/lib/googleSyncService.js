/**
 * googleSyncService.js — Service helper untuk sinkronisasi otomatis ke Google Sheets & Google Drive.
 *
 * Prinsip Arsitektur (Fire-and-Forget / Non-blocking):
 * 1. Supabase tetap menjadi Single Source of Truth yang utama dan real-time.
 * 2. Google Sheets & Drive berfungsi sebagai *Secondary Backup* (arsip cadangan).
 * 3. Fungsi ini dijalankan secara asynchronous di latar belakang tanpa menunggu respons
 *    (fire-and-forget). Jika koneksi ke Google lambat atau gagal, antarmuka aplikasi
 *    tetap berjalan mulus dan transaksi panitia tidak akan pernah terhambat!
 */

/**
 * Mengirim salinan data transaksi ke Google Apps Script Web App.
 *
 * @param {object} payload - Data transaksi yang akan dicadangkan
 * @param {string} payload.transactionType - Jenis transaksi ('pemakaian', 'pengembalian', 'penitipan', 'pengambilan', 'penambahan')
 * @param {string} payload.actorName - Nama panitia yang melakukan transaksi
 * @param {string} [payload.eventName] - Nama divisi atau event
 * @param {string} [payload.itemsSummary] - Ringkasan daftar barang & jumlah
 * @param {string} [payload.notes] - Catatan tambahan transaksi
 * @param {string|null} [payload.proofPhotoUrl] - Public URL foto bukti dari Supabase
 * @returns {Promise<{ success: boolean, message?: string, skipped?: boolean }>}
 */
export async function syncTransactionToGoogle({
  transactionType,
  actorName,
  eventName = '',
  itemsSummary = '',
  notes = '',
  proofPhotoUrl = null
}) {
  const scriptUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL

  // Jika URL Google Apps Script belum disetup di .env.local, lewati secara halus tanpa error
  if (!scriptUrl || scriptUrl.trim() === '' || scriptUrl.includes('your-deployment-id')) {
    console.warn('[GoogleSync] ⚠️ VITE_GOOGLE_APPS_SCRIPT_URL belum dikonfigurasi di .env.local atau Vite dev server belum direstart setelah mengedit .env.local. Melewati backup Google Sheets.')
    return { success: true, skipped: true }
  }

  const payloadData = {
    timestamp: new Date().toISOString(),
    transaction_type: transactionType,
    actor_name: actorName,
    event_name: eventName,
    items_summary: itemsSummary,
    notes: notes,
    proof_photo_url: proofPhotoUrl
  }

  console.log('[GoogleSync] 🚀 Mengirim log transaksi ke Google Apps Script...', {
    url: scriptUrl,
    payload: payloadData
  })

  try {
    // Menggunakan mode 'no-cors' karena Google Apps Script web app melakukan HTTP 302 redirect.
    // 'no-cors' memastikan request terkirim ke server Google tanpa terhalang kebijakan CORS browser.
    fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payloadData),
      mode: 'no-cors'
    })
      .then(() => {
        console.log('[GoogleSync] ✅ Request log transaksi berhasil dikirim ke Google Apps Script!')
      })
      .catch(err => {
        console.warn('[GoogleSync] ❌ Gagal mengirim log ke Google Apps Script:', err)
      })

    return { success: true }
  } catch (error) {
    console.warn('[GoogleSync] Error saat inisialisasi sync Google:', error)
    return { success: false, message: error.message }
  }
}
