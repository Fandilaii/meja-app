'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import BottomNav from '@/components/BottomNav'
import ReservationCard from '@/components/ReservationCard'
import { getReservationsByIds, getRestaurant, updateReservationStatus } from '@/lib/firestore'
import { getReservationIds } from '@/lib/localStorage'
import type { Reservation, Restaurant } from '@/types'
import Link from 'next/link'

type Tab = 'upcoming' | 'past' | 'cancelled'

function todayString() { return new Date().toISOString().split('T')[0] }

function getUpcomingReminder(
  reservations: Reservation[],
  restaurants: Record<string, Restaurant>
): { reservation: Reservation; restaurant: Restaurant } | null {
  const now   = Date.now()
  const in24h = now + 24 * 60 * 60 * 1000

  const soonest = reservations
    .filter((r) => r.status !== 'cancelled' && r.status !== 'arrived')
    .map((r) => {
      const [h, m]  = r.timeSlot.split(':').map(Number)
      const [y, mo, d] = r.date.split('-').map(Number)
      const dt = new Date(y, mo - 1, d, h, m).getTime()
      return { reservation: r, dt }
    })
    .filter(({ dt }) => dt > now && dt <= in24h)
    .sort((a, b) => a.dt - b.dt)[0]

  if (!soonest) return null
  const rest = restaurants[soonest.reservation.restaurantId]
  if (!rest) return null
  return { reservation: soonest.reservation, restaurant: rest }
}

function classifyReservation(r: Reservation): Tab {
  if (r.status === 'cancelled') return 'cancelled'
  if (r.status === 'arrived' || r.date < todayString()) return 'past'
  return 'upcoming'
}

const TAB_LABELS: Record<Tab, string> = {
  upcoming:  'Mendatang',
  past:      'Selesai',
  cancelled: 'Dibatalkan',
}

export default function ReservasiPage() {
  const [reservations, setReservations]   = useState<Reservation[]>([])
  const [restaurantMap, setRestaurantMap] = useState<Record<string, Restaurant>>({})
  const [activeTab, setActiveTab]         = useState<Tab>('upcoming')
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    async function load() {
      const ids = getReservationIds()
      if (ids.length === 0) { setLoading(false); return }

      const res = await getReservationsByIds(ids)
      setReservations(res)

      const uniqueRestaurantIds = [...new Set(res.map((r) => r.restaurantId))]
      const restaurants = await Promise.all(uniqueRestaurantIds.map((id) => getRestaurant(id)))
      const map: Record<string, Restaurant> = {}
      restaurants.forEach((r) => { if (r) map[r.id] = r })
      setRestaurantMap(map)
      setLoading(false)
    }
    load()
  }, [])

  async function handleCancel(id: string) {
    await updateReservationStatus(id, 'cancelled')
    setReservations((prev) =>
      prev.map((r) => r.id === id ? { ...r, status: 'cancelled' } : r)
    )
  }

  const tabReservations = reservations.filter((r) => classifyReservation(r) === activeTab)

  return (
    <div className="min-h-screen bg-cream pb-24">
      {/* Header */}
      <div className="bg-ink px-4 pt-12 pb-5">
        <h1 className="font-display font-bold text-cream text-2xl">Reservasi Saya</h1>
        <p className="text-sm font-sans text-cream/70 mt-1">Riwayat dan status pemesanan</p>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-4 pb-3 flex gap-2">
        {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => {
          const count = reservations.filter((r) => classifyReservation(r) === tab).length
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-[9999px] text-sm font-sans font-medium transition-colors
                ${activeTab === tab
                  ? 'bg-ink text-cream'
                  : 'bg-white border border-meja-border text-ink hover:border-gold'
                }`}
            >
              {TAB_LABELS[tab]}
              {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab ? 'bg-white/20' : 'bg-sand'}`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 24h reminder banner */}
      {activeTab === 'upcoming' && (() => {
        const reminder = getUpcomingReminder(reservations, restaurantMap)
        if (!reminder) return null
        return (
          <div className="mx-4 mb-2 px-4 py-3 rounded-2xl bg-gold-light border border-gold/30 flex items-start gap-3">
            <span className="text-lg leading-none mt-0.5">⏰</span>
            <p className="text-sm font-sans text-[#5C3E10]">
              Reservasimu jam <strong>{reminder.reservation.timeSlot}</strong> di{' '}
              <strong>{reminder.restaurant.name}</strong> kurang dari 24 jam lagi. Jangan lupa!
            </p>
          </div>
        )
      })()}

      {/* Content */}
      <div className="px-4 space-y-3">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl bg-sand animate-pulse h-36" />
          ))
        ) : tabReservations.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-display text-xl text-ink/75">
              {activeTab === 'upcoming'  ? 'Belum ada reservasi mendatang'
               : activeTab === 'past'   ? 'Belum ada riwayat reservasi'
               :                          'Tidak ada reservasi dibatalkan'}
            </p>
            <p className="text-sm font-sans text-ink/45 mt-2">
              {activeTab === 'upcoming'  ? 'Reservasimu akan muncul di sini'
               : activeTab === 'past'   ? 'Riwayat kunjunganmu akan muncul di sini'
               :                          'Belum ada reservasi yang dibatalkan'}
            </p>
            {activeTab === 'upcoming' && (
              <Link
                href="/search"
                className="inline-block mt-4 px-6 py-2.5 rounded-[9999px] bg-ink text-cream text-sm font-sans font-medium hover:bg-gold-dark transition-colors"
              >
                Cari Restoran
              </Link>
            )}
          </div>
        ) : (
          tabReservations.map((res) => (
            <ReservationCard
              key={res.id}
              reservation={res}
              restaurant={restaurantMap[res.restaurantId] ?? null}
              tab={activeTab}
              onCancel={handleCancel}
            />
          ))
        )}
      </div>

      <BottomNav />
    </div>
  )
}
