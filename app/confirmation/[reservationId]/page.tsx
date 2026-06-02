'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Check, Copy, CheckCheck } from 'lucide-react'
import { getReservation, getRestaurant } from '@/lib/firestore'
import type { Reservation, Restaurant } from '@/types'

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export default function ConfirmationPage() {
  const { reservationId } = useParams<{ reservationId: string }>()
  const router = useRouter()

  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [restaurant, setRestaurant]   = useState<Restaurant | null>(null)
  const [copied, setCopied]           = useState(false)
  const [waSent, setWaSent]           = useState(false)
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    async function load() {
      const res = await getReservation(reservationId)
      if (!res) { router.push('/'); return }
      setReservation(res)

      const rest = await getRestaurant(res.restaurantId)
      setRestaurant(rest)
      setLoading(false)

      // Auto-send WhatsApp confirmation if guest has a phone number
      if (res.guestPhone) {
        try {
          await fetch('/api/whatsapp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone:          res.guestPhone,
              name:           res.guestName,
              restaurantName: rest?.name ?? '',
              date:           formatDate(res.date),
              time:           res.timeSlot,
              guestCount:     res.guestCount,
              referenceCode:  res.referenceCode,
            }),
          })
          setWaSent(true)
        } catch (e) {
          console.error('WhatsApp auto-send failed:', e)
        }
      }
    }
    load()
  }, [reservationId, router])

  async function handleSendWhatsApp() {
    if (!reservation || !restaurant) return
    setWaSent(true)
    try {
      await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone:          reservation.guestPhone || '62800000000',
          name:           reservation.guestName,
          restaurantName: restaurant.name,
          date:           formatDate(reservation.date),
          time:           reservation.timeSlot,
          guestCount:     reservation.guestCount,
          referenceCode:  reservation.referenceCode,
        }),
      })
    } catch (e) {
      console.error(e)
    }
  }

  function handleCopy() {
    if (!reservation) return
    navigator.clipboard.writeText(reservation.referenceCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading || !reservation || !restaurant) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Top section */}
      <div className="bg-ink px-4 pt-14 pb-8 text-center">
        <div className="w-14 h-14 rounded-full bg-gold flex items-center justify-center mx-auto mb-4">
          <Check size={28} className="text-white" strokeWidth={3} />
        </div>
        <h1 className="font-display font-bold text-cream text-2xl mb-1">Reservasi Berhasil!</h1>
        <p className="text-sm font-sans text-white/50">Mejamu sudah menunggu.</p>
      </div>

      <div className="px-4 py-5 space-y-4">
        {/* Confirmation card */}
        <div className="bg-white rounded-2xl border border-meja-border overflow-hidden">
          {/* Restaurant header */}
          <div className="p-4 flex items-center gap-3 border-b border-meja-border">
            <div className="w-12 h-12 rounded-xl bg-sand flex items-center justify-center font-display font-bold text-gold text-lg">
              {restaurant.name[0]}
            </div>
            <div>
              <p className="font-display font-medium text-ink text-base">{restaurant.name}</p>
              <p className="text-xs font-sans text-muted">{restaurant.area}</p>
            </div>
          </div>

          {/* Dashed divider */}
          <div className="mx-4 my-1 border-t border-dashed border-meja-border" />

          {/* Details */}
          <div className="p-4 space-y-3">
            {[
              { label: 'Tanggal',   value: formatDate(reservation.date)    },
              { label: 'Waktu',     value: `${reservation.timeSlot} WIB`   },
              { label: 'Tamu',      value: `${reservation.guestCount} orang` },
              { label: 'Status',    value: reservation.status === 'confirmed' ? 'Dikonfirmasi' : reservation.status },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm font-sans text-muted">{label}</span>
                <span className="text-sm font-sans font-medium text-ink">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reference code */}
        <div className="bg-sand rounded-2xl p-4">
          <p className="text-[11px] font-sans text-muted uppercase tracking-wider mb-2">Kode Reservasi</p>
          <div className="flex items-center justify-between">
            <code className="font-mono font-bold text-xl text-ink tracking-widest">
              {reservation.referenceCode}
            </code>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-meja-border bg-white text-xs font-sans text-ink hover:bg-sand transition-colors"
            >
              {copied ? <CheckCheck size={13} className="text-forest" /> : <Copy size={13} />}
              {copied ? 'Tersalin' : 'Salin'}
            </button>
          </div>
        </div>

        {/* WhatsApp CTA */}
        <button
          onClick={handleSendWhatsApp}
          disabled={waSent}
          className="w-full py-3.5 rounded-[9999px] text-sm font-sans font-medium flex items-center justify-center gap-2 transition-colors
            disabled:opacity-60
            bg-[#25D366] text-white hover:bg-[#1ebe5d]"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
          {waSent ? 'Terkirim ke WhatsApp ✓' : 'Kirim ke WhatsApp'}
        </button>

        {/* Back home */}
        <button
          onClick={() => router.push('/')}
          className="w-full py-3 rounded-[9999px] text-sm font-sans font-medium text-muted border border-meja-border hover:bg-sand transition-colors"
        >
          Kembali ke Beranda
        </button>

        <p className="text-[10px] text-muted font-sans text-center">
          Konfirmasi juga dikirim ke WhatsApp dan emailmu.
        </p>
      </div>
    </div>
  )
}
