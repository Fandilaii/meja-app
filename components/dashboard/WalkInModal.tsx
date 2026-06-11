'use client'

import { useState } from 'react'
import { X, Loader2, Users } from 'lucide-react'
import { createReservation, updateTableStatus } from '@/lib/firestore'
import type { RestaurantTable } from '@/types'

interface Props {
  restaurantId: string
  tables: RestaurantTable[]
  onClose: () => void
}

function todayString(): string {
  return new Date().toISOString().split('T')[0]
}

function currentSlot(): string {
  const now = new Date()
  const h   = now.getHours()
  const m   = now.getMinutes() < 30 ? 0 : 30
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export default function WalkInModal({ restaurantId, tables, onClose }: Props) {
  const [name,    setName]    = useState('')
  const [count,   setCount]   = useState(2)
  const [tableId, setTableId] = useState('')
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const availableTables = tables.filter((t) => t.status === 'available')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (count < 1) { setError('Jumlah tamu minimal 1.'); return }
    setSaving(true)
    try {
      await createReservation({
        restaurantId,
        tableId:    tableId || 'auto',
        userId:     'walk-in',
        guestName:  name.trim() || 'Tamu Walk-in',
        guestPhone: '',
        date:       todayString(),
        timeSlot:   currentSlot(),
        guestCount: count,
        status:     'arrived',
      })
      if (tableId) {
        await updateTableStatus(restaurantId, tableId, 'occupied')
      }
      onClose()
    } catch {
      setError('Gagal mencatat tamu. Coba lagi.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-meja-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-ink flex items-center justify-center">
              <Users size={14} className="text-cream" />
            </div>
            <h2 className="font-display font-semibold text-ink text-lg">Tamu Walk-in</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-sand flex items-center justify-center text-ink/60 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-sans font-medium text-ink/60 mb-1.5">
              Nama tamu <span className="text-ink/30">(opsional)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tamu Walk-in"
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl border border-meja-border text-ink font-sans text-sm placeholder:text-ink/30 focus:outline-none focus:border-gold/60 transition-colors"
            />
          </div>

          {/* Guest count — tap buttons for speed */}
          <div>
            <label className="block text-xs font-sans font-medium text-ink/60 mb-2">
              Jumlah tamu
            </label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCount(n)}
                  className={`w-10 h-10 rounded-xl text-sm font-sans font-bold border transition-colors
                    ${count === n
                      ? 'bg-ink text-cream border-ink'
                      : 'bg-white text-ink/60 border-meja-border hover:bg-sand'
                    }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Table picker — only available tables */}
          <div>
            <label className="block text-xs font-sans font-medium text-ink/60 mb-2">
              Meja <span className="text-ink/30">(opsional)</span>
            </label>
            {availableTables.length === 0 ? (
              <p className="text-xs font-sans text-ink/40">Tidak ada meja kosong saat ini.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {availableTables.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTableId(tableId === t.id ? '' : t.id)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-sans font-medium border transition-colors
                      ${tableId === t.id
                        ? 'bg-ink text-cream border-ink'
                        : 'bg-forest-light text-forest border-forest/30 hover:bg-forest/20'
                      }`}
                  >
                    <span>{t.tableNumber}</span>
                    <span className="opacity-60 text-[9px]">{t.capacity}p</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm font-sans text-terra bg-terra-light rounded-xl px-3.5 py-2.5">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-meja-border text-sm font-sans text-ink/60 hover:bg-sand transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-ink text-cream text-sm font-sans font-medium hover:bg-ink/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving && <Loader2 size={13} className="animate-spin" />}
              {saving ? 'Menyimpan…' : 'Dudukkan →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
