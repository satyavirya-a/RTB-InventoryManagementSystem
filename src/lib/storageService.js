/**
 * storageService.js — Service helper untuk mengunggah file ke Supabase Storage.
 *
 * File ini menangani pembuatan nama file unik, upload ke bucket yang dituju,
 * dan menghasilkan URL publik (Public URL) yang bisa disimpan ke database PostgreSQL.
 */
import { supabase } from './supabaseClient'

/**
 * Mengunggah file ke Supabase Storage dan mengembalikan Public URL-nya.
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

  try {
    // 1. Upload file ke bucket
    const { data, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      throw uploadError
    }

    // 2. Dapatkan Public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path)

    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error('Gagal mendapatkan Public URL dari Supabase Storage.')
    }

    return publicUrlData.publicUrl
  } catch (error) {
    console.error(`Gagal upload file ke bucket '${bucketName}':`, error)
    throw error
  }
}
