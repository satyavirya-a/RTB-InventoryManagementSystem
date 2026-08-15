/**
 * storageService.js — Service helper untuk mengunggah file ke Supabase Storage.
 *
 * File ini menangani pembuatan nama file unik, upload ke bucket yang dituju,
 * dan menghasilkan URL publik (Public URL) yang bisa disimpan ke database PostgreSQL.
 */
import { supabase } from './supabaseClient'

/**
 * Mengunggah file ke Supabase Storage dan mengembalikan Public URL-nya.
 * Dilengkapi fallback otomatis antar-bucket jika salah satu bucket belum dikonfigurasi.
 *
 * @param {File|Blob} file - File yang akan diunggah (sebaiknya sudah dikompresi)
 * @param {string} bucketName - Nama bucket di Supabase ('transaction-proofs' atau 'item-photos')
 * @param {string} [folderName=''] - Subfolder opsional di dalam bucket
 * @returns {Promise<string>} Public URL file yang berhasil diunggah
 */
export async function uploadImageToStorage(file, bucketName, folderName = '') {
  if (!file) {
    throw new Error('File tidak boleh kosong untuk diunggah ke storage.')
  }

  // Buat nama file unik: timestamp + random string + ekstensi
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8)
  const extension = file.name ? file.name.split('.').pop().toLowerCase() : 'webp'
  const cleanExtension = ['jpg', 'jpeg', 'png', 'webp'].includes(extension) ? extension : 'webp'
  
  const fileName = `${timestamp}_${randomStr}.${cleanExtension}`
  const filePath = folderName ? `${folderName}/${fileName}` : fileName

  // Helper internal untuk melakukan upload dan mengambil public URL
  const tryUploadToBucket = async (targetBucket, targetPath) => {
    const { data, error: uploadError } = await supabase.storage
      .from(targetBucket)
      .upload(targetPath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      throw uploadError
    }

    const { data: publicUrlData } = supabase.storage
      .from(targetBucket)
      .getPublicUrl(data.path)

    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error(`Gagal mendapatkan Public URL dari bucket '${targetBucket}'.`)
    }

    return publicUrlData.publicUrl
  }

  try {
    // 1. Coba upload ke bucket utama yang dituju
    return await tryUploadToBucket(bucketName, filePath)
  } catch (primaryError) {
    console.warn(`[Storage] Gagal upload ke bucket '${bucketName}':`, primaryError?.message || primaryError)

    // 2. Fallback cerdas: Jika bucketName adalah 'item-photos' dan gagal, coba fallback ke 'transaction-proofs'
    const fallbackBucket = bucketName === 'item-photos' ? 'transaction-proofs' : (bucketName === 'transaction-proofs' ? 'item-photos' : null)
    if (fallbackBucket) {
      try {
        console.info(`[Storage] Mencoba upload fallback ke bucket '${fallbackBucket}'...`)
        const fallbackPath = folderName ? `${folderName}/${fileName}` : `${bucketName}/${fileName}`
        return await tryUploadToBucket(fallbackBucket, fallbackPath)
      } catch (fallbackError) {
        console.error(`[Storage] Fallback ke bucket '${fallbackBucket}' juga gagal:`, fallbackError)
      }
    }

    throw new Error(`Gagal mengunggah foto ke Supabase Storage (bucket '${bucketName}'). Pastikan bucket sudah dibuat dengan status Public di Supabase Dashboard. (Detail: ${primaryError?.message || 'Koneksi / CORS error'})`)
  }
}

/**
 * Mengunggah banyak file gambar sekaligus secara paralel ke Supabase Storage.
 *
 * @param {Array<File|Blob>} files - Array file yang akan diunggah
 * @param {string} bucketName - Nama bucket di Supabase ('transaction-proofs' atau 'item-photos')
 * @param {string} [folderName=''] - Subfolder opsional di dalam bucket
 * @returns {Promise<Array<string>>} Array Public URL seluruh file yang berhasil diunggah
 */
export async function uploadMultipleImagesToStorage(files, bucketName, folderName = '') {
  if (!files || files.length === 0) {
    return []
  }

  // Eksekusi seluruh upload secara paralel menggunakan Promise.all
  const uploadPromises = files.map(file => uploadImageToStorage(file, bucketName, folderName))
  return await Promise.all(uploadPromises)
}

