/**
 * DepositedItemsList.jsx — Komponen untuk menampilkan daftar barang-barang titipan aktif di gudang.
 *
 * Fitur:
 * 1. Menampilkan barang yang sedang dititipkan (belum diambil kembali).
 * 2. Mengambil data dari SQL View 'active_deposits' (atau fallback query transactions).
 * 3. Search filter instan berdasarkan nama barang, nama penitip, atau event.
 * 4. Tombol aksi cepat '🏷️ Ambil Barang Ini' untuk langsung membuka alur pengambilan barang titipan.
 *
 * @param {object} props
 * @param {Function} [props.onPickupItem] - Callback saat tombol 'Ambil Barang Ini' diklik di Dashboard
 * @param {boolean} [props.isSelectMode=false] - Mode seleksi jika disematkan di dalam Wizard Pengambilan
 * @param {string|null} [props.selectedDepositId=null] - ID barang titipan yang sedang terpilih di Wizard
 * @param {Function} [props.onSelect] - Callback saat kartu dipilih dalam mode seleksi
 */
import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import './DepositedItemsList.css'

function DepositedItemsList({
  onPickupItem,
  isSelectMode = false,
  selectedDepositId = null,
  onSelect
}) {
  const [deposits, setDeposits] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch daftar barang titipan yang belum diambil
  const fetchActiveDeposits = useCallback(async () => {
    setIsLoading(true)
    setErrorMsg('')
    try {
      // 1. Coba query dari view active_deposits
      const { data, error } = await supabase
        .from('active_deposits')
        .select('*')

      if (!error && data) {
        setDeposits(data)
      } else {
        // Fallback jika view belum dibuat: ambil dari transactions 'penitipan'
        console.warn('View active_deposits belum siap, menggunakan fallback query transactions:', error)
        const { data: fallbackData, error: fbError } = await supabase
          .from('transactions')
          .select('id, actor_name, event_name, proof_photo_url, notes, created_at')
          .eq('transaction_type', 'penitipan')
          .order('created_at', { ascending: false })

        if (fbError) throw fbError
        
        // Map format agar seragam
        const mapped = (fallbackData || []).map(t => ({
          id: t.id,
          depositor_name: t.actor_name,
          event_name: t.event_name,
          proof_photo_url: t.proof_photo_url,
          notes: t.notes,
          deposited_at: t.created_at
        }))
        setDeposits(mapped)
      }
    } catch (err) {
      console.error('Gagal mengambil daftar barang titipan:', err)
      setErrorMsg(err.message || 'Gagal memuat barang titipan.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchActiveDeposits()
  }, [fetchActiveDeposits])

  // Format tanggal lokal
  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Helper untuk memecah teks catatan titipan menjadi judul & rincian
  const parseDepositNotes = (notes) => {
    if (!notes) return { title: 'Barang Titipan Luar', description: '' }
    
    // Format standar: "Barang: [Nama]\nRincian: [Deskripsi]"
    const lines = notes.split('\n')
    let title = 'Barang Titipan'
    let description = notes

    const itemLine = lines.find(l => l.startsWith('Barang:'))
    if (itemLine) {
      title = itemLine.replace('Barang:', '').trim()
    }

    return { title, description }
  }

  // Filter pencarian
  const filteredDeposits = deposits.filter((d) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    const matchName = d.depositor_name?.toLowerCase().includes(q)
    const matchEvent = d.event_name?.toLowerCase().includes(q)
    const matchNotes = d.notes?.toLowerCase().includes(q)
    return matchName || matchEvent || matchNotes
  })

  return (
    <div className={`deposits-container ${isSelectMode ? 'deposits-container--select-mode' : ''}`}>
      {/* Header & Search Bar (jika bukan select mode di wizard) */}
      {!isSelectMode && (
        <div className="deposits-header">
          <div className="deposits-header__title-group">
            <h2 className="deposits-header__title">Barang Titipan Aktif</h2>
            {!isLoading && (
              <span className="deposits-header__count">
                {filteredDeposits.length} barang sedang dititipkan
              </span>
            )}
          </div>

          <div className="deposits-search">
            <span className="deposits-search__icon">🔍</span>
            <input
              type="search"
              placeholder="Cari barang titipan atau nama penitip..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="deposits-search__input"
            />
            {searchQuery && (
              <button
                type="button"
                className="deposits-search__clear"
                onClick={() => setSearchQuery('')}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* State Loading */}
      {isLoading && (
        <div className="deposits-state deposits-state--loading">
          <div className="deposits-spinner" />
          <p>Memuat daftar barang titipan...</p>
        </div>
      )}

      {/* State Error */}
      {!isLoading && errorMsg && (
        <div className="deposits-state deposits-state--error">
          <span className="deposits-state__icon">⚠️</span>
          <p>Gagal memuat barang titipan: {errorMsg}</p>
          <button type="button" className="btn-retry" onClick={fetchActiveDeposits}>
            Coba Lagi
          </button>
        </div>
      )}

      {/* State Empty */}
      {!isLoading && !errorMsg && filteredDeposits.length === 0 && (
        <div className="deposits-state deposits-state--empty">
          <span className="deposits-state__icon">🎒</span>
          <p className="deposits-state__title">
            {searchQuery ? 'Tidak ada barang titipan yang cocok' : 'Tidak ada barang titipan aktif'}
          </p>
          <p className="deposits-state__message">
            {searchQuery
              ? 'Coba kata kunci pencarian yang lain.'
              : 'Semua barang titipan dari luar sudah diambil kembali oleh pemiliknya.'}
          </p>
        </div>
      )}

      {/* Grid Kartu Barang Titipan */}
      {!isLoading && !errorMsg && filteredDeposits.length > 0 && (
        <div className="deposits-grid">
          {filteredDeposits.map((item) => {
            const { title, description } = parseDepositNotes(item.notes)
            const isSelected = selectedDepositId === item.id

            return (
              <div
                key={item.id}
                className={`deposit-card ${isSelected ? 'deposit-card--selected' : ''} ${isSelectMode ? 'deposit-card--selectable' : ''}`}
                onClick={() => isSelectMode && onSelect && onSelect(item)}
              >
                {/* Foto Bukti Titipan */}
                <div className="deposit-card__image-wrapper">
                  {item.proof_photo_url ? (
                    <img
                      src={item.proof_photo_url}
                      alt={title}
                      className="deposit-card__image"
                      loading="lazy"
                    />
                  ) : (
                    <div className="deposit-card__image-placeholder">🎒</div>
                  )}
                  <span className="deposit-card__badge-status">Sedang Dititipkan</span>
                </div>

                {/* Body Informasi */}
                <div className="deposit-card__body">
                  <h3 className="deposit-card__title">{title}</h3>

                  <div className="deposit-card__meta">
                    <span className="deposit-card__depositor">
                      👤 {item.depositor_name}
                      {item.event_name && <span className="deposit-card__event"> • {item.event_name}</span>}
                    </span>
                    <span className="deposit-card__time">
                      🕒 Dititipkan: {formatDate(item.deposited_at)}
                    </span>
                  </div>

                  <p className="deposit-card__desc">{description}</p>

                  {/* Tombol Aksi Ambil (Hanya saat di Dashboard) */}
                  {!isSelectMode && onPickupItem && (
                    <button
                      type="button"
                      className="btn-pickup-item"
                      onClick={(e) => {
                        e.stopPropagation()
                        onPickupItem(item)
                      }}
                    >
                      <span>🏷️</span>
                      <span>Ambil Barang Ini</span>
                    </button>
                  )}

                  {/* Radio Indicator (Saat mode seleksi di Wizard) */}
                  {isSelectMode && (
                    <div className="deposit-card__select-indicator">
                      <span className={`select-radio ${isSelected ? 'select-radio--checked' : ''}`} />
                      <span>{isSelected ? 'Barang Terpilih' : 'Klik untuk Pilih'}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default DepositedItemsList
