/**
 * useItems.js — Custom hook untuk fetch dan filter daftar barang dari Supabase.
 *
 * Mendukung pencarian berbasis teks (searchQuery) dan filter kategori (selectedCategory).
 *
 * @returns {{
 *   items: Array,
 *   allItems: Array,
 *   isLoading: boolean,
 *   error: string|null,
 *   searchQuery: string,
 *   setSearchQuery: Function,
 *   selectedCategory: string,
 *   setSelectedCategory: Function,
 *   categoryCounts: Record<string, number>,
 *   refetch: Function,
 *   totalItems: number
 * }}
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { ITEM_STATUS } from '../lib/constants'

/**
 * Mengambil semua barang aktif dari database dan menyediakan fitur pencarian serta filter kategori.
 * Hanya barang berstatus 'active' yang ditampilkan di katalog.
 *
 * @returns {object} State dan fungsi untuk mengelola daftar barang
 */
export function useItems() {
  const [items, setItems]                       = useState([])
  const [isLoading, setIsLoading]               = useState(true)
  const [error, setError]                       = useState(null)
  const [searchQuery, setSearchQuery]           = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  /**
   * Fungsi fetch data barang dari Supabase.
   * Dibungkus useCallback agar referensi fungsi stabil.
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
   * Menghitung jumlah barang aktif per kategori untuk badge counter pada filter bar.
   */
  const categoryCounts = useMemo(() => {
    const counts = { all: items.length }
    items.forEach((item) => {
      const cat = item.category || 'Lain-lain'
      counts[cat] = (counts[cat] || 0) + 1
    })
    return counts
  }, [items])

  /**
   * Filter barang berdasarkan searchQuery DAN selectedCategory.
   */
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Filter Kategori
      const itemCategory = item.category || 'Lain-lain'
      const matchesCategory = selectedCategory === 'all' || itemCategory === selectedCategory

      // 2. Filter Search Query
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))

      return matchesCategory && matchesSearch
    })
  }, [items, selectedCategory, searchQuery])

  return {
    items: filteredItems,          // Barang yang sudah difilter (ini yang dirender di grid)
    allItems: items,               // Seluruh master barang aktif tanpa filter
    isLoading,
    error,
    searchQuery,
    setSearchQuery,                // Dipanggil saat user mengetik di search box
    selectedCategory,
    setSelectedCategory,          // Dipanggil saat user memilih tab kategori
    categoryCounts,                // Map jumlah barang per kategori
    refetch: fetchItems,           // Dipanggil setelah transaksi/edit untuk refresh stok
    totalItems: items.length       // Total sebelum filter
  }
}

