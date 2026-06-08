'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, X, Loader2, Phone } from 'lucide-react'
import { getReservationsForDate, updateReservationStatus } from '@/lib/firestore'
import type { Reservation } from '@/types'

const RESTAURANT_ID = 'P3R1nyDl8sqYukKkculP'

const DAYS_ID  = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

const STATUS_CONFIG = {
  pending:   { bg: 'bg-gold-light',   text: 'text-[#5C3E10]', label: 'Menunggu'      },
  confirmed: { bg: 'bg-forest-light', text: 'text-forest',    label: 'Dikonfirmasi'  },
  arrived:   { bg: 'bg-sand',         text: 'text-ink/60',    label: 'Hadir'         },
  cancelled: { bg: 'bg-terra-light',  text: 'text-[#7A2E12]', label: 'Dibatalkan'    },
} as const

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Monday of the week containing `d` */
function weekStart(d: Date): Date {
  const day = d.getDay() // 0=Sun
  const diff = day === 0 ? -6 : 1 - day
  const mon  = new Date(d)
  mon.setDate(d.getDate() + diff)
  mon.setHours(0, 0, 0, 0)
  return mon
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function formatDate(d: Date): string {
  return `${DAYS_ID[d.getDay()]}, ${d.getDate()} ${MONTHS_ID[d.getMonth()]}`
}

export default function KalenderPage() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [monDate,    setMonDate]    = useState<Date>(() => weekStart(today))
  const [weekData,   setWeekData]   = useState<Record<string, Reservation[]>>({})
  const [weekLoading, setWeekLoading] = useState(true)
  const [selected,   setSelected]   = useState<Reservation | null>(null)
  const [updating,   setUpdating]   = useState(false)

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(monDate, i))
  const weekLabel = `${monDate.getDate()} ${MONTHS_ID[monDate.getMonth()]} – ${addDays(monDate, 6).getDate()} ${MONTHS_ID[addDays(monDate, 6).getMonth()]} ${addDays(monDate, 6).getFullYear()}`

  const loadWeek = useCallback(async (mon: Date) => {
    setWeekLoading(true)
    const days = Array.from({ length: 7 }, (_, i) => addDays(mon, i))
    const results = await Promise.all(
      days.map((d) => getReservationsForDate(RESTAURANT_ID, toDateStr(d)))
    )
    const map: Record<string, Reservation[]> = {}
    days.forEach((d, i) => { map[toDateStr(d)] = results[i] })
    setWeekData(map)
    setWeekLoading(false)
  }, [])

  useEffect(() => { loadWeek(monDate) }, [monDate, loadWeek])

  function prevWeek() { setMonDate((d) => addDays(d, -7)) }
  function nextWeek() { setMonDate((d) => addDays(d, +7)) }
  function goToday()  { setMonDate(weekStart(today)) }

  async function handleStatusChange(status: Reservation['status']) {
    if (!selected) return
    setUpdating(true)
    try {
      await updateReservationStatus(selected.id, status)
      // Update locally
      const dateStr = selected.date
      setWeekData((prev) => ({
        ...prev,
        [dateStr]: prev[dateStr]?.map((r) =>
          r.id === selected.id ? { ...r, status } : r
        ) ?? [],
      }))
      setSelected((s) => s ? { ...s, status } : null)
    } finally {
      setUpdating(false)
    }
  }

  const totalThisWeek = Object.values(weekData).flat().length

  return (
    <div className="p-6 flex flex-col min-h-screen max-w-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="font-display font-bold text-ink text-2xl">Kalender</h1>
          <p className="text-sm font-sans text-ink/60 mt-0.5">
            {weekLoading ? 'Memuat…' : `${totalThisWeek} reservasi minggu ini`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToday}
            className="px-3 py-2 rounded-xl border border-meja-border text-sm font-sans text-ink/60 hover:bg-sand transition-colors"
          >
            Hari ini
          </button>
          <div className="flex items-center gap-1 bg-white border border-meja-border rounded-xl overflow-hidden">
            <button onClick={prevWeek} className="px-3 py-2 hover:bg-sand transition-colors text-ink/60 hover:text-ink">
              <ChevronLeft size={16} />
            </button>
            <span className="px-2 py-2 text-xs font-sans font-medium text-ink/60 whitespace-nowrap">
              {weekLabel}
            </span>
            <button onClick={nextWeek} className="px-3 py-2 hover:bg-sand transition-colors text-ink/60 hover:text-ink">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="flex gap-3 flex-1 overflow-x-auto pb-2">
        {weekDays.map((day) => {
          const dateStr    = toDateStr(day)
          const isToday    = dateStr === toDateStr(today)
          const reservations = weekData[dateStr] ?? []
          const isPast     = day < today

          return (
            <div key={dateStr} className="flex-1 min-w-[140px] flex flex-col gap-2">
              {/* Day header */}
              <div className={`rounded-xl px-3 py-2.5 text-center border
                ${isToday
                  ? 'bg-ink border-ink'
                  : isPast
                    ? 'bg-white/50 border-meja-border'
                    : 'bg-white border-meja-border'
                }`}
              >
                <p className={`text-[11px] font-sans font-medium ${isToday ? 'text-gold' : 'text-ink/50'}`}>
                  {DAYS_ID[day.getDay()]}
                </p>
                <p className={`font-display font-bold text-lg leading-none mt-0.5 ${isToday ? 'text-cream' : isPast ? 'text-ink/40' : 'text-ink'}`}>
                  {day.getDate()}
                </p>
                <p className={`text-[9px] font-sans mt-0.5 ${isToday ? 'text-cream/60' : 'text-ink/40'}`}>
                  {MONTHS_ID[day.getMonth()]}
                </p>
              </div>

              {/* Reservation chips */}
              {weekLoading ? (
                <div className="flex-1 flex items-start justify-center pt-4">
                  <Loader2 size={14} className="animate-spin text-ink/30" />
                </div>
              ) : reservations.length === 0 ? (
                <div className="flex-1 flex items-start justify-center pt-5">
                  <p className="text-[10px] font-sans text-ink/25 text-center">Kosong</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {reservations
                    .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot))
                    .map((r) => {
                      const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.pending
                      return (
                        <button
                          key={r.id}
                          onClick={() => setSelected(r)}
                          className={`w-full rounded-xl px-2.5 py-2 border text-left transition-all hover:scale-[0.97]
                            ${selected?.id === r.id ? 'ring-2 ring-ink/20' : ''}
                            ${cfg.bg} border-current/20`}
                        >
                          <p className={`text-[11px] font-sans font-semibold ${cfg.text}`}>{r.timeSlot}</p>
                          <p className={`text-[10px] font-sans truncate ${cfg.text} opacity-80`}>{r.guestName}</p>
                          <p className={`text-[9px] font-sans ${cfg.text} opacity-60`}>{r.guestCount} tamu</p>
                        </button>
                      )
                    })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Detail side panel */}
      {selected && (
        <div className="fixed inset-y-0 right-0 w-80 bg-white border-l border-meja-border shadow-2xl flex flex-col z-50">
          {/* Panel header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-meja-border">
            <h2 className="font-display font-semibold text-ink text-base">Detail Reservasi</h2>
            <button
              onClick={() => setSelected(null)}
              className="w-8 h-8 rounded-full hover:bg-sand flex items-center justify-center text-ink/60 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Status badge */}
          <div className="px-5 pt-4">
            {(() => {
              const cfg = STATUS_CONFIG[selected.status] ?? STATUS_CONFIG.pending
              return (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-sans font-medium ${cfg.bg} ${cfg.text}`}>
                  {cfg.label}
                </span>
              )
            })()}
          </div>

          {/* Details */}
          <div className="px-5 py-4 space-y-4 flex-1 overflow-y-auto">
            {[
              { label: 'Tamu',     value: selected.guestName },
              { label: 'Tanggal',  value: (() => {
                const [y, m, d] = selected.date.split('-').map(Number)
                return new Date(y, m - 1, d).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
              })() },
              { label: 'Waktu',    value: `${selected.timeSlot} WIB` },
              { label: 'Jumlah',   value: `${selected.guestCount} orang` },
              { label: 'Kode',     value: selected.referenceCode, mono: true },
            ].map(({ label, value, mono }) => (
              <div key={label}>
                <p className="text-[10px] font-sans text-ink/50 uppercase tracking-wider mb-0.5">{label}</p>
                <p className={`text-sm font-medium text-ink ${mono ? 'font-mono tracking-wider' : 'font-sans'}`}>{value}</p>
              </div>
            ))}

            {/* WhatsApp link */}
            {selected.guestPhone && (
              <div>
                <p className="text-[10px] font-sans text-ink/50 uppercase tracking-wider mb-0.5">WhatsApp</p>
                <a
                  href={`https://wa.me/${selected.guestPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-sans text-forest hover:underline"
                >
                  <Phone size={12} />
                  {selected.guestPhone}
                </a>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="px-5 pb-5 pt-3 border-t border-meja-border space-y-2">
            <p className="text-[10px] font-sans text-ink/50 uppercase tracking-wider mb-2">Ubah Status</p>

            {selected.status === 'pending' && (
              <button
                onClick={() => handleStatusChange('confirmed')}
                disabled={updating}
                className="w-full py-2.5 rounded-xl bg-forest text-white font-sans text-sm font-medium hover:bg-forest/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {updating && <Loader2 size={13} className="animate-spin" />}
                ✓ Konfirmasi
              </button>
            )}

            {(selected.status === 'pending' || selected.status === 'confirmed') && (
              <button
                onClick={() => handleStatusChange('arrived')}
                disabled={updating}
                className="w-full py-2.5 rounded-xl bg-ink text-cream font-sans text-sm font-medium hover:bg-ink/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {updating && <Loader2 size={13} className="animate-spin" />}
                Tandai Hadir
              </button>
            )}

            {selected.status !== 'cancelled' && selected.status !== 'arrived' && (
              <button
                onClick={() => handleStatusChange('cancelled')}
                disabled={updating}
                className="w-full py-2.5 rounded-xl border border-terra/30 text-terra font-sans text-sm font-medium hover:bg-terra-light transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {updating && <Loader2 size={13} className="animate-spin" />}
                Batalkan
              </button>
            )}

            {(selected.status === 'arrived' || selected.status === 'cancelled') && (
              <p className="text-center text-xs font-sans text-ink/40 py-2">
                Tidak ada aksi tersedia
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
