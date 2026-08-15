/**
 * PhotoUpload.jsx — Komponen upload foto dengan kompresi otomatis di sisi klien.
 *
 * Alur kerja komponen:
 * 1. User memilih file gambar (via klik tombol atau drag-and-drop).
 * 2. Menampilkan indikator loading "Mengompresi gambar...".
 * 3. Memanggil compressImageFile() di background thread (Web Worker).
 * 4. Menampilkan pratinjau (preview) foto dan badge penghematan ukuran file.
 * 5. Mengirimkan objek file terkompresi ke komponen induk melalui callback onChange.
 *
 * @param {object} props
 * @param {File|null} props.value - File terkompresi saat ini
 * @param {string|null} props.previewUrl - URL pratinjau foto
 * @param {Function} props.onChange - Callback saat foto dipilih/dihapus: ({ file, previewUrl }) => void
 * @param {string} [props.label='Upload Foto'] - Label judul input
 * @param {string} [props.hint='Format: JPG, PNG, WebP (Otomatis dikompresi)'] - Petunjuk input
 * @param {boolean} [props.required=false] - Apakah wajib diisi
 * @param {boolean} [props.disabled=false] - Status disabled
 */
import React, { useState, useRef } from 'react'
import { compressImageFile } from '../lib/imageCompression'
import './PhotoUpload.css'

function PhotoUpload({
  value,
  previewUrl,
  onChange,
  label = 'Upload Foto',
  hint = 'Format: JPG, PNG, WebP (Otomatis dikompresi)',
  required = false,
  disabled = false
}) {
  const [isCompressing, setIsCompressing] = useState(false)
  const [compressionInfo, setCompressionInfo] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef(null)

  /**
   * Menangani pemrosesan file gambar (baik dari file input maupun drag-drop).
   *
   * @param {File} file - File mentah dari browser
   */
  const processFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Harap pilih file gambar yang valid (JPG, PNG, atau WebP).')
      return
    }

    setIsCompressing(true)
    try {
      // 1. Jalankan kompresi otomatis di background
      const result = await compressImageFile(file)
      
      // 2. Buat blob URL untuk pratinjau lokal
      const newPreviewUrl = URL.createObjectURL(result.compressedFile)

      // 3. Hitung persentase penghematan ukuran
      const savedPercent = result.originalSizeKB > 0
        ? Math.round(((result.originalSizeKB - result.compressedSizeKB) / result.originalSizeKB) * 100)
        : 0

      setCompressionInfo({
        originalKB: result.originalSizeKB,
        compressedKB: result.compressedSizeKB,
        savedPercent: Math.max(0, savedPercent)
      })

      // 4. Laporkan ke parent component
      if (onChange) {
        onChange({
          file: result.compressedFile,
          previewUrl: newPreviewUrl,
          originalSizeKB: result.originalSizeKB,
          compressedSizeKB: result.compressedSizeKB
        })
      }
    } catch (err) {
      console.error('Gagal memproses gambar:', err)
      alert('Terjadi kesalahan saat memproses gambar. Silakan coba lagi.')
    } finally {
      setIsCompressing(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    if (!disabled) setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    if (disabled) return

    const file = e.dataTransfer.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const handleClear = (e) => {
    e.stopPropagation()
    setCompressionInfo(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (onChange) {
      onChange({ file: null, previewUrl: null, originalSizeKB: 0, compressedSizeKB: 0 })
    }
  }

  return (
    <div className="photo-upload-group">
      <label className="photo-upload-label">
        {label} {required && <span className="photo-upload-required">*</span>}
      </label>

      {/* Area Upload & Dropzone */}
      <div
        className={`photo-dropzone ${isDragOver ? 'photo-dropzone--dragover' : ''} ${previewUrl ? 'photo-dropzone--has-preview' : ''} ${disabled ? 'photo-dropzone--disabled' : ''}`}
        onClick={() => !disabled && !isCompressing && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        aria-label="Pilih foto untuk diunggah"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/jpg"
          className="photo-input-hidden"
          onChange={handleFileChange}
          disabled={disabled || isCompressing}
        />

        {/* State 1: Sedang Kompresi */}
        {isCompressing && (
          <div className="photo-upload-status photo-upload-status--loading">
            <span className="photo-upload-spinner" aria-hidden="true" />
            <p>Mengompresi gambar di background...</p>
          </div>
        )}

        {/* State 2: Ada Pratinjau Foto */}
        {!isCompressing && previewUrl && (
          <div className="photo-preview-wrapper">
            <img src={previewUrl} alt="Pratinjau Bukti" className="photo-preview-image" />
            <button
              type="button"
              className="photo-preview-remove-btn"
              onClick={handleClear}
              title="Hapus foto"
              aria-label="Hapus foto"
            >
              ✕
            </button>
          </div>
        )}

        {/* State 3: Belum Ada Foto */}
        {!isCompressing && !previewUrl && (
          <div className="photo-upload-placeholder">
            <span className="photo-upload-icon" aria-hidden="true">📸</span>
            <p className="photo-upload-prompt">
              <strong>Klik untuk pilih foto</strong> atau seret file ke sini
            </p>
            <span className="photo-upload-hint">{hint}</span>
          </div>
        )}
      </div>

      {/* Info Kompresi Ukuran File */}
      {compressionInfo && previewUrl && (
        <div className="photo-compression-badge">
          <span className="photo-compression-icon">⚡</span>
          <span>
            Ukuran: <strong>{compressionInfo.originalKB} KB</strong> ➔ <strong>{compressionInfo.compressedKB} KB</strong>
            {compressionInfo.savedPercent > 0 && ` (Hemat ${compressionInfo.savedPercent}%)`}
          </span>
        </div>
      )}
    </div>
  )
}

export default PhotoUpload
