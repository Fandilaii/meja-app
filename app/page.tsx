'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import RestaurantCard from '@/components/RestaurantCard'
import BottomNav from '@/components/BottomNav'
import { getRestaurants, getReservationsForDate, getAvailabilityStatus } from '@/lib/firestore'
import type { Restaurant, AvailabilityStatus, FilterArea } from '@/types'

const AREAS: FilterArea[] = ['Semua', 'SCBD', 'Kemang', 'PIK', 'Menteng']

function todayString(): string {
  return new Date().toISOString().split('T')[0]
}

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 11) return 'Selamat pagi'
  if (hour < 15) return 'Selamat siang'
  if (hour < 18) return 'Selamat sore'
  return 'Selamat malam'
}

export default function DiscoveryPage() {
  const [restaurants, setRestaurants]         = useState<Restaurant[]>([])
  const [availabilities, setAvailabilities]   = useState<Record<string, AvailabilityStatus>>({})
  const [activeArea, setActiveArea]           = useState<FilterArea>('Semua')
  const [search, setSearch]                   = useState('')
  const [loading, setLoading]                 = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const data = await getRestaurants(activeArea === 'Semua' ? undefined : activeArea)
      setRestaurants(data)

      const avMap: Record<string, AvailabilityStatus> = {}
      await Promise.all(
        data.map(async (r) => {
          const reservations = await getReservationsForDate(r.id, todayString())
          avMap[r.id] = getAvailabilityStatus(reservations.length, r.totalTables)
        })
      )
      setAvailabilities(avMap)
      setLoading(false)
    }
    load()
  }, [activeArea])

  const filtered = restaurants.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.cuisine.toLowerCase().includes(search.toLowerCase()) ||
      r.area.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-cream pb-24">
      {/* Hero */}
      <div className="bg-ink px-4 pt-12 pb-6">
        <p className="text-[12px] font-sans text-cream/70 mb-1">
          {greeting()}, Selamat datang 👋
        </p>
        <h1 className="font-display font-bold text-cream text-[28px] leading-tight tracking-[-0.02em] mb-5">
          Temukan meja yang<br />sempurna.
        </h1>

        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Restoran, area, atau masakan..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 text-cream placeholder:text-white/55
              text-sm font-sans border border-white/10 focus:outline-none focus:ring-1 focus:ring-gold/60"
          />
        </div>
      </div>

      {/* Area filter pills */}
      <div className="px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {AREAS.map((area) => (
            <button
              key={area}
              onClick={() => setActiveArea(area)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-[9999px] text-sm font-sans font-medium transition-colors
                ${activeArea === area
                  ? 'bg-ink text-cream'
                  : 'bg-white text-ink border border-meja-border hover:border-gold'
                }`}
            >
              {area}
            </button>
          ))}
        </div>
      </div>

      {/* Restaurant grid */}
      <div className="px-4">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl bg-sand animate-pulse h-52" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-display text-xl text-muted">Tidak ada restoran ditemukan</p>
            <p className="text-sm font-sans text-muted mt-1">Coba ubah filter atau kata kunci</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                availability={availabilities[restaurant.id] ?? 'Tersedia'}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
