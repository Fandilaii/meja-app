'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, Users, Loader2, User, Phone } from 'lucide-react'
import GuestPicker from './GuestPicker'
import TimeSlotPicker from './TimeSlotPicker'
import type { Restaurant, Reservation } from '@/types'
import { generateTimeSlots, isSlotAvailable, createReservation } from '@/lib/firestore'
import { addReservationId, saveGuestProfile, getGuestProfile } from '@/lib/localStorage'

interface Props {
  restaurant: Restaurant
  reservations: Reservation[]
}

function todayString(): string {
  return new Date().toISOString().split('T')[0]
}

export default function BookingCard({ restaurant, reservations }: Props) {
  const router = useRouter()
  const [date, setDate]         = useState(todayString())
  const [guestCount, setGuest]  = useState(2)
  const [selectedSlot, setSlot] = useState<string | null>(null)
  const [guestName, setName]    = useState(() => getGuestProfile()?.name  ?? '')
  const [guestPhone, setPhone]  = useState(() => getGuestProfile()?.phone ?? '')
  const [loading, setLoading]   = useState(false)
  const [errors, setErrors]     = useState<{ name?: string; phone?: string }>({})

  const slots = generateTimeSlots(restaurant.openTime, restaurant.closeTime)
  const disabledSlots = slots.filter(
    (slot) => !isSlotAvailable(slot, reservations, restaurant.totalTables)
  )

  function validate(): boolean {
    const e: { name?: string; phone?: string } = {}
    if (!guestName.trim())          e.name  = 'Nama wajib diisi'
    if (!guestPhone.trim())         e.phone = 'Nomor WhatsApp wajib diisi'
    else if (!/^08|^62/.test(guestPhone.trim()))
                                    e.phone = 'Gunakan format 08xx atau 62xx'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // Normalize phone: 08xx → 628xx
  function normalizePhone(p: string): string {
    const digits = p.replace(/\D/g, '')
    if (digits.startsWith('0')) return '62' + digits.slice(1)
    return digits
  }

  async function handleBook() {
    if (!selectedSlot || !validate()) return
    setLoading(true)
    try {
      const reservation = await createReservation({
        restaurantId: restaurant.id,
        tableId:      'auto',
        userId:       'guest',
        guestName:    guestName.trim(),
        guestPhone:   normalizePhone(guestPhone.trim()),
        date,
        timeSlot:     selectedSlot,
        guestCount,
        status:       'confirmed',
      })
      addReservationId(reservation.id)
      saveGuestProfile({ name: guestName.trim(), phone: normalizePhone(guestPhone.trim()) })
      router.push(`/confirmation/${reservation.id}`)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const canBook = selectedSlot && guestName.trim() && guestPhone.trim()

  return (
    <div className="bg-sand rounded-2xl p-5 space-y-5">
      <p className="text-[11px] font-sans font-medium text-ink/60 uppercase tracking-wider">
        Buat Reservasi
      </p>

      {/* Name + Phone */}
      <div className="space-y-3">
        <div>
          <label className="block text-[11px] font-sans text-ink/60 mb-1.5">Nama Lengkap</label>
          <div className="relative">
            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/60 pointer-events-none" />
            <input
              type="text"
              value={guestName}
              onChange={(e) => { setName(e.target.value); setErrors((er) => ({ ...er, name: undefined })) }}
              placeholder="Contoh: Budi Santoso"
              className={`w-full pl-8 pr-3 py-2.5 rounded-lg border bg-white text-sm font-sans text-ink
                focus:outline-none focus:ring-2 focus:ring-gold/40
                ${errors.name ? 'border-terra' : 'border-meja-border'}`}
            />
          </div>
          {errors.name && <p className="text-[11px] text-terra font-sans mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-[11px] font-sans text-ink/60 mb-1.5">Nomor WhatsApp</label>
          <div className="relative">
            <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/60 pointer-events-none" />
            <input
              type="tel"
              value={guestPhone}
              onChange={(e) => { setPhone(e.target.value); setErrors((er) => ({ ...er, phone: undefined })) }}
              placeholder="08123456789"
              className={`w-full pl-8 pr-3 py-2.5 rounded-lg border bg-white text-sm font-sans text-ink
                focus:outline-none focus:ring-2 focus:ring-gold/40
                ${errors.phone ? 'border-terra' : 'border-meja-border'}`}
            />
          </div>
          {errors.phone
            ? <p className="text-[11px] text-terra font-sans mt-1">{errors.phone}</p>
            : <p className="text-[10px] text-ink/60 font-sans mt-1">Konfirmasi reservasi akan dikirim ke nomor ini</p>
          }
        </div>
      </div>

      {/* Date + Guest row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-sans text-ink/60 mb-1.5">Tanggal</label>
          <div className="relative">
            <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/60 pointer-events-none" />
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
          <label className="block text-[11px] font-sans text-ink/60 mb-1.5">Jumlah Tamu</label>
          <div className="relative">
            <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/60 pointer-events-none" />
            <div className="pl-8 pr-3 py-2.5 rounded-lg border border-meja-border bg-white text-sm font-sans text-ink">
              {guestCount} orang
            </div>
          </div>
        </div>
      </div>

      {/* Guest picker */}
      <div>
        <label className="block text-[11px] font-sans text-ink/60 mb-2">Pilih Jumlah Tamu</label>
        <GuestPicker value={guestCount} onChange={setGuest} />
      </div>

      {/* Time slots */}
      <div>
        <label className="block text-[11px] font-sans text-ink/60 mb-2">Pilih Waktu</label>
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
        disabled={!canBook || loading}
        className="w-full py-3.5 rounded-[9999px] bg-ink text-cream text-sm font-sans font-medium
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

      <p className="text-[10px] text-ink/60 font-sans text-center">
        Gratis · Tidak ada biaya reservasi
      </p>
    </div>
  )
}
