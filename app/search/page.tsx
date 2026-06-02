'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import RestaurantCard from '@/components/RestaurantCard'
import BottomNav from '@/components/BottomNav'
import { getRestaurants, getReservationsForDate, getAvailabilityStatus } from '@/lib/firestore'
import { getSavedRestaurantIds, toggleSavedRestaurant } from '@/lib/localStorage'
import type { Restaurant, AvailabilityStatus, Area } from '@/types'

const AREAS: Array<'Semua' | Area> = ['Semua', 'SCBD', 'Kemang', 'PIK', 'Menteng']
const PRICE_OPTIONS = [
  { label: '< 100k',  max: 100_000  },
  { label: '< 200k',  max: 200_000  },
  { label: '< 350k',  max: 350_000  },
  { label: 'Semua',   max: Infinity },
]
const RATING_OPTIONS = [4.0, 4.3, 4.5, 4.8]
const SORT_OPTIONS = [
  { label: 'Rating',    key: 'rating'    },
  { label: 'Harga ↑',  key: 'priceAsc'  },
  { label: 'Harga ↓',  key: 'priceDesc' },
  { label: 'Tersedia', key: 'available' },
]

type SortKey = 'rating' | 'priceAsc' | 'priceDesc' | 'available'

const AVAILABILITY_ORDER: Record<AvailabilityStatus, number> = {
  'Tersedia': 0, 'Hampir penuh': 1, 'Penuh': 2,
}

function todayString() { return new Date().toISOString().split('T')[0] }

export default function SearchPage() {
  const inputRef = useRef<HTMLInputElement>(null)

  const [allRestaurants, setAll]         = useState<Restaurant[]>([])
  const [availabilities, setAv]          = useState<Record<string, AvailabilityStatus>>({})
  const [savedIds, setSavedIds]          = useState<string[]>([])
  const [loading, setLoading]            = useState(true)
  const [showFilters, setShowFilters]    = useState(false)

  const [search, setSearch]              = useState('')
  const [filterArea, setArea]            = useState<'Semua' | Area>('Semua')
  const [filterCuisine, setCuisine]      = useState('')
  const [filterPriceMax, setPriceMax]    = useState(Infinity)
  const [filterRatingMin, setRatingMin]  = useState(0)
  const [sortBy, setSortBy]              = useState<SortKey>('rating')

  // Unique cuisine list derived from fetched data
  const cuisines = [...new Set(allRestaurants.map((r) => r.cuisine))].sort()

  useEffect(() => {
    inputRef.current?.focus()
    setSavedIds(getSavedRestaurantIds())

    async function load() {
      const data = await getRestaurants()
      setAll(data)

      const avMap: Record<string, AvailabilityStatus> = {}
      await Promise.all(
        data.map(async (r) => {
          const res = await getReservationsForDate(r.id, todayString())
          avMap[r.id] = getAvailabilityStatus(res.length, r.totalTables)
        })
      )
      setAv(avMap)
      setLoading(false)
    }
    load()
  }, [])

  function handleToggleSave(id: string) {
    toggleSavedRestaurant(id)
    setSavedIds(getSavedRestaurantIds())
  }

  function resetFilters() {
    setArea('Semua'); setCuisine(''); setPriceMax(Infinity); setRatingMin(0); setSortBy('rating'); setSearch('')
  }

  const hasActiveFilters = filterArea !== 'Semua' || filterCuisine !== '' || filterPriceMax !== Infinity || filterRatingMin !== 0

  // Filter
  let filtered = allRestaurants.filter((r) => {
    if (filterArea !== 'Semua' && r.area !== filterArea) return false
    if (filterCuisine && r.cuisine !== filterCuisine) return false
    if (r.priceMin > filterPriceMax) return false
    if (r.rating < filterRatingMin) return false
    if (search) {
      const q = search.toLowerCase()
      if (!r.name.toLowerCase().includes(q) && !r.cuisine.toLowerCase().includes(q) && !r.area.toLowerCase().includes(q)) return false
    }
    return true
  })

  // Sort
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'rating')    return b.rating - a.rating
    if (sortBy === 'priceAsc')  return a.priceMin - b.priceMin
    if (sortBy === 'priceDesc') return b.priceMin - a.priceMin
    if (sortBy === 'available') return AVAILABILITY_ORDER[availabilities[a.id] ?? 'Tersedia'] - AVAILABILITY_ORDER[availabilities[b.id] ?? 'Tersedia']
    return 0
  })

  return (
    <div className="min-h-screen bg-cream pb-24">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-cream border-b border-meja-border px-4 pt-12 pb-3 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/60 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Restoran, area, atau masakan..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-meja-border bg-white text-sm font-sans text-ink focus:outline-none focus:ring-2 focus:ring-gold/40"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/60">
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-sans font-medium transition-colors flex-shrink-0
              ${showFilters || hasActiveFilters ? 'bg-ink text-cream border-ink' : 'bg-white border-meja-border text-ink'}`}
          >
            <SlidersHorizontal size={14} />
            Filter
            {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-gold" />}
          </button>
        </div>

        {/* Sort pills — always visible */}
        <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
          {SORT_OPTIONS.map(({ label, key }) => (
            <button
              key={key}
              onClick={() => setSortBy(key as SortKey)}
              className={`flex-shrink-0 px-3 py-1 rounded-[9999px] text-[11px] font-sans font-medium transition-colors
                ${sortBy === key ? 'bg-ink text-cream' : 'bg-white border border-meja-border text-ink'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Collapsible filter panel */}
      {showFilters && (
        <div className="bg-white border-b border-meja-border px-4 py-4 space-y-4">
          {/* Area */}
          <div>
            <p className="text-[11px] font-sans text-ink/60 uppercase tracking-wider mb-2">Area</p>
            <div className="flex gap-2 flex-wrap">
              {AREAS.map((area) => (
                <button
                  key={area}
                  onClick={() => setArea(area)}
                  className={`px-3 py-1 rounded-[9999px] text-sm font-sans font-medium transition-colors
                    ${filterArea === area ? 'bg-ink text-cream' : 'bg-sand text-ink hover:bg-meja-border'}`}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>

          {/* Cuisine */}
          <div>
            <p className="text-[11px] font-sans text-ink/60 uppercase tracking-wider mb-2">Masakan</p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setCuisine('')}
                className={`px-3 py-1 rounded-[9999px] text-sm font-sans font-medium transition-colors
                  ${filterCuisine === '' ? 'bg-ink text-cream' : 'bg-sand text-ink hover:bg-meja-border'}`}
              >
                Semua
              </button>
              {cuisines.map((c) => (
                <button
                  key={c}
                  onClick={() => setCuisine(c)}
                  className={`px-3 py-1 rounded-[9999px] text-sm font-sans font-medium transition-colors
                    ${filterCuisine === c ? 'bg-ink text-cream' : 'bg-sand text-ink hover:bg-meja-border'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          <div>
            <p className="text-[11px] font-sans text-ink/60 uppercase tracking-wider mb-2">Harga Minimum</p>
            <div className="flex gap-2">
              {PRICE_OPTIONS.map(({ label, max }) => (
                <button
                  key={label}
                  onClick={() => setPriceMax(max)}
                  className={`px-3 py-1 rounded-[9999px] text-sm font-sans font-medium transition-colors
                    ${filterPriceMax === max ? 'bg-ink text-cream' : 'bg-sand text-ink hover:bg-meja-border'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <p className="text-[11px] font-sans text-ink/60 uppercase tracking-wider mb-2">Rating Minimum</p>
            <div className="flex gap-2">
              <button
                onClick={() => setRatingMin(0)}
                className={`px-3 py-1 rounded-[9999px] text-sm font-sans font-medium transition-colors
                  ${filterRatingMin === 0 ? 'bg-ink text-cream' : 'bg-sand text-ink hover:bg-meja-border'}`}
              >
                Semua
              </button>
              {RATING_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRatingMin(r)}
                  className={`px-3 py-1 rounded-[9999px] text-sm font-sans font-medium transition-colors
                    ${filterRatingMin === r ? 'bg-ink text-cream' : 'bg-sand text-ink hover:bg-meja-border'}`}
                >
                  {r}+
                </button>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <button onClick={resetFilters} className="text-sm font-sans text-terra underline">
              Reset semua filter
            </button>
          )}
        </div>
      )}

      {/* Results */}
      <div className="px-4 pt-4">
        {!loading && (
          <p className="text-[11px] font-sans text-ink/60 mb-3">
            {filtered.length} restoran ditemukan
          </p>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="rounded-xl bg-sand animate-pulse h-52" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-display text-xl text-ink/60">Tidak ada restoran sesuai filter</p>
            <button
              onClick={resetFilters}
              className="mt-4 text-sm font-sans text-gold underline"
            >
              Reset filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((r) => (
              <RestaurantCard
                key={r.id}
                restaurant={r}
                availability={availabilities[r.id] ?? 'Tersedia'}
                saved={savedIds.includes(r.id)}
                onToggleSave={handleToggleSave}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
