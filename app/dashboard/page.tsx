'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { CheckCheck, Clock, Users } from 'lucide-react'
import StatCard from '@/components/dashboard/StatCard'
import BookingTimeline from '@/components/dashboard/BookingTimeline'
import TableMap from '@/components/dashboard/TableMap'
import WaitlistPanel from '@/components/dashboard/WaitlistPanel'
import WalkInModal from '@/components/dashboard/WalkInModal'
import {
  subscribeToTables,
  subscribeToWaitlist,
  subscribeToReservationsForDate,
  updateReservationStatus,
} from '@/lib/firestore'
import type { RestaurantTable, Reservation, WaitlistEntry } from '@/types'

const RESTAURANT_ID = 'P3R1nyDl8sqYukKkculP'

function todayString(): string {
  return new Date().toISOString().split('T')[0]
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function minsUntil(timeSlot: string, now: Date): number {
  const [h, m]   = timeSlot.split(':').map(Number)
  const slotMins = h * 60 + m
  const nowMins  = now.getHours() * 60 + now.getMinutes()
  return slotMins - nowMins
}

function countdownLabel(mins: number): string {
  if (mins <= 0)  return 'Sekarang'
  if (mins < 60)  return `${mins} mnt lagi`
  return `${Math.floor(mins / 60)}j ${mins % 60 > 0 ? ` ${mins % 60}m` : ''} lagi`
}

export default function DashboardPage() {
  const [tables,       setTables]       = useState<RestaurantTable[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [waitlist,     setWaitlist]     = useState<WaitlistEntry[]>([])
  const [now,          setNow]          = useState(new Date())
  const [confirming,   setConfirming]   = useState(false)
  const [showWalkIn,   setShowWalkIn]   = useState(false)

  useEffect(() => {
    const unsubT = subscribeToTables(RESTAURANT_ID, setTables)
    const unsubR = subscribeToReservationsForDate(RESTAURANT_ID, todayString(), setReservations)
    const unsubW = subscribeToWaitlist(RESTAURANT_ID, setWaitlist)
    return () => { unsubT(); unsubR(); unsubW() }
  }, [])

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const activeRes      = reservations.filter((r) => r.status !== 'cancelled')
  const totalGuests    = activeRes.reduce((s, r) => s + r.guestCount, 0)
  const occupiedTables = tables.filter((t) => t.status !== 'available').length
  const waitingCount   = waitlist.filter((w) => w.status === 'waiting').length
  const pendingRes     = reservations.filter((r) => r.status === 'pending')
  const walkInCount    = reservations.filter((r) => r.userId === 'walk-in' && r.status === 'arrived').length
  const nowMins        = now.getHours() * 60 + now.getMinutes()
  const occupancyPct   = tables.length > 0 ? Math.round((occupiedTables / tables.length) * 100) : 0
  const capacityPct    = tables.length > 0 ? Math.round((totalGuests / (tables.length * 4)) * 100) : 0

  const upcoming = activeRes
    .filter((r) => r.status !== 'arrived')
    .filter((r) => {
      const [h, m] = r.timeSlot.split(':').map(Number)
      return h * 60 + m >= nowMins
    })
    .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot))
    .slice(0, 3)

  async function bulkConfirm() {
    setConfirming(true)
    await Promise.all(pendingRes.map((r) => updateReservationStatus(r.id, 'confirmed')))
    setConfirming(false)
  }

  return (
    <div className="p-6 space-y-5">
      {/* Topbar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-medium text-ink text-lg">{formatDate(new Date())}</h2>
          <p className="text-xs font-sans text-ink/60 mt-0.5">Shift malam · 17:00 – 23:00 WIB</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-forest animate-pulse" />
            <span className="text-xs font-sans text-ink/60">Live</span>
          </div>
          <button
            onClick={() => setShowWalkIn(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-[9999px] bg-ink text-cream text-sm font-sans font-medium hover:bg-gold-dark transition-colors"
          >
            <Users size={14} />
            Tamu Langsung
            {walkInCount > 0 && (
              <span className="ml-0.5 bg-gold text-ink text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {walkInCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Reservasi Hari Ini"
          value={activeRes.length}
          subtitle={pendingRes.length > 0 ? `${pendingRes.length} menunggu konfirmasi` : 'semua terkonfirmasi'}
          delta={activeRes.length > 0 ? 1 : undefined}
        />
        <StatCard
          label="Total Tamu"
          value={totalGuests}
          subtitle={`${capacityPct}% kapasitas`}
        />
        <StatCard
          label="Meja Terpakai"
          value={`${occupiedTables}/${tables.length}`}
          subtitle={`${tables.filter((t) => t.status === 'available').length} meja kosong`}
        />
        <StatCard
          label="Waitlist"
          value={waitingCount}
          subtitle="menunggu meja"
          delta={waitingCount > 3 ? -1 : undefined}
        />
      </div>

      {/* Segera Datang + Occupancy */}
      <div className="grid grid-cols-[1fr_280px] gap-4">
        {/* Segera Datang */}
        <div className="bg-white rounded-xl border border-meja-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-medium text-ink text-sm flex items-center gap-2">
              <Clock size={14} className="text-gold" />
              Segera Datang
            </h3>
            {pendingRes.length > 0 && (
              <button
                onClick={bulkConfirm}
                disabled={confirming}
                className="flex items-center gap-1.5 text-xs font-sans px-3 py-1.5 rounded-full bg-forest text-cream hover:bg-forest/90 disabled:opacity-60 transition-colors"
              >
                <CheckCheck size={12} />
                {confirming ? 'Mengkonfirmasi…' : `Konfirmasi ${pendingRes.length} reservasi`}
              </button>
            )}
          </div>

          {upcoming.length === 0 ? (
            <p className="text-xs font-sans text-ink/60 py-2">
              Tidak ada tamu yang akan datang dalam waktu dekat.
            </p>
          ) : (
            <div className="flex gap-3">
              {upcoming.map((r) => {
                const mins = minsUntil(r.timeSlot, now)
                return (
                  <div
                    key={r.id}
                    className={`flex-1 rounded-lg border px-3 py-2.5 ${
                      r.status === 'pending'
                        ? 'bg-gold-light border-gold/20'
                        : 'bg-cream border-meja-border'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-sans font-bold text-ink">{r.guestName}</p>
                        <p className="text-[10px] font-sans text-ink/60 mt-0.5">
                          {r.guestCount} tamu · {r.timeSlot}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold shrink-0 ${
                          mins <= 15 ? 'text-terra' : 'text-forest'
                        }`}
                      >
                        {countdownLabel(mins)}
                      </span>
                    </div>
                    {r.status === 'pending' && (
                      <span className="mt-1.5 inline-block text-[10px] font-sans px-2 py-0.5 rounded-full bg-gold-light text-[#5C3E10] border border-gold/20">
                        Perlu konfirmasi
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Occupancy bar */}
        <div className="bg-white rounded-xl border border-meja-border p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display font-medium text-ink text-sm">Okupansi Meja</h3>
            <span className="text-xs font-mono font-bold text-ink">{occupancyPct}%</span>
          </div>
          <div>
            <div className="h-2.5 w-full rounded-full bg-sand overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  occupancyPct >= 90 ? 'bg-terra' : occupancyPct >= 70 ? 'bg-gold' : 'bg-forest'
                }`}
                style={{ width: `${occupancyPct}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[10px] font-sans text-ink/60">{occupiedTables} terpakai</span>
              <span className="text-[10px] font-sans text-ink/60">{tables.length} total</span>
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            {(['available', 'reserved', 'occupied'] as const).map((s) => {
              const count = tables.filter((t) => t.status === s).length
              const labels: Record<string, string> = { available: 'Kosong', reserved: 'Dipesan', occupied: 'Terisi' }
              const colors: Record<string, string> = { available: 'bg-forest', reserved: 'bg-gold', occupied: 'bg-terra' }
              return (
                <div key={s} className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${colors[s]}`} />
                  <span className="text-[10px] font-sans text-ink/60 flex-1">{labels[s]}</span>
                  <span className="text-[10px] font-mono font-bold text-ink">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-[1fr_340px] gap-5">
        <BookingTimeline reservations={reservations} restaurantName="Nusa Gastronomy" />
        <div className="space-y-4">
          <TableMap tables={tables} />
          <WaitlistPanel waitlist={waitlist} />
        </div>
      </div>

      {showWalkIn && (
        <WalkInModal
          restaurantId={RESTAURANT_ID}
          tables={tables}
          onClose={() => setShowWalkIn(false)}
        />
      )}
    </div>
  )
}
