/**
 * useItems.js — Custom hook untuk fetch dan filter daftar barang dari Supabase.
 *
 * Kenapa dipisah ke custom hook, bukan langsung di komponen?
 * Logika fetch data (useEffect, useState, error handling) bisa dipakai ulang
 * di beberapa komponen berbeda. Kalau langsung di komponen, kita harus
 * copy-paste — yang jelas melanggar prinsip DRY (Don't Repeat Yourself).
 *
 * Pola ini disebut "Data Fetching Hook" — salah satu pola paling umum di React.
 *
 * @returns {{
 *   items: Array,
 *   isLoading: boolean,
 *   error: string|null,
 *   searchQuery: string,
 *   setSearchQuery: Function,
 *   refetch: Function
 * }}
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { ITEM_STATUS } from '../lib/constants'

/**
 * Mengambil semua barang aktif dari database dan menyediakan fitur pencarian.
 * Hanya barang berstatus 'active' yang ditampilkan di katalog.
 *
 * @returns {object} State dan fungsi untuk mengelola daftar barang
 */
export function useItems() {
  const [items, setItems]           = useState([])
  const [isLoading, setIsLoading]   = useState(true)
  const [error, setError]           = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  /**
   * Fungsi fetch data barang dari Supabase.
   * Dibungkus useCallback agar referensi fungsi stabil —
   * sehingga bisa dipakai sebagai dependency useEffect tanpa infinite loop,
   * dan bisa dipanggil ulang dari luar (untuk refetch manual).
   */
  const fetchItems = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('items')
      .select('*')
      .eq('status', ITEM_STATUS.ACTIVE)  // Hanya ambil barang aktif
      .order('name', { ascending: true }) // Urut A-Z agar mudah dicari

    if (fetchError) {
      console.error('[useItems] Gagal fetch items:', fetchError)
      setError(fetchError.message)
      setItems([])
    } else {
      setItems(data || [])
    }

    setIsLoading(false)
  }, [])

  // Jalankan fetch saat hook pertama kali dipakai
  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  /**
   * Filter barang berdasarkan searchQuery.
   * Pencarian dilakukan di sisi klien (client-side filtering) — cocok untuk
   * jumlah data yang tidak terlalu besar (~ratusan item).
   * Untuk data sangat besar (ribuan+), sebaiknya filter di server (query Supabase).
   *
   * @type {Array} Daftar barang yang sudah difilter
   */
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return {
    items: filteredItems,    // Barang yang sudah difilter (ini yang dirender)
    isLoading,
    error,
    searchQuery,
    setSearchQuery,          // Dipanggil saat user mengetik di search box
    refetch: fetchItems,     // Dipanggil setelah transaksi untuk refresh stok
    totalItems: items.length // Total sebelum filter (untuk info "X dari Y barang")
  }
}
