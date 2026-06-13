'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Heart, Star, Clock, MapPin, MessageSquare } from 'lucide-react'
import BookingCard from '@/components/BookingCard'
import AvailabilityBadge from '@/components/AvailabilityBadge'
import RestaurantCard from '@/components/RestaurantCard'
import { getRestaurant, getRestaurants, getReservationsForDate, getAvailabilityStatus, getRestaurantReviews } from '@/lib/firestore'
import { isSavedRestaurant, toggleSavedRestaurant } from '@/lib/localStorage'
import type { Restaurant, AvailabilityStatus, Reservation } from '@/types'

function todayString(): string {
  return new Date().toISOString().split('T')[0]
}

const GRADIENTS = [
  'from-[#2A1F1A] via-[#4A2E22] to-[#2A1F1A]',
  'from-[#0D2416] via-[#1A4A2E] to-[#0D2416]',
  'from-[#1A1A2E] via-[#16213E] to-[#1A1A2E]',
  'from-[#2E1A00] via-[#5C3D00] to-[#2E1A00]',
  'from-[#1A0D2E] via-[#3D1A5C] to-[#1A0D2E]',
]

interface Props {
  id: string
  initialRestaurant?: Restaurant | null
}

export default function RestaurantDetailClient({ id, initialRestaurant }: Props) {
  const router = useRouter()

  const [restaurant,   setRestaurant]   = useState<Restaurant | null>(initialRestaurant ?? null)
  const [availability, setAvailability] = useState<AvailabilityStatus>('Tersedia')
  const [similar,      setSimilar]      = useState<Restaurant[]>([])
  const [reviews,      setReviews]      = useState<Reservation[]>([])
  const [saved,        setSaved]        = useState(() => isSavedRestaurant(id))
  const [loading,      setLoading]      = useState(!initialRestaurant)

  useEffect(() => {
    async function load() {
      const r = initialRestaurant ?? await getRestaurant(id)
      if (!r) { router.push('/'); return }
      if (!initialRestaurant) setRestaurant(r)

      const [res, areaRestaurants, reviewList] = await Promise.all([
        getReservationsForDate(r.id, todayString()),
        getRestaurants(r.area),
        getRestaurantReviews(r.id),
      ])
      setAvailability(getAvailabilityStatus(res.length, r.totalTables))
      setSimilar(
        areaRestaurants
          .filter((s) => s.id !== id)
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 3)
      )
      setReviews(reviewList)
      setLoading(false)
    }
    load()
  }, [id, router, initialRestaurant])

  if (loading || !restaurant) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
      </div>
    )
  }

  const gradient = GRADIENTS[restaurant.name.charCodeAt(0) % GRADIENTS.length]

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero */}
      <div className={`relative h-72 bg-gradient-to-br ${gradient}`}>
        {restaurant.imageUrl && (
          <Image src={restaurant.imageUrl} alt={restaurant.name} fill className="object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Top buttons */}
        <div className="absolute top-12 left-4 right-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 flex items-center justify-center text-cream hover:bg-black/50 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            onClick={() => setSaved(toggleSavedRestaurant(id))}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 flex items-center justify-center text-cream hover:bg-black/50 transition-colors"
          >
            <Heart size={18} className={saved ? 'fill-terra text-terra' : ''} />
          </button>
        </div>

        {/* Bottom text */}
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-[10px] font-sans uppercase tracking-widest text-cream/75 mb-1">
            {restaurant.cuisine} · {restaurant.area}
          </p>
          <h1 className="font-display font-bold text-cream text-2xl leading-tight">
            {restaurant.name}
          </h1>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-4 px-4 py-4 border-b border-meja-border bg-white">
        <div className="flex items-center gap-1.5">
          <Star size={14} className="fill-gold text-gold" />
          <span className="text-sm font-sans font-medium text-ink">{restaurant.rating}</span>
        </div>
        <div className="w-px h-4 bg-meja-border" />
        <div className="flex items-center gap-1.5">
          <Clock size={14} className="text-ink/60" />
          <span className="text-sm font-sans text-ink/60">{restaurant.openTime} – {restaurant.closeTime}</span>
        </div>
        <div className="w-px h-4 bg-meja-border" />
        <div className="flex items-center gap-1.5">
          <MapPin size={14} className="text-ink/60" />
          <span className="text-sm font-sans text-ink/60">{restaurant.area}</span>
        </div>
        <div className="ml-auto">
          <AvailabilityBadge status={availability} />
        </div>
      </div>

      {/* Booking card */}
      <div className="px-4 py-5">
        <BookingCard restaurant={restaurant} />
      </div>

      {/* Reviews section */}
      {reviews.length > 0 && (
        <div className="px-4 pb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-ink text-base">
              Ulasan Tamu
            </h2>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => {
                  const avg = reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length
                  return (
                    <Star
                      key={n}
                      size={11}
                      className={n <= Math.round(avg) ? 'fill-gold text-gold' : 'text-ink/20'}
                    />
                  )
                })}
              </div>
              <span className="text-xs font-sans font-medium text-ink">
                {(reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length).toFixed(1)}
              </span>
              <span className="text-xs font-sans text-ink/50">({reviews.length})</span>
            </div>
          </div>

          {/* Rating breakdown */}
          <div className="bg-white rounded-2xl border border-meja-border p-4 mb-3">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviews.filter((r) => r.rating === star).length
              const pct   = reviews.length > 0 ? (count / reviews.length) * 100 : 0
              return (
                <div key={star} className="flex items-center gap-2 mb-1.5 last:mb-0">
                  <span className="text-[11px] font-sans text-ink/60 w-3 text-right">{star}</span>
                  <Star size={9} className="fill-gold text-gold flex-shrink-0" />
                  <div className="flex-1 h-1.5 rounded-full bg-sand overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gold transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-sans text-ink/40 w-4 text-right">{count}</span>
                </div>
              )
            })}
          </div>

          {/* Individual reviews */}
          <div className="space-y-2">
            {reviews.slice(0, 5).map((r) => (
              <div key={r.id} className="bg-white rounded-xl border border-meja-border p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-full bg-sand flex items-center justify-center font-display font-bold text-ink/60 text-xs flex-shrink-0">
                    {r.guestName?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-sans font-medium text-ink truncate">{r.guestName}</p>
                    <p className="text-[10px] font-sans text-ink/40">{r.date}</p>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} size={10} className={n <= (r.rating ?? 0) ? 'fill-gold text-gold' : 'text-ink/20'} />
                    ))}
                  </div>
                </div>
                {r.reviewText && (
                  <div className="flex items-start gap-1.5">
                    <MessageSquare size={10} className="text-ink/30 mt-0.5 flex-shrink-0" />
                    <p className="text-[12px] font-sans text-ink/70 leading-relaxed italic">
                      "{r.reviewText}"
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Similar restaurants */}
      {similar.length > 0 && (
        <div className="px-4 pb-8">
          <h2 className="font-display font-semibold text-ink text-base mb-3">
            Kamu juga mungkin suka
          </h2>
          <div className="space-y-3">
            {similar.map((s) => (
              <RestaurantCard
                key={s.id}
                restaurant={s}
                availability="Tersedia"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
