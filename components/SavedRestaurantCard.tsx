'use client'

import Link from 'next/link'
import { Star, Heart } from 'lucide-react'
import type { Restaurant } from '@/types'

interface Props {
  restaurant: Restaurant
  onRemove:   (id: string) => void
}

const GRADIENTS = [
  'from-[#2A1F1A] to-[#5C3D2E]',
  'from-[#0D2416] to-[#1A4A2E]',
  'from-[#1A1A2E] to-[#16213E]',
  'from-[#2E1A00] to-[#5C3D00]',
  'from-[#1A0D2E] to-[#3D1A5C]',
]

export default function SavedRestaurantCard({ restaurant, onRemove }: Props) {
  const gradient = GRADIENTS[restaurant.name.charCodeAt(0) % GRADIENTS.length]

  return (
    <div className="bg-white rounded-xl border border-meja-border flex items-center gap-3 p-3 hover:shadow-sm transition-shadow">
      {/* Thumbnail */}
      <Link href={`/restaurant/${restaurant.id}`} className="flex-shrink-0">
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          <span className="font-display font-bold text-cream text-lg">
            {restaurant.name[0]}
          </span>
        </div>
      </Link>

      {/* Info */}
      <Link href={`/restaurant/${restaurant.id}`} className="flex-1 min-w-0">
        <p className="font-display font-medium text-ink text-sm truncate">{restaurant.name}</p>
        <p className="text-[11px] font-sans text-ink/60 truncate">{restaurant.cuisine} · {restaurant.area}</p>
        <div className="flex items-center gap-1 mt-1">
          <Star size={10} className="fill-gold text-gold" />
          <span className="text-[11px] font-sans text-ink">{restaurant.rating}</span>
        </div>
      </Link>

      {/* Remove */}
      <button
        onClick={() => onRemove(restaurant.id)}
        className="p-1.5 text-terra hover:bg-terra-light rounded-lg transition-colors flex-shrink-0"
      >
        <Heart size={16} className="fill-terra" />
      </button>
    </div>
  )
}
