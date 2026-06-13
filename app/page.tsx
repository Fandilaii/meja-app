'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { Search, CalendarDays, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import RestaurantCard from '@/components/RestaurantCard'
import BottomNav from '@/components/BottomNav'
import { getRestaurants, getReservationsForDate, getAvailabilityStatus, getRestaurant } from '@/lib/firestore'
import { getSavedRestaurantIds, toggleSavedRestaurant, getGuestProfile, getReservationIds } from '@/lib/localStorage'
import { getReservationsByIds } from '@/lib/firestore'
import type { Restaurant, AvailabilityStatus, FilterArea, Reservation } from '@/types'

const AREAS: FilterArea[] = ['Semua', 'SCBD', 'Kemang', 'PIK', 'Menteng']

function todayString(): string {
  return new Date().toISOString().split('T')[0]
}

function greeting(name?: string): string {
  const hour = new Date().getHours()
  const base =
    hour < 11 ? 'Selamat pagi' :
    hour < 15 ? 'Selamat siang' :
    hour < 18 ? 'Selamat sore' : 'Selamat malam'
  if (name?.trim()) return `${base}, ${name.split(' ')[0]} 👋`
  return `${base} 👋`
}

interface UpcomingBanner {
  reservation: Reservation
  restaurantName: string
}

export default function DiscoveryPage() {
  const [restaurants, setRestaurants]       = useState<Restaurant[]>([])
  const [availabilities, setAvailabilities] = useState<Record<string, AvailabilityStatus>>({})
  const [savedIds, setSavedIds]             = useState<string[]>([])
  const [activeArea, setActiveArea]         = useState<FilterArea>('Semua')
  const [search, setSearch]                 = useState('')
  const [loading, setLoading]               = useState(true)
  const [guestName, setGuestName]           = useState('')
  const [upcomingBanner, setUpcoming]       = useState<UpcomingBanner | null>(null)
  const [isFirstTime, setFirstTime]         = useState(false)

  // Load guest profile + upcoming reservation
  useEffect(() => {
    const profile = getGuestProfile()
    if (profile?.name) {
      setGuestName(profile.name)
    } else {
      setFirstTime(true)
    }

    const ids = getReservationIds()
    if (ids.length === 0) { setFirstTime(true); return }

    getReservationsByIds(ids).then(async (reservations) => {
      const today = todayString()
      const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().split('T')[0]

      const upcoming = reservations
        .filter((r) =>
          (r.status === 'pending' || r.status === 'confirmed') &&
          (r.date === today || r.date === tomorrowStr)
        )
        .sort((a, b) => a.date.localeCompare(b.date) || a.timeSlot.localeCompare(b.timeSlot))[0]

      if (upcoming) {
        const rest = await getRestaurant(upcoming.restaurantId)
        setUpcoming({ reservation: upcoming, restaurantName: rest?.name ?? 'Restoran' })
      }
    })
  }, [])

  // Load restaurants + availability
  useEffect(() => {
    setSavedIds(getSavedRestaurantIds())

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

  function handleToggleSave(id: string) {
    toggleSavedRestaurant(id)
    setSavedIds(getSavedRestaurantIds())
  }

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
          {greeting(guestName)}
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

      <div className="px-4 pt-4 space-y-3">
        {/* Upcoming reservation banner */}
        {upcomingBanner && (
          <Link
            href="/reservasi"
            className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-ink border border-ink/0 hover:bg-ink/90 transition-colors group"
          >
            <div className="w-9 h-9 rounded-xl bg-gold/20 flex items-center justify-center flex-shrink-0">
              <CalendarDays size={16} className="text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-sans text-cream/60 uppercase tracking-wider">
                {upcomingBanner.reservation.date === todayString() ? 'Reservasi Hari Ini' : 'Reservasi Besok'}
              </p>
              <p className="text-sm font-display font-medium text-cream truncate">
                {upcomingBanner.restaurantName} · {upcomingBanner.reservation.timeSlot}
              </p>
            </div>
            <ChevronRight size={15} className="text-cream/40 group-hover:text-cream/60 transition-colors flex-shrink-0" />
          </Link>
        )}

        {/* First-time "how it works" */}
        {isFirstTime && !upcomingBanner && (
          <div className="bg-white rounded-2xl border border-meja-border overflow-hidden">
            <div className="px-4 pt-4 pb-3">
              <p className="text-[10px] font-sans text-ink/50 uppercase tracking-wider mb-3">Cara Kerja Meja</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { emoji: '🔍', step: '1', title: 'Temukan', desc: 'Pilih restoran favoritmu' },
                  { emoji: '📅', step: '2', title: 'Pesan',   desc: 'Pilih tanggal & waktu' },
                  { emoji: '🪑', step: '3', title: 'Nikmati', desc: 'Tunjukkan QR saat tiba' },
                ].map(({ emoji, title, desc }) => (
                  <div key={title} className="text-center">
                    <div className="text-2xl mb-1.5">{emoji}</div>
                    <p className="text-[11px] font-display font-semibold text-ink">{title}</p>
                    <p className="text-[10px] font-sans text-ink/50 mt-0.5 leading-tight">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-4 pb-4">
              <p className="text-[11px] font-sans text-ink/50 text-center">
                Gratis · Tidak ada biaya reservasi
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Area filter pills */}
      <div className="px-4 py-3">
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
            <p className="font-display text-xl text-ink/60">Tidak ada restoran ditemukan</p>
            <p className="text-sm font-sans text-ink/60 mt-1">Coba ubah filter atau kata kunci</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                availability={availabilities[restaurant.id] ?? 'Tersedia'}
                saved={savedIds.includes(restaurant.id)}
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
