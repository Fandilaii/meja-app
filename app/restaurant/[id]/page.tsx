'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Heart, Star, Clock, MapPin } from 'lucide-react'
import BookingCard from '@/components/BookingCard'
import AvailabilityBadge from '@/components/AvailabilityBadge'
import { getRestaurant, getReservationsForDate, getAvailabilityStatus } from '@/lib/firestore'
import { isSavedRestaurant, toggleSavedRestaurant } from '@/lib/localStorage'
import type { Restaurant, Reservation, AvailabilityStatus } from '@/types'

function todayString(): string {
  return new Date().toISOString().split('T')[0]
}

export default function RestaurantDetailPage() {
  const { id }  = useParams<{ id: string }>()
  const router  = useRouter()

  const [restaurant, setRestaurant]     = useState<Restaurant | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [availability, setAvailability] = useState<AvailabilityStatus>('Tersedia')
  const [saved, setSaved]               = useState(() => isSavedRestaurant(id))
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    async function load() {
      const r = await getRestaurant(id)
      if (!r) { router.push('/'); return }
      setRestaurant(r)

      const res = await getReservationsForDate(r.id, todayString())
      setReservations(res)
      setAvailability(getAvailabilityStatus(res.length, r.totalTables))
      setLoading(false)
    }
    load()
  }, [id, router])

  if (loading || !restaurant) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
      </div>
    )
  }

  const GRADIENTS = [
    'from-[#2A1F1A] via-[#4A2E22] to-[#2A1F1A]',
    'from-[#0D2416] via-[#1A4A2E] to-[#0D2416]',
    'from-[#1A1A2E] via-[#16213E] to-[#1A1A2E]',
    'from-[#2E1A00] via-[#5C3D00] to-[#2E1A00]',
    'from-[#1A0D2E] via-[#3D1A5C] to-[#1A0D2E]',
  ]
  const gradient = GRADIENTS[restaurant.name.charCodeAt(0) % GRADIENTS.length]

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero */}
      <div className={`relative h-72 bg-gradient-to-br ${gradient}`}>
        {restaurant.imageUrl && (
          <Image src={restaurant.imageUrl} alt={restaurant.name} fill className="object-cover" />
        )}
        {/* Gradient overlay */}
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
          <p className="text-[10px] font-sans uppercase tracking-widest text-white/60 mb-1">
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
          <Clock size={14} className="text-muted" />
          <span className="text-sm font-sans text-muted">{restaurant.openTime} – {restaurant.closeTime}</span>
        </div>
        <div className="w-px h-4 bg-meja-border" />
        <div className="flex items-center gap-1.5">
          <MapPin size={14} className="text-muted" />
          <span className="text-sm font-sans text-muted">{restaurant.area}</span>
        </div>
        <div className="ml-auto">
          <AvailabilityBadge status={availability} />
        </div>
      </div>

      {/* Booking card */}
      <div className="px-4 py-5">
        <BookingCard restaurant={restaurant} reservations={reservations} />
      </div>
    </div>
  )
}
