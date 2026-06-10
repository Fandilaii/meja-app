'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useMemo } from 'react'
import { Search, Phone, Loader2 } from 'lucide-react'
import { getAllReservations } from '@/lib/firestore'
import type { Reservation } from '@/types'

const RESTAURANT_ID = 'P3R1nyDl8sqYukKkculP'

interface GuestSummary {
  guestName:  string
  guestPhone: string
  visits:     number
  lastVisit:  string   // 'YYYY-MM-DD'
}

function buildGuestList(reservations: Reservation[]): GuestSummary[] {
  const map = new Map<string, GuestSummary>()

  for (const r of reservations) {
    if (r.status === 'cancelled') continue
    const key = r.guestPhone
    if (!map.has(key)) {
      map.set(key, { guestName: r.guestName, guestPhone: r.guestPhone, visits: 0, lastVisit: r.date })
    }
    const g = map.get(key)!
    g.visits++
    if (r.date > g.lastVisit) { g.lastVisit = r.date; g.guestName = r.guestName }
  }

  return Array.from(map.values()).sort((a, b) => b.visits - a.visits || b.lastVisit.localeCompare(a.lastVisit))
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function TamuPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')

  useEffect(() => {
    getAllReservations(RESTAURANT_ID).then((data) => {
      setReservations(data)
      setLoading(false)
    })
  }, [])

  const guests = useMemo(() => buildGuestList(reservations), [reservations])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return guests
    return guests.filter((g) =>
      g.guestName.toLowerCase().includes(q) || g.guestPhone.includes(q)
    )
  }, [guests, search])

  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display font-bold text-ink text-2xl">Tamu</h1>
        <p className="text-sm font-sans text-ink/60 mt-0.5">
          {loading ? 'Memuat…' : `${guests.length} tamu unik dari ${reservations.filter(r => r.status !== 'cancelled').length} kunjungan`}
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama atau nomor WA…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-meja-border text-ink font-sans text-sm placeholder:text-ink/30 focus:outline-none focus:border-gold/60 transition-colors bg-white"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-gold" />
        </div>
      ) : guests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-meja-border">
          <div className="w-16 h-16 rounded-2xl bg-sand flex items-center justify-center text-3xl mb-4">👥</div>
          <p className="font-display font-medium text-ink mb-1">Belum ada tamu</p>
          <p className="text-sm font-sans text-ink/60">Data tamu muncul setelah ada reservasi</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-meja-border">
          <p className="font-sans text-sm text-ink/60">Tidak ada tamu yang cocok dengan pencarian</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-meja-border overflow-hidden">
          {/* Header row */}
          <div className="px-5 py-3 border-b border-meja-border grid grid-cols-[1fr_auto_auto_auto] gap-4 text-[10px] font-sans text-ink/50 uppercase tracking-wider">
            <span>Tamu</span>
            <span className="text-center w-16">Kunjungan</span>
            <span className="text-right w-28">Terakhir</span>
            <span className="text-right w-16">Kontak</span>
          </div>

          <div className="divide-y divide-meja-border/50">
            {filtered.map((guest) => (
              <div
                key={guest.guestPhone}
                className="px-5 py-3.5 grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center hover:bg-sand/40 transition-colors"
              >
                {/* Name + phone */}
                <div className="min-w-0">
                  <p className="text-sm font-sans font-medium text-ink truncate">{guest.guestName}</p>
                  <p className="text-[11px] font-sans text-ink/50 truncate">{guest.guestPhone}</p>
                </div>

                {/* Visit count */}
                <div className="w-16 text-center">
                  <span className={`text-xs font-sans font-semibold px-2.5 py-1 rounded-full
                    ${guest.visits >= 5
                      ? 'bg-gold-light text-[#5C3E10]'
                      : guest.visits >= 2
                        ? 'bg-forest-light text-forest'
                        : 'bg-sand text-ink/60'
                    }`}
                  >
                    {guest.visits}×
                  </span>
                </div>

                {/* Last visit */}
                <div className="w-28 text-right">
                  <p className="text-xs font-sans text-ink/60">{formatDate(guest.lastVisit)}</p>
                </div>

                {/* WhatsApp */}
                <div className="w-16 text-right">
                  <a
                    href={`https://wa.me/${guest.guestPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Hubungi ${guest.guestName}`}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-forest-light text-forest hover:bg-forest/20 transition-colors ml-auto"
                  >
                    <Phone size={13} />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {filtered.length < guests.length && (
            <div className="px-5 py-3 border-t border-meja-border text-center">
              <p className="text-xs font-sans text-ink/40">
                Menampilkan {filtered.length} dari {guests.length} tamu
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
