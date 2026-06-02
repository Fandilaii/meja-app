'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, Users, Loader2 } from 'lucide-react'
import GuestPicker from './GuestPicker'
import TimeSlotPicker from './TimeSlotPicker'
import type { Restaurant, Reservation } from '@/types'
import { generateTimeSlots, isSlotAvailable } from '@/lib/firestore'
import { createReservation } from '@/lib/firestore'

interface Props {
  restaurant: Restaurant
  reservations: Reservation[]
}

function todayString(): string {
  const d = new Date()
  return d.toISOString().split('T')[0]
}

export default function BookingCard({ restaurant, reservations }: Props) {
  const router = useRouter()
  const [date, setDate]           = useState(todayString())
  const [guestCount, setGuest]    = useState(2)
  const [selectedSlot, setSlot]   = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)

  const slots = generateTimeSlots(restaurant.openTime, restaurant.closeTime)
  const disabledSlots = slots.filter(
    (slot) => !isSlotAvailable(slot, reservations, restaurant.totalTables)
  )

  async function handleBook() {
    if (!selectedSlot) return
    setLoading(true)
    try {
      const reservation = await createReservation({
        restaurantId: restaurant.id,
        tableId:      'auto',
        userId:       'guest',
        guestName:    'Tamu',
        guestPhone:   '',
        date,
        timeSlot:     selectedSlot,
        guestCount,
        status:       'confirmed',
      })
      router.push(`/confirmation/${reservation.id}`)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-sand rounded-2xl p-5 space-y-5">
      <p className="text-[11px] font-sans font-medium text-muted uppercase tracking-wider">
        Buat Reservasi
      </p>

      {/* Date + Guest row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-sans text-muted mb-1.5">Tanggal</label>
          <div className="relative">
            <CalendarDays
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
            <input
              type="date"
              value={date}
              min={todayString()}
              onChange={(e) => { setDate(e.target.value); setSlot(null) }}
              className="w-full pl-8 pr-3 py-2.5 rounded-lg border border-meja-border bg-white text-sm font-sans text-ink focus:outline-none focus:ring-2 focus:ring-gold/40"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-sans text-muted mb-1.5">Tamu</label>
          <div className="relative">
            <Users
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
            <div className="pl-8 pr-3 py-2.5 rounded-lg border border-meja-border bg-white text-sm font-sans text-ink">
              {guestCount} orang
            </div>
          </div>
        </div>
      </div>

      {/* Guest picker */}
      <div>
        <label className="block text-[11px] font-sans text-muted mb-2">Jumlah Tamu</label>
        <GuestPicker value={guestCount} onChange={setGuest} />
      </div>

      {/* Time slots */}
      <div>
        <label className="block text-[11px] font-sans text-muted mb-2">Pilih Waktu</label>
        <TimeSlotPicker
          slots={slots}
          disabledSlots={disabledSlots}
          selected={selectedSlot}
          onChange={setSlot}
        />
      </div>

      {/* CTA */}
      <button
        onClick={handleBook}
        disabled={!selectedSlot || loading}
        className="w-full py-3.5 rounded-pill bg-ink text-cream text-sm font-sans font-medium
          disabled:opacity-40 disabled:cursor-not-allowed
          hover:bg-gold-dark transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <><Loader2 size={16} className="animate-spin" /> Memproses...</>
        ) : selectedSlot ? (
          `Pesan Meja — ${selectedSlot}`
        ) : (
          'Pilih Waktu Dulu'
        )}
      </button>

      <p className="text-[10px] text-muted font-sans text-center">
        Gratis · Tidak ada biaya reservasi
      </p>
    </div>
  )
}
