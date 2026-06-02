'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Star, MapPin } from 'lucide-react'
import AvailabilityBadge from './AvailabilityBadge'
import type { Restaurant, AvailabilityStatus } from '@/types'

interface Props {
  restaurant: Restaurant
  availability: AvailabilityStatus
}

function formatPrice(min: number, max: number): string {
  const fmt = (n: number) =>
    n >= 1_000_000
      ? `Rp ${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}jt`
      : `Rp ${(n / 1_000).toFixed(0)}k`
  return `${fmt(min)} – ${fmt(max)}`
}

// Gradient placeholders indexed by restaurant name char code
const GRADIENTS = [
  'from-[#2A1F1A] to-[#5C3D2E]',
  'from-[#0D2416] to-[#1A4A2E]',
  'from-[#1A1A2E] to-[#16213E]',
  'from-[#2E1A00] to-[#5C3D00]',
  'from-[#1A0D2E] to-[#3D1A5C]',
]

export default function RestaurantCard({ restaurant, availability }: Props) {
  const gradientIndex = restaurant.name.charCodeAt(0) % GRADIENTS.length
  const gradient = GRADIENTS[gradientIndex]

  return (
    <Link href={`/restaurant/${restaurant.id}`} className="block group">
      <div className="rounded-xl overflow-hidden border border-meja-border bg-white hover:shadow-lg transition-shadow duration-200">
        {/* Cover Image */}
        <div className={`relative h-44 bg-gradient-to-br ${gradient}`}>
          {restaurant.imageUrl ? (
            <Image
              src={restaurant.imageUrl}
              alt={restaurant.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-end p-3">
              <AvailabilityBadge status={availability} />
            </div>
          )}
          {restaurant.imageUrl && (
            <div className="absolute bottom-3 left-3">
              <AvailabilityBadge status={availability} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="font-display font-medium text-base text-ink leading-tight group-hover:text-gold-dark transition-colors">
            {restaurant.name}
          </h3>

          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[11px] text-muted font-sans">{restaurant.cuisine}</span>
            <span className="text-[11px] text-meja-border">·</span>
            <MapPin size={10} className="text-muted" />
            <span className="text-[11px] text-muted font-sans">{restaurant.area}</span>
          </div>

          <div className="flex items-center justify-between mt-2.5">
            <div className="flex items-center gap-1">
              <Star size={12} className="fill-gold text-gold" />
              <span className="text-xs font-medium text-ink font-sans">{restaurant.rating}</span>
            </div>
            <span className="text-[11px] text-muted font-sans">{formatPrice(restaurant.priceMin, restaurant.priceMax)}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
