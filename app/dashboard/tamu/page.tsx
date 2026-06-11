'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Search, Phone, ChevronDown, ChevronUp, Loader2, NotebookPen } from 'lucide-react'
import { getAllReservations, getAllGuestNotes, saveGuestNote } from '@/lib/firestore'
import type { Reservation } from '@/types'

const RESTAURANT_ID = 'P3R1nyDl8sqYukKkculP'

interface GuestSummary {
  guestName:    string
  guestPhone:   string
  visits:       number
  totalGuests:  number
  lastVisit:    string
  reservations: Reservation[]
}

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  arrived:   { bg: 'bg-forest-light', text: 'text-forest',    label: 'Hadir'      },
  confirmed: { bg: 'bg-blue-50',      text: 'text-blue-700',  label: 'Konfirmasi' },
  pending:   { bg: 'bg-gold-light',   text: 'text-[#5C3E10]', label: 'Baru'       },
  cancelled: { bg: 'bg-terra-light',  text: 'text-[#7A2E12]', label: 'Batal'      },
}

function buildGuestList(reservations: Reservation[]): GuestSummary[] {
  const map = new Map<string, GuestSummary>()

  for (const r of reservations) {
    if (r.status === 'cancelled' || !r.guestPhone) continue
    const key = r.guestPhone
    if (!map.has(key)) {
      map.set(key, {
        guestName:    r.guestName,
        guestPhone:   r.guestPhone,
        visits:       0,
        totalGuests:  0,
        lastVisit:    r.date,
        reservations: [],
      })
    }
    const g = map.get(key)!
    g.visits++
    g.totalGuests += r.guestCount
    g.reservations.push(r)
    if (r.date > g.lastVisit) { g.lastVisit = r.date; g.guestName = r.guestName }
  }

  for (const g of map.values()) {
    g.reservations.sort((a, b) => b.date.localeCompare(a.date) || b.timeSlot.localeCompare(a.timeSlot))
  }

  return Array.from(map.values()).sort(
    (a, b) => b.visits - a.visits || b.lastVisit.localeCompare(a.lastVisit)
  )
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function TamuPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [expanded,     setExpanded]     = useState<string | null>(null)
  const [notes,        setNotes]        = useState<Record<string, string>>({})
  const [saving,       setSaving]       = useState<Record<string, boolean>>({})
  const [saved,        setSaved]        = useState<Record<string, boolean>>({})

  useEffect(() => {
    Promise.all([
      getAllReservations(RESTAURANT_ID),
      getAllGuestNotes(RESTAURANT_ID),
    ]).then(([res, noteMap]) => {
      setReservations(res)
      setNotes(noteMap)
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

  function toggleExpand(phone: string) {
    setExpanded((prev) => (prev === phone ? null : phone))
  }

  const handleSaveNote = useCallback(async (phone: string) => {
    setSaving((p) => ({ ...p, [phone]: true }))
    try {
      await saveGuestNote(RESTAURANT_ID, phone, notes[phone] ?? '')
      setSaved((p) => ({ ...p, [phone]: true }))
      setTimeout(() => setSaved((p) => ({ ...p, [phone]: false })), 2000)
    } finally {
      setSaving((p) => ({ ...p, [phone]: false }))
    }
  }, [notes])

  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display font-bold text-ink text-2xl">Tamu</h1>
        <p className="text-sm font-sans text-ink/60 mt-0.5">
          {loading
            ? 'Memuat…'
            : `${guests.length} tamu unik · ${reservations.filter((r) => r.status !== 'cancelled').length} kunjungan`}
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
          {/* Column header */}
          <div className="px-5 py-3 border-b border-meja-border grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 text-[10px] font-sans text-ink/50 uppercase tracking-wider">
            <span>Tamu</span>
            <span className="text-center w-16">Kunjungan</span>
            <span className="text-right w-28">Terakhir</span>
            <span className="text-center w-8">Catatan</span>
            <span className="text-right w-16">Kontak</span>
          </div>

          <div className="divide-y divide-meja-border/50">
            {filtered.map((guest) => {
              const isOpen    = expanded === guest.guestPhone
              const hasNote   = !!(notes[guest.guestPhone]?.trim())

              return (
                <div key={guest.guestPhone}>
                  {/* Summary row */}
                  <div
                    className="px-5 py-3.5 grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center hover:bg-sand/40 transition-colors cursor-pointer"
                    onClick={() => toggleExpand(guest.guestPhone)}
                  >
                    {/* Name + phone + expand chevron */}
                    <div className="min-w-0 flex items-center gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-sans font-medium text-ink truncate">{guest.guestName}</p>
                        <p className="text-[11px] font-sans text-ink/50 truncate">{guest.guestPhone}</p>
                      </div>
                      {isOpen
                        ? <ChevronUp size={13} className="text-ink/30 shrink-0" />
                        : <ChevronDown size={13} className="text-ink/30 shrink-0" />
                      }
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

                    {/* Note indicator */}
                    <div className="w-8 flex justify-center">
                      {hasNote && (
                        <NotebookPen size={13} className="text-gold" />
                      )}
                    </div>

                    {/* WhatsApp — stop propagation so click doesn't toggle accordion */}
                    <div className="w-16 text-right" onClick={(e) => e.stopPropagation()}>
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

                  {/* Expanded — visit history + notes */}
                  {isOpen && (
                    <div className="px-5 pb-4 pt-3 bg-sand/30 border-t border-meja-border/50 space-y-4">
                      {/* Visit history */}
                      <div>
                        <p className="text-[10px] font-sans text-ink/50 uppercase tracking-wider mb-2">
                          Riwayat Kunjungan
                        </p>
                        <div className="space-y-1.5">
                          {guest.reservations.slice(0, 5).map((r) => {
                            const badge = STATUS_BADGE[r.status] ?? STATUS_BADGE.pending
                            return (
                              <div key={r.id} className="flex items-center gap-3 text-xs font-sans">
                                <span className="text-ink/60 w-28 shrink-0">{formatDate(r.date)}</span>
                                <span className="text-ink/60 font-mono w-12 shrink-0">{r.timeSlot}</span>
                                <span className="text-ink/60 w-16 shrink-0">{r.guestCount} orang</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${badge.bg} ${badge.text}`}>
                                  {badge.label}
                                </span>
                                <span className="text-ink/30 font-mono text-[10px]">{r.referenceCode}</span>
                              </div>
                            )
                          })}
                          {guest.reservations.length > 5 && (
                            <p className="text-[10px] font-sans text-ink/40">
                              +{guest.reservations.length - 5} kunjungan lainnya
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <p className="text-[10px] font-sans text-ink/50 uppercase tracking-wider mb-1.5">
                          Catatan Manager
                        </p>
                        <textarea
                          value={notes[guest.guestPhone] ?? ''}
                          onChange={(e) =>
                            setNotes((p) => ({ ...p, [guest.guestPhone]: e.target.value }))
                          }
                          onClick={(e) => e.stopPropagation()}
                          placeholder="Preferensi meja, alergi makanan, tamu VIP…"
                          rows={2}
                          className="w-full px-3.5 py-2.5 text-sm font-sans text-ink rounded-xl border border-meja-border focus:outline-none focus:border-gold/60 resize-none bg-white transition-colors placeholder:text-ink/30"
                        />
                        <div className="flex items-center justify-end gap-3 mt-1.5">
                          {saved[guest.guestPhone] && (
                            <span className="text-xs font-sans text-forest">✓ Tersimpan</span>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSaveNote(guest.guestPhone) }}
                            disabled={saving[guest.guestPhone]}
                            className="text-xs font-sans px-3 py-1.5 rounded-lg bg-ink text-cream hover:bg-ink/90 transition-colors disabled:opacity-60 flex items-center gap-1.5"
                          >
                            {saving[guest.guestPhone] && <Loader2 size={10} className="animate-spin" />}
                            {saving[guest.guestPhone] ? 'Menyimpan…' : 'Simpan Catatan'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
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
