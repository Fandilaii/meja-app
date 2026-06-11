'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import {
  subscribeToTables,
  subscribeToReservationsForDate,
  updateTableStatus,
  updateReservationStatus,
} from '@/lib/firestore'
import type { RestaurantTable, Reservation } from '@/types'

const RESTAURANT_ID = 'P3R1nyDl8sqYukKkculP'

function todayString(): string {
  return new Date().toISOString().split('T')[0]
}

const STATUS_CFG = {
  available: { bg: 'bg-forest/10 border-forest/20', text: 'text-forest',    dot: 'bg-forest', label: 'Kosong'  },
  reserved:  { bg: 'bg-gold/10 border-gold/30',     text: 'text-[#5C3E10]', dot: 'bg-gold',   label: 'Dipesan' },
  occupied:  { bg: 'bg-terra/10 border-terra/20',   text: 'text-[#7A2E12]', dot: 'bg-terra',  label: 'Terisi'  },
} as const

export default function FloorPage() {
  const [tables,       setTables]       = useState<RestaurantTable[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading,      setLoading]      = useState(true)
  const [selected,     setSelected]     = useState<string | null>(null)
  const [acting,       setActing]       = useState(false)

  useEffect(() => {
    const unsubT = subscribeToTables(RESTAURANT_ID, (t) => { setTables(t); setLoading(false) })
    const unsubR = subscribeToReservationsForDate(RESTAURANT_ID, todayString(), setReservations)
    return () => { unsubT(); unsubR() }
  }, [])

  // tableId → today's active reservation
  const resByTable = new Map<string, Reservation>(
    reservations
      .filter((r) => r.tableId !== 'auto' && r.status !== 'cancelled')
      .map((r) => [r.tableId, r])
  )

  const selectedTable = tables.find((t) => t.id === selected) ?? null
  const selectedRes   = selected ? resByTable.get(selected) : undefined

  async function handleMarkArrived() {
    if (!selectedTable || !selectedRes) return
    setActing(true)
    try {
      await updateReservationStatus(selectedRes.id, 'arrived')
      await updateTableStatus(RESTAURANT_ID, selectedTable.id, 'occupied')
      setSelected(null)
    } finally { setActing(false) }
  }

  async function handleFreeTable() {
    if (!selectedTable) return
    setActing(true)
    try {
      await updateTableStatus(RESTAURANT_ID, selectedTable.id, 'available')
      setSelected(null)
    } finally { setActing(false) }
  }

  const counts = {
    available: tables.filter((t) => t.status === 'available').length,
    reserved:  tables.filter((t) => t.status === 'reserved').length,
    occupied:  tables.filter((t) => t.status === 'occupied').length,
  }
  const guestsSeated = reservations
    .filter((r) => r.status === 'arrived')
    .reduce((s, r) => s + r.guestCount, 0)

  return (
    <div className="p-6 flex flex-col" style={{ minHeight: 'calc(100vh - 0px)' }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-ink text-2xl">Lantai</h1>
          <p className="text-sm font-sans text-ink/60 mt-0.5">Tampilan layanan real-time</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          {(Object.keys(STATUS_CFG) as Array<keyof typeof STATUS_CFG>).map((s) => (
            <div
              key={s}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-sans font-medium ${STATUS_CFG[s].bg} ${STATUS_CFG[s].text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CFG[s].dot}`} />
              {counts[s]} {STATUS_CFG[s].label}
            </div>
          ))}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-meja-border bg-white text-xs font-sans text-ink/60">
            {guestsSeated} tamu hadir
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-forest animate-pulse" />
            <span className="text-xs font-sans text-ink/60">Live</span>
          </div>
        </div>
      </div>

      {/* Floor grid */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-gold" />
        </div>
      ) : tables.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-sand flex items-center justify-center text-3xl mb-4">🪑</div>
          <p className="font-display font-medium text-ink mb-1">Belum ada meja</p>
          <p className="text-sm font-sans text-ink/60">Tambah meja di halaman Meja terlebih dahulu</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {tables.map((table) => {
            const cfg        = STATUS_CFG[table.status]
            const res        = resByTable.get(table.id)
            const isSelected = selected === table.id

            return (
              <button
                key={table.id}
                onClick={() => setSelected(isSelected ? null : table.id)}
                className={`relative rounded-2xl p-4 border-2 text-left transition-all hover:scale-[0.97] min-h-[140px] flex flex-col
                  ${cfg.bg} border-current/20
                  ${isSelected ? 'ring-2 ring-ink/30 scale-[0.97]' : ''}
                `}
              >
                {/* Number + status dot */}
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xl font-display font-bold ${cfg.text}`}>
                    {table.tableNumber}
                  </span>
                  <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot} shrink-0`} />
                </div>

                {/* Capacity */}
                <p className={`text-[10px] font-sans ${cfg.text} opacity-60 mb-auto`}>
                  {table.capacity} kursi
                </p>

                {/* Guest info */}
                <div className="mt-3">
                  {res ? (
                    <>
                      <p className={`text-xs font-sans font-semibold ${cfg.text} truncate`}>{res.guestName}</p>
                      <p className={`text-[10px] font-sans ${cfg.text} opacity-70`}>
                        {res.guestCount} org · {res.timeSlot}
                      </p>
                    </>
                  ) : table.status === 'occupied' ? (
                    <p className={`text-xs font-sans font-semibold ${cfg.text}`}>Walk-in</p>
                  ) : (
                    <p className={`text-[10px] font-sans ${cfg.text} opacity-40`}>{cfg.label}</p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Detail / action panel */}
      {selectedTable && (
        <div className="fixed inset-y-0 right-0 w-72 bg-white border-l border-meja-border shadow-2xl flex flex-col z-50">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-meja-border">
            <h2 className="font-display font-semibold text-ink text-base">
              Meja {selectedTable.tableNumber}
            </h2>
            <button
              onClick={() => setSelected(null)}
              className="w-8 h-8 rounded-full hover:bg-sand flex items-center justify-center text-ink/60 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="px-5 py-4 space-y-4 flex-1 overflow-y-auto">
            {/* Table badge */}
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-display font-bold text-lg border-2 ${STATUS_CFG[selectedTable.status].bg} ${STATUS_CFG[selectedTable.status].text} border-current/20`}>
                {selectedTable.tableNumber}
              </div>
              <div>
                <p className="text-sm font-sans font-medium text-ink">{selectedTable.capacity} kursi</p>
                <p className={`text-xs font-sans ${STATUS_CFG[selectedTable.status].text}`}>
                  {STATUS_CFG[selectedTable.status].label}
                </p>
              </div>
            </div>

            {/* Reservation details */}
            {selectedRes ? (
              <div className="rounded-xl bg-sand px-4 py-3 space-y-2">
                {[
                  { label: 'Tamu',   value: selectedRes.guestName },
                  { label: 'Waktu',  value: `${selectedRes.timeSlot} WIB` },
                  { label: 'Jumlah', value: `${selectedRes.guestCount} orang` },
                  { label: 'Status', value: selectedRes.status === 'arrived' ? 'Sudah hadir' : 'Menunggu datang' },
                  { label: 'Kode',   value: selectedRes.referenceCode, mono: true },
                ].map(({ label, value, mono }) => (
                  <div key={label} className="flex justify-between items-baseline gap-2">
                    <p className="text-[10px] font-sans text-ink/50 uppercase tracking-wider shrink-0">{label}</p>
                    <p className={`text-xs font-medium text-ink text-right ${mono ? 'font-mono' : 'font-sans'}`}>{value}</p>
                  </div>
                ))}
              </div>
            ) : selectedTable.status !== 'available' ? (
              <div className="rounded-xl bg-sand px-4 py-3">
                <p className="text-xs font-sans text-ink/60">
                  {selectedTable.status === 'occupied'
                    ? 'Tamu walk-in — tidak ada reservasi terdaftar.'
                    : 'Dipesan tanpa tamu terdaftar di sistem.'}
                </p>
              </div>
            ) : (
              <div className="rounded-xl bg-forest-light px-4 py-3">
                <p className="text-xs font-sans text-forest">Meja kosong dan siap digunakan.</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-5 pb-5 pt-3 border-t border-meja-border space-y-2">
            {selectedTable.status === 'reserved' && selectedRes && selectedRes.status !== 'arrived' && (
              <button
                onClick={handleMarkArrived}
                disabled={acting}
                className="w-full py-2.5 rounded-xl bg-forest text-white font-sans text-sm font-medium hover:bg-forest/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {acting && <Loader2 size={13} className="animate-spin" />}
                ✓ Tandai Hadir
              </button>
            )}

            {selectedTable.status !== 'available' && (
              <button
                onClick={handleFreeTable}
                disabled={acting}
                className="w-full py-2.5 rounded-xl border border-meja-border text-ink/60 font-sans text-sm font-medium hover:bg-sand transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {acting && <Loader2 size={13} className="animate-spin" />}
                Bebaskan Meja
              </button>
            )}

            {selectedTable.status === 'available' && (
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
