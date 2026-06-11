'use client'

import { useState, useEffect } from 'react'
import { X, Printer, NotebookPen } from 'lucide-react'
import { getAllGuestNotes } from '@/lib/firestore'
import type { Reservation, RestaurantTable } from '@/types'

interface Props {
  restaurantId: string
  reservations: Reservation[]
  tables: RestaurantTable[]
  onClose: () => void
}

const STATUS_COLOR: Record<string, string> = {
  arrived:   'text-forest',
  confirmed: 'text-blue-600',
  pending:   'text-[#5C3E10]',
}

const STATUS_LABEL: Record<string, string> = {
  arrived:   'Hadir',
  confirmed: 'Konfirmasi',
  pending:   'Menunggu',
}

export default function BriefingModal({ restaurantId, reservations, tables, onClose }: Props) {
  const [notes, setNotes] = useState<Record<string, string>>({})

  useEffect(() => {
    getAllGuestNotes(restaurantId).then(setNotes)
  }, [restaurantId])

  const tableMap = new Map(tables.map((t) => [t.id, t.tableNumber]))
  const today    = new Date()
  const dateStr  = today.toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const sorted = [...reservations]
    .filter((r) => r.status !== 'cancelled')
    .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot))

  const totalGuests  = sorted.reduce((s, r) => s + r.guestCount, 0)
  const notesCount   = sorted.filter((r) => notes[r.guestPhone]?.trim()).length
  const arrivedCount = sorted.filter((r) => r.status === 'arrived').length

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-meja-border">
          <h2 className="font-display font-semibold text-ink text-lg">Briefing Malam Ini</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-meja-border text-sm font-sans text-ink/60 hover:bg-sand transition-colors"
            >
              <Printer size={14} />
              Print
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-sand flex items-center justify-center text-ink/60 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Summary strip */}
        <div className="px-6 py-4 border-b border-meja-border bg-sand/40">
          <p className="font-display font-bold text-ink text-base">{dateStr}</p>
          <div className="flex items-center gap-5 mt-1.5 flex-wrap">
            <span className="text-xs font-sans text-ink/60">{sorted.length} reservasi</span>
            <span className="text-xs font-sans text-ink/60">{totalGuests} tamu</span>
            <span className="text-xs font-sans text-forest">{arrivedCount} sudah hadir</span>
            {notesCount > 0 && (
              <span className="flex items-center gap-1 text-xs font-sans text-gold">
                <NotebookPen size={11} />
                {notesCount} tamu dengan catatan
              </span>
            )}
          </div>
        </div>

        {/* Reservation list */}
        <div className="overflow-y-auto flex-1">
          {sorted.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-sans text-sm text-ink/40">Tidak ada reservasi malam ini</p>
            </div>
          ) : (
            <div>
              {/* Column headers */}
              <div className="grid grid-cols-[64px_56px_1fr_80px_80px] gap-3 px-6 py-2.5 border-b border-meja-border bg-sand/30 text-[10px] font-sans font-medium text-ink/50 uppercase tracking-wider sticky top-0">
                <span>Waktu</span>
                <span>Meja</span>
                <span>Tamu</span>
                <span className="text-right">Jumlah</span>
                <span className="text-right">Status</span>
              </div>

              <div className="divide-y divide-meja-border/50">
                {sorted.map((r) => {
                  const tableNum = r.tableId !== 'auto' ? (tableMap.get(r.tableId) ?? '—') : '—'
                  const note     = notes[r.guestPhone]?.trim()

                  return (
                    <div
                      key={r.id}
                      className={`grid grid-cols-[64px_56px_1fr_80px_80px] gap-3 px-6 py-3 items-start
                        ${note ? 'bg-gold-light/30' : 'hover:bg-sand/30'}`}
                    >
                      <span className="text-sm font-mono font-bold text-ink pt-0.5">
                        {r.timeSlot}
                      </span>

                      <span className={`text-sm font-sans font-semibold pt-0.5 ${tableNum === '—' ? 'text-ink/30' : 'text-ink'}`}>
                        {tableNum}
                      </span>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-sans font-medium text-ink truncate">{r.guestName}</p>
                          {note && <NotebookPen size={11} className="text-gold shrink-0" />}
                        </div>
                        {note && (
                          <p className="text-[11px] font-sans text-ink/50 mt-0.5 line-clamp-2 leading-relaxed">
                            {note}
                          </p>
                        )}
                      </div>

                      <span className="text-sm font-sans text-ink/60 text-right pt-0.5">
                        {r.guestCount} org
                      </span>

                      <span className={`text-[11px] font-sans font-semibold text-right pt-0.5 ${STATUS_COLOR[r.status] ?? 'text-ink/60'}`}>
                        {STATUS_LABEL[r.status] ?? r.status}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-meja-border text-center">
          <p className="text-[10px] font-sans text-ink/30">
            Meja Dashboard · {today.toLocaleString('id-ID')}
          </p>
        </div>
      </div>
    </div>
  )
}
