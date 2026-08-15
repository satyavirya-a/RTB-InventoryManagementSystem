/**
 * HistoryModal.jsx — Modal untuk melihat riwayat transaksi inventaris dan detailnya.
 *
 * Fitur utama:
 * 1. Menampilkan daftar transaksi terbaru dari tabel 'transactions' + 'transaction_details' + 'items'.
 * 2. Filter berdasarkan jenis transaksi (Semua, Pemakaian, Pengembalian, Penitipan).
 * 3. Pencarian berdasarkan nama panitia, nama event, atau nama barang.
 * 4. Tampilan detail transaksi saat salah satu baris riwayat diklik, termasuk foto bukti.
 *
 * @param {object} props
 * @param {boolean} props.isOpen - Status apakah modal riwayat terbuka
 * @param {Function} props.onClose - Callback saat modal ditutup
 * @param {string} [props.initialSearchQuery=''] - Query pencarian awal (misal: saat diklik dari detail barang)
 * @param {string} [props.initialFilter='all'] - Filter jenis transaksi awal
 */
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import './HistoryModal.css'

function HistoryModal({ isOpen, onClose, initialSearchQuery = '', initialFilter = 'all' }) {
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [filterType, setFilterType] = useState(initialFilter)
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery)
  
  // Transaksi yang sedang dipilih untuk melihat detail lengkap
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  
  // Pratinjau foto bukti ukuran penuh
  const [zoomPhotoUrl, setZoomPhotoUrl] = useState(null)

  // Reset / sesuaikan query saat modal dibuka dengan prop baru
  useEffect(() => {
    if (isOpen) {
      setSearchQuery(initialSearchQuery || '')
      setFilterType(initialFilter || 'all')
    }
  }, [isOpen, initialSearchQuery, initialFilter])

  // Fetch riwayat transaksi dari Supabase
  const fetchHistory = async () => {
    setIsLoading(true)
    setErrorMsg('')
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          transaction_type,
          actor_name,
          event_name,
          proof_photo_url,
          notes,
          created_at,
          transaction_details (
            id,
            quantity,
            item_id,
            items (
              id,
              name,
              unit,
              photo_url
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTransactions(data || [])
    } catch (err) {
      console.error('Gagal mengambil riwayat transaksi:', err)
      setErrorMsg(err.message || 'Gagal memuat riwayat transaksi.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      fetchHistory()
      setSelectedTransaction(null)
      setZoomPhotoUrl(null)
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Tutup modal dengan tombol Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (zoomPhotoUrl) {
          setZoomPhotoUrl(null)
        } else if (selectedTransaction) {
          setSelectedTransaction(null)
        } else if (isOpen) {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedTransaction, zoomPhotoUrl, onClose])

  if (!isOpen) return null

  // Format tanggal & waktu lokal (Indonesia)
  const formatDateTime = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Filter daftar transaksi
  const filteredTransactions = transactions.filter((t) => {
    // 1. Filter tipe
    if (filterType !== 'all' && t.transaction_type !== filterType) {
      return false
    }

    // 2. Filter search query (nama pelaku, event, catatan, atau nama barang)
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()

    const matchActor = t.actor_name?.toLowerCase().includes(q)
    const matchEvent = t.event_name?.toLowerCase().includes(q)
    const matchNotes = t.notes?.toLowerCase().includes(q)
    const matchItems = t.transaction_details?.some((d) =>
      d.items?.name?.toLowerCase().includes(q)
    )

    return matchActor || matchEvent || matchNotes || matchItems
  })

  return (
    <>
      <div className="modal-overlay" onClick={onClose} aria-hidden="true" />

      <div className="history-modal" role="dialog" aria-modal="true" aria-labelledby="history-title">
        {/* Header Modal */}
        <header className="history-modal__header">
          <div className="history-modal__header-left">
            {selectedTransaction && (
              <button
                type="button"
                className="btn-history-back"
                onClick={() => setSelectedTransaction(null)}
                aria-label="Kembali ke daftar riwayat"
              >
                ← Kembali
              </button>
            )}
            <h2 id="history-title">
              {selectedTransaction ? '📋 Detail Transaksi' : '📜 Riwayat Transaksi'}
            </h2>
          </div>

          <button
            type="button"
            className="history-modal__close-btn"
            onClick={onClose}
            aria-label="Tutup riwayat"
          >
            ✕
          </button>
        </header>

        {/* ========================================================================= */}
        {/* VIEW 1: DETAIL TRANSAKSI TUNGGAL                                          */}
        {/* ========================================================================= */}
        {selectedTransaction ? (
          <div className="history-detail-body fade-in">
            {/* Status Type Badge & Waktu */}
            <div className="history-detail-hero">
              <span className={`history-type-badge history-type-badge--${selectedTransaction.transaction_type}`}>
                {selectedTransaction.transaction_type.toUpperCase()}
              </span>
              <span className="history-detail-time">
                {formatDateTime(selectedTransaction.created_at)}
              </span>
            </div>

            {/* Identitas Pelaku & Event */}
            <div className="history-detail-card">
              <div className="history-detail-row">
                <span className="detail-label">Nama Panitia:</span>
                <strong className="detail-value">{selectedTransaction.actor_name}</strong>
              </div>
              <div className="history-detail-row">
                <span className="detail-label">Divisi / Event:</span>
                <span className="detail-value">{selectedTransaction.event_name || '-'}</span>
              </div>
              {selectedTransaction.notes && (
                <div className="history-detail-row history-detail-row--notes">
                  <span className="detail-label">Catatan / Rincian:</span>
                  <div className="detail-notes-box">{selectedTransaction.notes}</div>
                </div>
              )}
            </div>

            {/* Daftar Barang Terlibat */}
            {selectedTransaction.transaction_details && selectedTransaction.transaction_details.length > 0 && (
              <div className="history-detail-items">
                <h4>Barang yang Diproses:</h4>
                <ul className="history-detail-items-list">
                  {selectedTransaction.transaction_details.map((d) => (
                    <li key={d.id} className="history-item-row">
                      <div className="history-item-info">
                        <span className="history-item-name">{d.items?.name || 'Barang tidak dikenal'}</span>
                      </div>
                      <span className="history-item-qty">
                        <strong>{d.quantity}</strong> {d.items?.unit || 'pcs'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Foto Bukti Transaksi */}
            {(() => {
              const photoUrls = (selectedTransaction.proof_photo_url || '')
                .split(',')
                .map(s => s.trim())
                .filter(Boolean)

              if (photoUrls.length === 0) {
                return (
                  <div className="history-no-photo">
                    <span>📷 Tidak ada foto bukti terlampir</span>
                  </div>
                )
              }

              return (
                <div className="history-detail-photo-section">
                  <h4>Foto Bukti ({photoUrls.length} Foto):</h4>
                  <div className="history-photo-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                    {photoUrls.map((url, idx) => (
                      <div 
                        key={idx}
                        className="history-photo-preview-box"
                        onClick={() => setZoomPhotoUrl(url)}
                        title="Klik untuk memperbesar foto"
                      >
                        <img
                          src={url}
                          alt={`Foto Bukti ${idx + 1}`}
                          className="history-detail-photo"
                        />
                        <div className="history-photo-overlay">
                          <span>🔍 Foto #{idx + 1}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>
        ) : (
          /* ========================================================================= */
          /* VIEW 2: DAFTAR SEMUA RIWAYAT TRANSAKSI                                    */
          /* ========================================================================= */
          <div className="history-modal__body">
            {/* Filter Tabs & Search */}
            <div className="history-controls">
              <div className="history-tabs">
                <button
                  type="button"
                  className={`history-tab ${filterType === 'all' ? 'history-tab--active' : ''}`}
                  onClick={() => setFilterType('all')}
                >
                  Semua ({transactions.length})
                </button>
                <button
                  type="button"
                  className={`history-tab ${filterType === 'pemakaian' ? 'history-tab--active' : ''}`}
                  onClick={() => setFilterType('pemakaian')}
                >
                  Pemakaian
                </button>
                <button
                  type="button"
                  className={`history-tab ${filterType === 'pengembalian' ? 'history-tab--active' : ''}`}
                  onClick={() => setFilterType('pengembalian')}
                >
                  Pengembalian
                </button>
                <button
                  type="button"
                  className={`history-tab ${filterType === 'penitipan' ? 'history-tab--active' : ''}`}
                  onClick={() => setFilterType('penitipan')}
                >
                  Penitipan
                </button>
                <button
                  type="button"
                  className={`history-tab ${filterType === 'pengambilan' ? 'history-tab--active' : ''}`}
                  onClick={() => setFilterType('pengambilan')}
                >
                  Pengambilan
                </button>
                <button
                  type="button"
                  className={`history-tab ${filterType === 'penambahan' ? 'history-tab--active' : ''}`}
                  onClick={() => setFilterType('penambahan')}
                >
                  Penambahan
                </button>
                <button
                  type="button"
                  className={`history-tab ${filterType === 'penghapusan' ? 'history-tab--active' : ''}`}
                  onClick={() => setFilterType('penghapusan')}
                >
                  Penghapusan
                </button>
              </div>

              {/* Search Bar Riwayat */}
              <div className="history-search">
                <span className="history-search__icon">🔍</span>
                <input
                  type="search"
                  placeholder="Cari nama orang, event, atau barang..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="history-search__input"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="history-search__clear"
                    onClick={() => setSearchQuery('')}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* State Loading */}
            {isLoading && (
              <div className="history-loading">
                <span className="history-spinner" />
                <p>Memuat riwayat transaksi...</p>
              </div>
            )}

            {/* State Error */}
            {!isLoading && errorMsg && (
              <div className="history-error">
                <strong>Gagal memuat data:</strong> {errorMsg}
                <button type="button" className="btn-retry" onClick={fetchHistory}>
                  Coba Lagi
                </button>
              </div>
            )}

            {/* State Empty */}
            {!isLoading && !errorMsg && filteredTransactions.length === 0 && (
              <div className="history-empty">
                <span className="history-empty-icon">📭</span>
                <p className="history-empty-title">
                  {searchQuery ? 'Tidak ada transaksi yang cocok' : 'Belum ada riwayat transaksi'}
                </p>
                <p className="history-empty-desc">
                  {searchQuery
                    ? 'Coba kata kunci pencarian yang lain.'
                    : 'Setiap transaksi pemakaian, pengembalian, atau penitipan akan tercatat di sini.'}
                </p>
              </div>
            )}

            {/* List Transaksi */}
            {!isLoading && !errorMsg && filteredTransactions.length > 0 && (
              <div className="history-list">
                {filteredTransactions.map((t) => {
                  // Ringkasan item barang
                  const itemsSummary = t.transaction_details && t.transaction_details.length > 0
                    ? t.transaction_details.map(d => `${d.quantity}x ${d.items?.name || 'Barang'}`).join(', ')
                    : (t.notes || 'Penitipan Barang')

                  return (
                    <div
                      key={t.id}
                      className="history-card"
                      onClick={() => setSelectedTransaction(t)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="history-card__header">
                        <span className={`history-type-badge history-type-badge--${t.transaction_type}`}>
                          {t.transaction_type.toUpperCase()}
                        </span>
                        <span className="history-card__time">
                          {formatDateTime(t.created_at)}
                        </span>
                      </div>

                      <div className="history-card__content">
                        <h4 className="history-card__actor">
                          {t.actor_name}
                          {t.event_name && <span className="history-card__event"> • {t.event_name}</span>}
                        </h4>
                        <p className="history-card__summary">
                          {itemsSummary}
                        </p>
                      </div>

                      <div className="history-card__footer">
                        {t.proof_photo_url && (
                          <span className="history-card__photo-indicator" title="Memiliki foto bukti">
                            📷 Foto Bukti
                          </span>
                        )}
                        <span className="history-card__arrow">Lihat Detail →</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Zoom Foto Ukuran Penuh */}
      {zoomPhotoUrl && (
        <div className="photo-zoom-overlay" onClick={() => setZoomPhotoUrl(null)}>
          <button type="button" className="photo-zoom-close">✕</button>
          <img src={zoomPhotoUrl} alt="Foto Bukti Ukuran Penuh" className="photo-zoom-image" />
        </div>
      )}
    </>
  )
}

export default HistoryModal
