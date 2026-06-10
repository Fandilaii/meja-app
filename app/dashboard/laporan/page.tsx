'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useMemo } from 'react'
import { Loader2 } from 'lucide-react'
import { getAllReservations } from '@/lib/firestore'
import StatCard from '@/components/dashboard/StatCard'
import type { Reservation } from '@/types'

const RESTAURANT_ID = 'P3R1nyDl8sqYukKkculP'

type Range = 'week' | 'month' | 'lastMonth'

const RANGE_LABELS: Record<Range, string> = {
  week:      'Minggu Ini',
  month:     'Bulan Ini',
  lastMonth: 'Bulan Lalu',
}

function toStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + n); return r
}

function weekStart(d: Date): Date {
  const day  = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const mon  = new Date(d); mon.setDate(d.getDate() + diff); mon.setHours(0, 0, 0, 0)
  return mon
}

interface DateRange { start: string; end: string; prevStart: string; prevEnd: string }

function getRange(range: Range): DateRange {
  const today = new Date(); today.setHours(0, 0, 0, 0)

  if (range === 'week') {
    const mon     = weekStart(today)
    const sun     = addDays(mon, 6)
    const prevMon = addDays(mon, -7)
    const prevSun = addDays(prevMon, 6)
    return { start: toStr(mon), end: toStr(sun), prevStart: toStr(prevMon), prevEnd: toStr(prevSun) }
  }
  if (range === 'month') {
    const s  = new Date(today.getFullYear(), today.getMonth(), 1)
    const e  = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    const ps = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const pe = new Date(today.getFullYear(), today.getMonth(), 0)
    return { start: toStr(s), end: toStr(e), prevStart: toStr(ps), prevEnd: toStr(pe) }
  }
  // lastMonth
  const s  = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const e  = new Date(today.getFullYear(), today.getMonth(), 0)
  const ps = new Date(today.getFullYear(), today.getMonth() - 2, 1)
  const pe = new Date(today.getFullYear(), today.getMonth() - 1, 0)
  return { start: toStr(s), end: toStr(e), prevStart: toStr(ps), prevEnd: toStr(pe) }
}

function filterByRange(reservations: Reservation[], start: string, end: string): Reservation[] {
  return reservations.filter((r) => r.date >= start && r.date <= end)
}

function computeStats(reservations: Reservation[]) {
  const active    = reservations.filter((r) => r.status !== 'cancelled')
  const cancelled = reservations.filter((r) => r.status === 'cancelled')
  const total     = reservations.length

  const totalGuests = active.reduce((s, r) => s + r.guestCount, 0)
  const cancelRate  = total > 0 ? Math.round((cancelled.length / total) * 100) : 0

  // Most booked time slot
  const slotCounts: Record<string, number> = {}
  for (const r of active) slotCounts[r.timeSlot] = (slotCounts[r.timeSlot] ?? 0) + 1
  const busySlot = Object.entries(slotCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'

  return { total: active.length, totalGuests, cancelRate, busySlot }
}

function getDaysInRange(start: string, end: string): string[] {
  const days: string[] = []
  const s = new Date(start); s.setHours(0, 0, 0, 0)
  const e = new Date(end);   e.setHours(0, 0, 0, 0)
  const cur = new Date(s)
  while (cur <= e) { days.push(toStr(cur)); cur.setDate(cur.getDate() + 1) }
  return days
}

const MONTHS_ID = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']

function shortDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-').map(Number)
  return `${d} ${MONTHS_ID[m - 1]}`
}

export default function LaporanPage() {
  const [range,        setRange]        = useState<Range>('month')
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    getAllReservations(RESTAURANT_ID).then((data) => {
      setReservations(data)
      setLoading(false)
    })
  }, [])

  const { start, end, prevStart, prevEnd } = useMemo(() => getRange(range), [range])

  const current  = useMemo(() => filterByRange(reservations, start, end),         [reservations, start, end])
  const previous = useMemo(() => filterByRange(reservations, prevStart, prevEnd),  [reservations, prevStart, prevEnd])

  const stats     = useMemo(() => computeStats(current),  [current])
  const prevStats = useMemo(() => computeStats(previous), [previous])

  // Bar chart: reservations per day
  const days = useMemo(() => getDaysInRange(start, end), [start, end])
  const perDay = useMemo(() => {
    const map: Record<string, number> = {}
    for (const d of days) map[d] = 0
    for (const r of current) {
      if (r.status !== 'cancelled') map[r.date] = (map[r.date] ?? 0) + 1
    }
    return map
  }, [current, days])

  const maxPerDay = useMemo(() => Math.max(1, ...Object.values(perDay)), [perDay])

  const delta = (cur: number, prev: number) => (prev === 0 ? undefined : Math.round(((cur - prev) / prev) * 100))

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-ink text-2xl">Laporan</h1>
          <p className="text-sm font-sans text-ink/60 mt-0.5">
            Analitik performa restoran
          </p>
        </div>

        {/* Range selector */}
        <div className="flex gap-1 bg-sand rounded-xl p-1">
          {(Object.keys(RANGE_LABELS) as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-sans font-medium transition-colors
                ${range === r
                  ? 'bg-white text-ink shadow-sm'
                  : 'text-ink/60 hover:text-ink'
                }`}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-gold" />
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatCard
              label="Total Reservasi"
              value={stats.total}
              subtitle={prevStats.total > 0 ? `${prevStats.total} periode lalu` : 'Belum ada data lalu'}
              delta={delta(stats.total, prevStats.total)}
            />
            <StatCard
              label="Total Tamu"
              value={stats.totalGuests}
              subtitle={prevStats.totalGuests > 0 ? `${prevStats.totalGuests} periode lalu` : 'Belum ada data lalu'}
              delta={delta(stats.totalGuests, prevStats.totalGuests)}
            />
            <StatCard
              label="Slot Tersibuk"
              value={stats.busySlot}
              subtitle={stats.busySlot !== '—' ? `${perDay[Object.entries(perDay).sort((a,b)=>b[1]-a[1])[0]?.[0]??''] ?? 0}× dipilih` : 'Belum ada data'}
            />
            <StatCard
              label="Tingkat Pembatalan"
              value={`${stats.cancelRate}%`}
              subtitle={prevStats.cancelRate > 0 ? `${prevStats.cancelRate}% periode lalu` : 'Belum ada data lalu'}
              delta={stats.cancelRate === 0 ? undefined : delta(stats.cancelRate, prevStats.cancelRate) !== undefined ? -(delta(stats.cancelRate, prevStats.cancelRate)!) : undefined}
            />
          </div>

          {/* Bar chart */}
          <div className="bg-white border border-meja-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-semibold text-ink text-base">Reservasi per Hari</h2>
              {current.length === 0 && (
                <span className="text-xs font-sans text-ink/40">Belum ada data</span>
              )}
            </div>

            {days.length === 0 ? null : (
              <div className="flex items-end gap-1 h-36 overflow-x-auto pb-1">
                {days.map((day) => {
                  const count  = perDay[day] ?? 0
                  const pct    = (count / maxPerDay) * 100
                  const today  = toStr(new Date())
                  const isToday = day === today

                  return (
                    <div key={day} className="flex flex-col items-center gap-1.5 flex-1 min-w-[28px]">
                      {/* Count label */}
                      <span className={`text-[9px] font-sans font-medium ${count > 0 ? 'text-ink/60' : 'text-transparent'}`}>
                        {count}
                      </span>
                      {/* Bar */}
                      <div className="w-full flex items-end" style={{ height: '80px' }}>
                        <div
                          className={`w-full rounded-t-md transition-all duration-300
                            ${isToday ? 'bg-gold' : count > 0 ? 'bg-ink/20' : 'bg-sand'}`}
                          style={{ height: count === 0 ? '4px' : `${Math.max(8, pct)}%` }}
                        />
                      </div>
                      {/* Day label */}
                      <span className={`text-[9px] font-sans text-center leading-tight
                        ${isToday ? 'text-gold font-semibold' : 'text-ink/40'}`}
                        style={{ writingMode: days.length > 14 ? 'vertical-rl' : 'horizontal-tb' }}
                      >
                        {days.length <= 7
                          ? ['Min','Sen','Sel','Rab','Kam','Jum','Sab'][new Date(day + 'T00:00:00').getDay()]
                          : day.slice(8) // day number only for month view
                        }
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
