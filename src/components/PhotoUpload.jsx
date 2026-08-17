/**
 * PhotoUpload.jsx — Komponen upload foto dengan kompresi otomatis di sisi klien.
 *
 * Fitur:
 * 1. Mendukung Single Photo & Multi-Photo (hingga maxPhotos foto).
 * 2. Kompresi otomatis Web Worker di background thread (~200KB per foto).
 * 3. Drag & drop multi-file.
 * 4. Grid pratinjau mini dengan tombol hapus (🗑️) per foto.
 * 5. Badge penghematan ukuran file.
 *
 * @param {object} props
 * @param {File|Array<File>|null} [props.value] - File tunggal atau array file terkompresi
 * @param {string|Array<string>|null} [props.previewUrl] - URL pratinjau tunggal atau array URL
 * @param {Function} props.onChange - Callback: ({ file, files, previewUrl, previewUrls }) => void
 * @param {boolean} [props.isMultiple=false] - Aktifkan mode multi-foto
 * @param {number} [props.maxPhotos=5] - Batas maksimum jumlah foto
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
  isMultiple = false,
  maxPhotos = 5,
  label = 'Upload Foto',
  hint = 'Format: JPG, PNG, WebP (Otomatis dikompresi)',
  required = false,
  disabled = false
}) {
  const [isCompressing, setIsCompressing] = useState(false)
  const [compressingText, setCompressingText] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  
  // Ref terpisah: satu khusus kamera langsung, satu untuk galeri/file
  const galleryInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  // Normalisasi data: array untuk multi-foto, single untuk single-foto
  const currentPreviews = isMultiple 
    ? (Array.isArray(previewUrl) ? previewUrl : (previewUrl ? [previewUrl] : []))
    : (previewUrl ? [previewUrl] : [])

  const currentFiles = isMultiple
    ? (Array.isArray(value) ? value : (value ? [value] : []))
    : (value ? [value] : [])

  /**
   * Memproses satu atau beberapa file gambar sekaligus secara paralel.
   *
   * @param {FileList|Array<File>} fileList
   */
  const processFiles = async (fileList) => {
    const rawFiles = Array.from(fileList || []).filter(f => f && (f.type.startsWith('image/') || f.name.match(/\.(jpe?g|png|webp|heic|heif)$/i)))
    
    if (rawFiles.length === 0) {
      alert('Harap pilih file gambar yang valid (JPG, PNG, atau WebP).')
      return
    }

    if (isMultiple && currentFiles.length + rawFiles.length > maxPhotos) {
      alert(`Maksimal ${maxPhotos} foto yang dapat diunggah dalam satu transaksi.`)
      return
    }

    setIsCompressing(true)
    setCompressingText(`Mengompresi ${rawFiles.length} gambar di background...`)

    try {
      // Kompresi seluruh file secara paralel
      const compressionPromises = rawFiles.map(file => compressImageFile(file))
      const results = await Promise.all(compressionPromises)

      if (isMultiple) {
        const newFiles = results.map(r => r.compressedFile)
        const newPreviews = results.map(r => URL.createObjectURL(r.compressedFile))

        const updatedFiles = [...currentFiles, ...newFiles]
        const updatedPreviews = [...currentPreviews, ...newPreviews]

        if (onChange) {
          onChange({
            files: updatedFiles,
            previewUrls: updatedPreviews,
            // Fallback properti untuk kemudahan akses
            file: updatedFiles[0] || null,
            previewUrl: updatedPreviews[0] || null
          })
        }
      } else {
        // Mode single foto
        const singleResult = results[0]
        const singlePreview = URL.createObjectURL(singleResult.compressedFile)

        if (onChange) {
          onChange({
            file: singleResult.compressedFile,
            files: [singleResult.compressedFile],
            previewUrl: singlePreview,
            previewUrls: [singlePreview],
            originalSizeKB: singleResult.originalSizeKB,
            compressedSizeKB: singleResult.compressedSizeKB
          })
        }
      }
    } catch (err) {
      console.error('Gagal mengompresi gambar:', err)
      alert('Terjadi kesalahan saat memproses gambar. Silakan coba lagi.')
    } finally {
      setIsCompressing(false)
      setCompressingText('')
      if (galleryInputRef.current) galleryInputRef.current.value = ''
      if (cameraInputRef.current) cameraInputRef.current.value = ''
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files)
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

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }

  // Hapus foto spesifik berdasarkan indeks
  const handleRemovePhoto = (indexToRemove, e) => {
    e.stopPropagation()
    
    if (isMultiple) {
      const updatedFiles = currentFiles.filter((_, idx) => idx !== indexToRemove)
      const updatedPreviews = currentPreviews.filter((_, idx) => idx !== indexToRemove)

      if (onChange) {
        onChange({
          files: updatedFiles,
          previewUrls: updatedPreviews,
          file: updatedFiles[0] || null,
          previewUrl: updatedPreviews[0] || null
        })
      }
    } else {
      if (onChange) {
        onChange({ file: null, files: [], previewUrl: null, previewUrls: [] })
      }
    }
  }

  return (
    <div className="photo-upload-group">
      <div className="photo-upload-header">
        <label className="photo-upload-label">
          {label} {required && <span className="photo-upload-required">*</span>}
        </label>
        {isMultiple && (
          <span className="photo-upload-count">
            {currentPreviews.length} / {maxPhotos} foto
          </span>
        )}
      </div>

      {/* Hidden Inputs: Kamera Langsung vs Galeri */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="photo-input-hidden"
        onChange={handleFileChange}
        disabled={disabled || isCompressing}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple={isMultiple}
        className="photo-input-hidden"
        onChange={handleFileChange}
        disabled={disabled || isCompressing}
      />

      {/* Grid Multi-Foto Preview (Jika mode multiple dan ada foto) */}
      {isMultiple && currentPreviews.length > 0 && (
        <div className="photo-preview-grid">
          {currentPreviews.map((url, idx) => (
            <div key={idx} className="photo-preview-card">
              <img src={url} alt={`Bukti ${idx + 1}`} className="photo-preview-card__img" />
              <button
                type="button"
                className="photo-preview-card__remove"
                onClick={(e) => handleRemovePhoto(idx, e)}
                title="Hapus foto ini"
                aria-label={`Hapus foto ${idx + 1}`}
              >
                ✕
              </button>
              <span className="photo-preview-card__badge">Foto #{idx + 1}</span>
            </div>
          ))}
        </div>
      )}

      {/* Single Foto Preview (Jika mode single dan ada foto) */}
      {!isMultiple && currentPreviews.length > 0 && (
        <div className="photo-single-preview">
          <div className="photo-single-preview__container">
            <img src={currentPreviews[0]} alt="Pratinjau Foto" className="photo-single-preview__img" />
            <div className="photo-single-preview__actions">
              <button
                type="button"
                className="btn-photo-action-sm btn-photo-action-sm--camera"
                onClick={() => !disabled && !isCompressing && cameraInputRef.current?.click()}
                disabled={disabled || isCompressing}
                title="Ambil foto baru pakai kamera"
              >
                📸 Kamera
              </button>
              <button
                type="button"
                className="btn-photo-action-sm btn-photo-action-sm--gallery"
                onClick={() => !disabled && !isCompressing && galleryInputRef.current?.click()}
                disabled={disabled || isCompressing}
                title="Pilih foto baru dari galeri"
              >
                🖼️ Galeri
              </button>
              <button
                type="button"
                className="btn-photo-remove"
                onClick={(e) => handleRemovePhoto(0, e)}
                disabled={disabled || isCompressing}
                title="Hapus foto"
              >
                🗑️ Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dropzone & Tombol Pilihan Aksi (Kamera vs Galeri) */}
      {(isMultiple ? currentPreviews.length < maxPhotos : currentPreviews.length === 0) && (
        <div
          className={`photo-dropzone ${isDragOver ? 'photo-dropzone--dragover' : ''} ${disabled ? 'photo-dropzone--disabled' : ''} ${currentPreviews.length > 0 ? 'photo-dropzone--compact' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          aria-label="Pilih foto untuk diunggah"
        >
          {/* State Loading */}
          {isCompressing && (
            <div className="photo-upload-status photo-upload-status--loading">
              <span className="photo-upload-spinner" aria-hidden="true" />
              <p>{compressingText || 'Mengompresi gambar...'}</p>
            </div>
          )}

          {/* State Siap Pilih Foto */}
          {!isCompressing && (
            <div className="photo-upload-content">
              <div className="photo-upload-cta-buttons">
                <button
                  type="button"
                  className="btn-photo-cta btn-photo-cta--camera"
                  onClick={() => !disabled && !isCompressing && cameraInputRef.current?.click()}
                  disabled={disabled || isCompressing}
                >
                  <span className="btn-photo-cta__icon">📸</span>
                  <span className="btn-photo-cta__text">
                    <strong>Ambil Foto Kamera</strong>
                    <small>Langsung buka kamera HP</small>
                  </span>
                </button>

                <button
                  type="button"
                  className="btn-photo-cta btn-photo-cta--gallery"
                  onClick={() => !disabled && !isCompressing && galleryInputRef.current?.click()}
                  disabled={disabled || isCompressing}
                >
                  <span className="btn-photo-cta__icon">🖼️</span>
                  <span className="btn-photo-cta__text">
                    <strong>Pilih dari Galeri</strong>
                    <small>{isMultiple ? 'Bisa pilih beberapa foto' : 'Pilih file dari galeri/memori'}</small>
                  </span>
                </button>
              </div>

              <div className="photo-upload-subhint">
                <span className="photo-upload-subhint__desktop">atau seret file foto ke area ini • </span>
                <span>{isMultiple ? `Maksimal ${maxPhotos} foto (otomatis dikompresi ~200KB)` : hint}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default PhotoUpload

