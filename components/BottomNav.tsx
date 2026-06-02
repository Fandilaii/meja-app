'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, CalendarDays, User } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/',           label: 'Beranda',   Icon: Home         },
  { href: '/search',     label: 'Cari',      Icon: Search       },
  { href: '/reservasi',  label: 'Reservasi', Icon: CalendarDays },
  { href: '/profil',     label: 'Profil',    Icon: User         },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-meja-border z-40 pb-safe">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 min-w-[56px] py-1 transition-colors
                ${active ? 'text-ink' : 'text-ink/45'}`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span className={`text-[11px] font-sans ${active ? 'font-bold' : 'font-medium'}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
