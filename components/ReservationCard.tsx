'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Star } from 'lucide-react'
import type { Reservation, Restaurant } from '@/types'

interface Props {
  reservation: Reservation
  restaurant:  Restaurant | null
  tab:         'upcoming' | 'past' | 'cancelled'
  onCancel?:   (id: string) => Promise<void>
}

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  pending:   { bg: 'bg-gold-light',   text: 'text-[#5C3E10]', label: 'Menunggu'     }, // 7.4:1 ✓
  confirmed: { bg: 'bg-forest-light', text: 'text-forest',    label: 'Dikonfirmasi' }, // 5.1:1 ✓
  arrived:   { bg: 'bg-sand',         text: 'text-ink/60',    label: 'Selesai'      }, // 5.7:1 ✓ (was text-ink/60 1.4:1 ✗)
  cancelled: { bg: 'bg-terra-light',  text: 'text-[#7A2E12]', label: 'Dibatalkan'   }, // 6.9:1 ✓ (was text-terra 3.3:1 ✗)
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('id-ID', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function ReservationCard({ reservation, restaurant, tab, onCancel }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const badge = STATUS_BADGE[reservation.status] ?? STATUS_BADGE.pending

  async function handleCancel() {
    if (!onCancel) return
    setCancelling(true)
    await onCancel(reservation.id)
    setCancelling(false)
    setConfirming(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-meja-border overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center gap-3 border-b border-meja-border">
        <div className="w-10 h-10 rounded-xl bg-sand flex items-center justify-center font-display font-bold text-gold text-base flex-shrink-0">
          {restaurant?.name?.[0] ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-medium text-ink text-sm truncate">
            {restaurant?.name ?? 'Restoran'}
          </p>
          <p className="text-[11px] font-sans text-ink/60 truncate">
            {restaurant?.area} · {restaurant?.cuisine}
          </p>
        </div>
        <span className={`text-[10px] font-sans px-2.5 py-1 rounded-full flex-shrink-0 ${badge.bg} ${badge.text}`}>
          {badge.label}
        </span>
      </div>

      {/* Details */}
      <div className="px-4 py-3 grid grid-cols-2 gap-y-2.5">
        {[
          { label: 'Tanggal', value: formatDate(reservation.date)        },
          { label: 'Waktu',   value: `${reservation.timeSlot} WIB`       },
          { label: 'Tamu',    value: `${reservation.guestCount} orang`   },
          { label: 'Kode',    value: reservation.referenceCode, mono: true },
        ].map(({ label, value, mono }) => (
          <div key={label}>
            <p className="text-[10px] font-sans text-ink/60">{label}</p>
            <p className={`text-sm text-ink font-medium ${mono ? 'font-mono tracking-wider' : 'font-sans'}`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Rating (past reservations) */}
      {tab === 'past' && reservation.rating != null && (
        <div className="px-4 pb-3 flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                size={12}
                className={n <= reservation.rating! ? 'fill-gold text-gold' : 'text-ink/20'}
              />
            ))}
          </div>
          {reservation.reviewText && (
            <p className="text-[11px] font-sans text-ink/60 truncate ml-1">
              "{reservation.reviewText}"
            </p>
          )}
        </div>
      )}

      {/* Rate CTA for arrived reservations without a rating */}
      {tab === 'past' && reservation.status === 'arrived' && reservation.rating == null && (
        <div className="px-4 pb-3">
          <Link
            href={`/review/${reservation.id}`}
            className="inline-flex items-center gap-1.5 text-[11px] font-sans text-gold hover:underline"
          >
            <Star size={11} className="fill-gold text-gold" />
            Beri ulasan
          </Link>
        </div>
      )}

      {/* Actions */}
      {(tab === 'upcoming' || tab === 'past') && (
        <div className="px-4 pb-4 flex gap-2">
          <Link
            href={`/restaurant/${reservation.restaurantId}`}
            className="flex-1 py-2 rounded-[9999px] border border-meja-border text-center text-sm font-sans font-medium text-ink hover:bg-sand transition-colors"
          >
            Pesan Lagi
          </Link>

          {tab === 'upcoming' && onCancel && (
            confirming ? (
              <div className="flex-1 space-y-2">
                <p className="text-[11px] font-sans text-ink/70 leading-relaxed">
                  Batalkan reservasi di{' '}
                  <span className="font-semibold text-ink">{restaurant?.name ?? 'restoran ini'}</span>{' '}
                  pada <span className="font-semibold text-ink">{formatDate(reservation.date)}</span>{' '}
                  jam <span className="font-semibold text-ink">{reservation.timeSlot}</span>?
                </p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setConfirming(false)}
                    className="px-3 py-2 rounded-[9999px] border border-meja-border text-sm font-sans text-ink/60 hover:bg-sand transition-colors"
                  >
                    Tidak
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="px-3 py-2 rounded-[9999px] bg-terra text-white text-sm font-sans font-medium hover:bg-terra/90 transition-colors flex items-center gap-1.5 disabled:opacity-60"
                  >
                    {cancelling && <Loader2 size={13} className="animate-spin" />}
                    Ya, Batalkan
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                className="px-4 py-2 rounded-[9999px] border border-terra/40 text-sm font-sans font-medium text-terra hover:bg-terra-light transition-colors"
              >
                Batalkan
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}
