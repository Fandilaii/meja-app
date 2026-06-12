'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useParams }           from 'next/navigation'
import { Star, Loader2 }       from 'lucide-react'
import { getReservation, getRestaurant, saveReservationReview } from '@/lib/firestore'
import type { Reservation, Restaurant } from '@/types'

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function ReviewPage() {
  const { reservationId } = useParams<{ reservationId: string }>()

  const [reservation,  setReservation]  = useState<Reservation | null>(null)
  const [restaurant,   setRestaurant]   = useState<Restaurant | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [hoverRating,  setHoverRating]  = useState(0)
  const [rating,       setRating]       = useState(0)
  const [reviewText,   setReviewText]   = useState('')
  const [submitting,   setSubmitting]   = useState(false)
  const [submitted,    setSubmitted]    = useState(false)
  const [alreadyRated, setAlreadyRated] = useState(false)

  useEffect(() => {
    async function load() {
      const res = await getReservation(reservationId)
      if (!res) { setLoading(false); return }
      setReservation(res)
      if (res.rating) setAlreadyRated(true)
      const rest = await getRestaurant(res.restaurantId)
      setRestaurant(rest)
      setLoading(false)
    }
    load()
  }, [reservationId])

  async function handleSubmit() {
    if (!rating || !reservation) return
    setSubmitting(true)
    try {
      await saveReservationReview(reservation.id, rating, reviewText)
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  const STAR_LABELS = ['', 'Kurang', 'Cukup', 'Baik', 'Sangat Baik', 'Luar Biasa!']

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-gold" />
      </div>
    )
  }

  if (!reservation) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="text-center">
          <p className="font-display text-xl text-ink">Reservasi tidak ditemukan</p>
          <p className="text-sm font-sans text-ink/60 mt-2">Link mungkin sudah tidak valid.</p>
        </div>
      </div>
    )
  }

  if (submitted || alreadyRated) {
    const displayRating = submitted ? rating : (reservation.rating ?? 0)
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🙏</div>
          <h1 className="font-display font-bold text-ink text-2xl mb-2">Terima kasih!</h1>
          <p className="text-sm font-sans text-ink/60 mb-5">
            Ulasanmu untuk <strong>{restaurant?.name}</strong> sudah kami terima.
          </p>
          <div className="flex justify-center gap-1 mb-6">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={28}
                className={s <= displayRating ? 'fill-gold text-gold' : 'text-ink/20'}
              />
            ))}
          </div>
          {alreadyRated && !submitted && (
            <p className="text-xs font-sans text-ink/40">Kamu sudah pernah memberikan ulasan ini.</p>
          )}
        </div>
      </div>
    )
  }

  const activeRating = hoverRating || rating

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Restaurant badge */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-ink flex items-center justify-center font-display font-bold text-gold text-2xl mx-auto mb-3">
            {restaurant?.name?.[0] ?? '?'}
          </div>
          <h1 className="font-display font-bold text-ink text-xl">{restaurant?.name}</h1>
          <p className="text-sm font-sans text-ink/50 mt-1">{formatDate(reservation.date)} · {reservation.timeSlot} WIB</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-meja-border p-6 shadow-sm">
          <p className="font-display font-semibold text-ink text-center text-base mb-1">
            Gimana pengalamanmu?
          </p>
          <p className="text-xs font-sans text-ink/50 text-center mb-6">
            Halo {reservation.guestName.split(' ')[0]}! Bintangmu membantu restoran berkembang.
          </p>

          {/* Star picker */}
          <div className="flex justify-center gap-2 mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onMouseEnter={() => setHoverRating(s)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(s)}
                className="transition-transform hover:scale-110 active:scale-95"
              >
                <Star
                  size={36}
                  className={`transition-colors ${
                    s <= activeRating ? 'fill-gold text-gold' : 'text-ink/20 hover:text-gold/40'
                  }`}
                />
              </button>
            ))}
          </div>

          <p className="text-center text-xs font-sans font-medium text-gold h-4 mb-5">
            {activeRating > 0 ? STAR_LABELS[activeRating] : ''}
          </p>

          {/* Review text */}
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Ceritakan pengalamanmu... (opsional)"
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl border border-meja-border bg-sand/40 text-sm font-sans text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-gold/40 resize-none mb-5"
          />

          <button
            onClick={handleSubmit}
            disabled={!rating || submitting}
            className="w-full py-3 rounded-[9999px] bg-ink text-cream text-sm font-sans font-medium
              disabled:opacity-40 disabled:cursor-not-allowed
              hover:bg-gold-dark transition-colors flex items-center justify-center gap-2"
          >
            {submitting
              ? <><Loader2 size={15} className="animate-spin" /> Mengirim...</>
              : 'Kirim Ulasan'
            }
          </button>
        </div>

        <p className="text-center text-[10px] font-sans text-ink/30 mt-5">
          Powered by Meja 🪑
        </p>
      </div>
    </div>
  )
}
