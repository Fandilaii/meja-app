'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Star, MapPin, Heart } from 'lucide-react'
import AvailabilityBadge from './AvailabilityBadge'
import type { Restaurant, AvailabilityStatus } from '@/types'

interface Props {
  restaurant:    Restaurant
  availability:  AvailabilityStatus
  saved?:        boolean
  onToggleSave?: (id: string) => void
}

function formatPrice(min: number, max: number): string {
  const fmt = (n: number) =>
    n >= 1_000_000
      ? `Rp ${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}jt`
      : `Rp ${(n / 1_000).toFixed(0)}k`
  return `${fmt(min)} – ${fmt(max)}`
}

// Warmer, lighter gradients — distinct per restaurant, intentional not broken
const PLACEHOLDER_THEMES = [
  {
    gradient: 'from-[#3D1F0A] via-[#6B3A1A] to-[#2A1206]',
    accent:   'bg-[#C8923A]/20',
    emoji:    '🍜',
  },
  {
    gradient: 'from-[#0A2E1A] via-[#1A5C36] to-[#051A0E]',
    accent:   'bg-[#2A6B44]/20',
    emoji:    '🌿',
  },
  {
    gradient: 'from-[#1A0A2E] via-[#3D1A6B] to-[#0E0518]',
    accent:   'bg-[#6B44A8]/20',
    emoji:    '🏮',
  },
  {
    gradient: 'from-[#2E1A0A] via-[#5C3A1A] to-[#1A0E05]',
    accent:   'bg-[#C8923A]/20',
    emoji:    '🥢',
  },
  {
    gradient: 'from-[#0A1A2E] via-[#1A3A5C] to-[#050E1A]',
    accent:   'bg-[#2A6B8C]/20',
    emoji:    '🍱',
  },
]

export default function RestaurantCard({ restaurant, availability, saved = false, onToggleSave }: Props) {
  const theme = PLACEHOLDER_THEMES[restaurant.name.charCodeAt(0) % PLACEHOLDER_THEMES.length]
  const hasPhoto = Boolean(restaurant.imageUrl)

  return (
    <Link href={`/restaurant/${restaurant.id}`} className="block group">
      <div className="rounded-xl overflow-hidden border border-meja-border bg-white hover:shadow-lg transition-shadow duration-200">

        {/* Cover */}
        <div className={`relative h-44 bg-gradient-to-br ${theme.gradient}`}>

          {hasPhoto ? (
            <Image src={restaurant.imageUrl} alt={restaurant.name} fill className="object-cover" />
          ) : (
            /* Placeholder: cuisine emoji + restaurant initial — makes each card distinct */
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <div className={`w-14 h-14 rounded-2xl ${theme.accent} backdrop-blur-sm flex items-center justify-center`}>
                <span className="text-3xl" role="img" aria-hidden="true">{theme.emoji}</span>
              </div>
              <span className="font-display font-bold text-white/20 text-6xl absolute bottom-0 right-4 leading-none select-none">
                {restaurant.name[0]}
              </span>
            </div>
          )}

          {/* Subtle bottom gradient for badge legibility */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />

          {/* Availability badge */}
          <div className="absolute bottom-3 left-3">
            <AvailabilityBadge status={availability} />
          </div>

          {/* Heart button */}
          {onToggleSave && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); onToggleSave(restaurant.id) }}
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors"
            >
              <Heart size={13} className={saved ? 'fill-terra text-terra' : 'text-white'} />
            </button>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="font-display font-medium text-base text-ink leading-tight group-hover:text-gold-dark transition-colors">
            {restaurant.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-xs text-muted font-sans">{restaurant.cuisine}</span>
            <span className="text-xs text-ink/30">·</span>
            <MapPin size={10} className="text-muted" />
            <span className="text-xs text-muted font-sans">{restaurant.area}</span>
          </div>
          <div className="flex items-center justify-between mt-2.5">
            <div className="flex items-center gap-1">
              <Star size={12} className="fill-gold text-gold" />
              <span className="text-xs font-medium text-ink font-sans">{restaurant.rating}</span>
            </div>
            <span className="text-xs font-medium text-muted font-sans">{formatPrice(restaurant.priceMin, restaurant.priceMax)}</span>
          </div>
        </div>

      </div>
    </Link>
  )
}
