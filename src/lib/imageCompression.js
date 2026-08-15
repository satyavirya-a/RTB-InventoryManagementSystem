/**
 * imageCompression.js — Utilitas kompresi gambar di sisi klien (browser).
 *
 * Mengapa kompresi sisi klien penting?
 * 1. Efisiensi Biaya & Kuota: Kuota Supabase Storage free-tier terbatas (1GB).
 *    Foto langsung dari kamera HP modern bisa berukuran 4MB–10MB per foto.
 *    Dengan kompresi ke ~150KB–200KB, kita bisa menampung 50x lipat lebih banyak foto!
 * 2. Kecepatan Upload: Panitia di lapangan sering menggunakan koneksi 4G yang tidak stabil.
 *    Upload file 200KB selesai dalam 1–2 detik, dibanding 10MB yang butuh waktu lama dan rawan gagal.
 * 3. Tidak Membebani Server: Proses resize & kompresi dikerjakan oleh CPU HP/laptop user.
 */
import imageCompression from 'browser-image-compression'

/**
 * Mengompresi file gambar (File / Blob) sebelum diunggah ke storage.
 *
 * @param {File} imageFile - File gambar asli yang dipilih oleh user
 * @param {object} [customOptions] - Opsi kustom untuk override default
 * @returns {Promise<{ compressedFile: File, originalSizeKB: number, compressedSizeKB: number }>}
 */
export async function compressImageFile(imageFile, customOptions = {}) {
  if (!imageFile) {
    throw new Error('Tidak ada file gambar yang diberikan untuk dikompresi.')
  }

  // Hitung ukuran asli dalam Kilobyte (KB)
  const originalSizeKB = Math.round(imageFile.size / 1024)

  // Konfigurasi standar kompresi Gudang RTB
  const options = {
    maxSizeMB: 0.2,            // Target ukuran maksimal ~200KB
    maxWidthOrHeight: 1024,    // Dimensi gambar maksimal 1024px (cukup tajam untuk bukti & katalog)
    useWebWorker: true,        // Jalankan di background thread agar UI browser tidak macet/freeze
    fileType: 'image/webp',    // Format WebP: kompresi lebih efisien dan modern dibanding JPG standar
    ...customOptions
  }

  try {
    // Jalankan kompresi menggunakan browser-image-compression
    const compressedFile = await imageCompression(imageFile, options)
    const compressedSizeKB = Math.round(compressedFile.size / 1024)

    return {
      compressedFile,
      originalSizeKB,
      compressedSizeKB
    }
  } catch (error) {
    console.error('Kompresi gambar gagal, menggunakan file asli sebagai fallback:', error)
    // Jika kompresi gagal (misal format tidak didukung), fallback return file asli
    return {
      compressedFile: imageFile,
      originalSizeKB,
      compressedSizeKB: originalSizeKB
    }
  }
}
