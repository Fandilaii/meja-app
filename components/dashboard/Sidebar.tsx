'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, Calendar, Grid3X3, Users, BarChart3,
  Settings, ListOrdered, ChevronRight, LogOut, Map,
} from 'lucide-react'
import { getRestaurant } from '@/lib/firestore'
import { signOut, onAuthStateChange } from '@/lib/auth'
import type { Restaurant } from '@/types'
import type { User } from 'firebase/auth'

const RESTAURANT_ID = 'P3R1nyDl8sqYukKkculP'

const NAV_ITEMS = [
  { href: '/dashboard',            label: 'Dashboard',  Icon: LayoutDashboard },
  { href: '/dashboard/kalender',   label: 'Kalender',   Icon: Calendar        },
  { href: '/dashboard/floor',      label: 'Lantai',     Icon: Map             },
  { href: '/dashboard/meja',       label: 'Meja',       Icon: Grid3X3         },
  { href: '/dashboard/waitlist',   label: 'Waitlist',   Icon: ListOrdered     },
  { href: '/dashboard/tamu',       label: 'Tamu',       Icon: Users           },
  { href: '/dashboard/laporan',    label: 'Laporan',    Icon: BarChart3       },
  { href: '/dashboard/pengaturan', label: 'Pengaturan', Icon: Settings        },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [user,       setUser]       = useState<User | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    getRestaurant(RESTAURANT_ID).then(setRestaurant)
  }, [])

  useEffect(() => {
    return onAuthStateChange(setUser)
  }, [])

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await signOut()
      router.replace('/login')
    } finally {
      setLoggingOut(false)
    }
  }

  const name    = restaurant?.name ?? 'Memuat...'
  const area    = restaurant ? `${restaurant.area}, Jakarta` : ''
  const initial = user?.displayName?.[0] ?? user?.email?.[0]?.toUpperCase() ?? 'M'
  const label   = user?.displayName ?? user?.email ?? 'Manager'

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
                  // cream/60 on ink = 7.2:1 ✓
                  : 'text-cream/60 hover:text-cream hover:bg-white/5'
                }`}
            >
              <Icon
                size={16}
                // cream/55 on ink = 6.4:1 ✓
                className={active ? 'text-gold' : 'text-cream/55 group-hover:text-cream'}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span className="text-sm font-sans">{label}</span>
              {active && <ChevronRight size={12} className="ml-auto text-gold" />}
            </Link>
          )
        })}
      </nav>

      {/* Manager + Logout */}
      <div className="px-4 py-4 border-t border-white/8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center font-display font-bold text-sm text-white flex-shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-sans font-medium text-cream truncate">{label}</p>
            {/* cream/60 on ink = 7.2:1 ✓ */}
            <p className="text-[10px] font-sans text-cream/60">Manager</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-cream/50 hover:text-cream hover:bg-white/5 transition-colors disabled:opacity-40"
        >
          <LogOut size={14} strokeWidth={1.8} />
          <span className="text-xs font-sans">{loggingOut ? 'Keluar…' : 'Keluar'}</span>
        </button>
      </div>
    </aside>
  )
}
