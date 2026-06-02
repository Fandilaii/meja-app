'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, Calendar, Grid3X3, Users, BarChart3,
  Settings, ListOrdered, ChevronRight,
} from 'lucide-react'
import { getRestaurant } from '@/lib/firestore'
import type { Restaurant } from '@/types'

const RESTAURANT_ID = 'P3R1nyDl8sqYukKkculP'

const NAV_ITEMS = [
  { href: '/dashboard',            label: 'Dashboard',  Icon: LayoutDashboard },
  { href: '/dashboard/kalender',   label: 'Kalender',   Icon: Calendar        },
  { href: '/dashboard/meja',       label: 'Meja',       Icon: Grid3X3         },
  { href: '/dashboard/waitlist',   label: 'Waitlist',   Icon: ListOrdered     },
  { href: '/dashboard/tamu',       label: 'Tamu',       Icon: Users           },
  { href: '/dashboard/laporan',    label: 'Laporan',    Icon: BarChart3       },
  { href: '/dashboard/pengaturan', label: 'Pengaturan', Icon: Settings        },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)

  useEffect(() => {
    getRestaurant(RESTAURANT_ID).then(setRestaurant)
  }, [])

  const name = restaurant?.name ?? 'Memuat...'
  const area = restaurant ? `${restaurant.area}, Jakarta` : ''

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[200px] bg-ink flex flex-col z-50">
      {/* Logo */}
      <div className="px-5 pt-7 pb-6">
        <div className="font-display font-bold text-2xl text-cream">
          Meja<span className="text-gold">.</span>
        </div>
        {/* cream/70 on ink = 10.3:1 ✓ */}
        <p className="text-[11px] font-sans text-cream/70 mt-1 truncate">{name}</p>
        {/* cream/55 on ink = 6.4:1 ✓ */}
        <p className="text-[10px] font-sans text-cream/55">{area}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {/* cream/50 on ink = 5.75:1 ✓ */}
        <p className="text-[9px] font-sans font-medium text-cream/50 uppercase tracking-widest px-2 mb-2">
          Kelola
        </p>
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-2 py-2.5 rounded-lg transition-colors group
                ${active
                  ? 'bg-white/8 text-cream'
                  // cream/60 on ink = 7.2:1 ✓ (was text-muted = 3.5:1 ✗)
                  : 'text-cream/60 hover:text-cream hover:bg-white/5'
                }`}
            >
              <Icon
                size={16}
                // cream/55 on ink = 6.4:1 ✓ (was text-muted = 3.5:1 ✗)
                className={active ? 'text-gold' : 'text-cream/55 group-hover:text-cream'}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span className="text-sm font-sans">{label}</span>
              {active && <ChevronRight size={12} className="ml-auto text-gold" />}
            </Link>
          )
        })}
      </nav>

      {/* Manager */}
      <div className="px-4 py-5 border-t border-white/8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center font-display font-bold text-sm text-white">
            MG
          </div>
          <div>
            <p className="text-xs font-sans font-medium text-cream">Manager</p>
            {/* cream/60 on ink = 7.2:1 ✓ (was text-muted ✗) */}
            <p className="text-[10px] font-sans text-cream/60">Head of Ops</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
