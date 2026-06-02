'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import StatCard from '@/components/dashboard/StatCard'
import BookingTimeline from '@/components/dashboard/BookingTimeline'
import TableMap from '@/components/dashboard/TableMap'
import WaitlistPanel from '@/components/dashboard/WaitlistPanel'
import {
  getRestaurant,
  getRestaurantTables,
  getReservationsForDate,
  getWaitlist,
} from '@/lib/firestore'
import type { Restaurant, RestaurantTable, Reservation, WaitlistEntry } from '@/types'

const DEMO_RESTAURANT_ID = 'demo' // replace with real ID after seeding

function todayString(): string {
  return new Date().toISOString().split('T')[0]
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export default function DashboardPage() {
  const [restaurant, setRestaurant]     = useState<Restaurant | null>(null)
  const [tables, setTables]             = useState<RestaurantTable[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [waitlist, setWaitlist]         = useState<WaitlistEntry[]>([])

  // Demo data fallback when Firebase not configured
  const useDemoData = !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

  useEffect(() => {
    if (useDemoData) {
      // Use mock data for demo
      setTables(
        Array.from({ length: 18 }, (_, i) => ({
          id:           `t${i + 1}`,
          restaurantId: DEMO_RESTAURANT_ID,
          tableNumber:  `T${i + 1}`,
          capacity:     [2, 2, 4, 4, 6, 6][i % 6],
          status:       (['available', 'reserved', 'occupied', 'available', 'available', 'reserved'] as const)[i % 6],
        }))
      )
      setReservations([
        { id: '1', restaurantId: 'demo', tableId: 'T3', userId: 'u1', guestName: 'Budi Santoso', guestPhone: '08111', date: todayString(), timeSlot: '18:00', guestCount: 4, status: 'confirmed', referenceCode: 'MJ-0206-01', createdAt: new Date() },
        { id: '2', restaurantId: 'demo', tableId: 'T7', userId: 'u2', guestName: 'Siti Rahayu',  guestPhone: '08112', date: todayString(), timeSlot: '18:00', guestCount: 2, status: 'arrived',   referenceCode: 'MJ-0206-02', createdAt: new Date() },
        { id: '3', restaurantId: 'demo', tableId: 'T2', userId: 'u3', guestName: 'Andi Wijaya',  guestPhone: '08113', date: todayString(), timeSlot: '19:00', guestCount: 6, status: 'confirmed', referenceCode: 'MJ-0206-03', createdAt: new Date() },
        { id: '4', restaurantId: 'demo', tableId: 'T9', userId: 'u4', guestName: 'Maya Putri',   guestPhone: '08114', date: todayString(), timeSlot: '19:30', guestCount: 3, status: 'pending',   referenceCode: 'MJ-0206-04', createdAt: new Date() },
        { id: '5', restaurantId: 'demo', tableId: 'T5', userId: 'u5', guestName: 'Dian Prastowo',guestPhone: '08115', date: todayString(), timeSlot: '20:00', guestCount: 2, status: 'confirmed', referenceCode: 'MJ-0206-05', createdAt: new Date() },
      ])
      setWaitlist([
        { id: 'w1', restaurantId: 'demo', userId: 'u6', guestName: 'Rini Susanti',  guestPhone: '08116', guestCount: 2, joinedAt: new Date(Date.now() - 15 * 60_000), notifiedAt: null, status: 'waiting' },
        { id: 'w2', restaurantId: 'demo', userId: 'u7', guestName: 'Hendra Kusuma', guestPhone: '08117', guestCount: 4, joinedAt: new Date(Date.now() - 32 * 60_000), notifiedAt: null, status: 'waiting' },
        { id: 'w3', restaurantId: 'demo', userId: 'u8', guestName: 'Lina Hartati',  guestPhone: '08118', guestCount: 3, joinedAt: new Date(Date.now() - 48 * 60_000), notifiedAt: null, status: 'waiting' },
      ])
      return
    }

    async function load() {
      const r = await getRestaurant(DEMO_RESTAURANT_ID)
      if (r) setRestaurant(r)
      const [t, res, wl] = await Promise.all([
        getRestaurantTables(DEMO_RESTAURANT_ID),
        getReservationsForDate(DEMO_RESTAURANT_ID, todayString()),
        getWaitlist(DEMO_RESTAURANT_ID),
      ])
      setTables(t)
      setReservations(res)
      setWaitlist(wl)
    }
    load()
  }, [useDemoData])

  const confirmedToday  = reservations.filter((r) => r.status !== 'cancelled').length
  const totalGuests     = reservations.filter((r) => r.status !== 'cancelled').reduce((s, r) => s + r.guestCount, 0)
  const emptyTables     = tables.filter((t) => t.status === 'available').length
  const waitingCount    = waitlist.filter((w) => w.status === 'waiting').length

  const displayName = restaurant?.name ?? 'Nusa Gastronomy'

  return (
    <div className="p-6 space-y-6">
      {/* Topbar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-medium text-ink text-lg">{formatDate(new Date())}</h2>
          <p className="text-xs font-sans text-muted mt-0.5">Shift malam · 17:00 – 23:00 WIB</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-[9999px] bg-ink text-cream text-sm font-sans font-medium hover:bg-gold-dark transition-colors">
          <Plus size={15} />
          Reservasi Baru
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Reservasi"   value={confirmedToday} subtitle="+3 dari kemarin" delta={3}  />
        <StatCard label="Tamu Malam"  value={totalGuests}    subtitle={`${Math.round((totalGuests / (tables.length * 4)) * 100)}% kapasitas`} delta={1} />
        <StatCard label="Meja Kosong" value={emptyTables}    subtitle="tersedia sekarang" />
        <StatCard label="Waitlist"    value={waitingCount}   subtitle="±25 mnt estimasi" />
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-[1fr_340px] gap-5">
        {/* Left — Timeline */}
        <BookingTimeline reservations={reservations} restaurantName={displayName} />

        {/* Right — Table map + Waitlist */}
        <div className="space-y-4">
          <TableMap tables={tables} />
          <WaitlistPanel waitlist={waitlist} />
        </div>
      </div>
    </div>
  )
}
