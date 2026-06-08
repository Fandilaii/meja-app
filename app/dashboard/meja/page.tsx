'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { Plus, X, Loader2, Pencil, Trash2 } from 'lucide-react'
import {
  subscribeToTables,
  addRestaurantTable,
  updateTableStatus,
  deleteRestaurantTable,
} from '@/lib/firestore'
import type { RestaurantTable } from '@/types'

const RESTAURANT_ID = 'P3R1nyDl8sqYukKkculP'

const STATUS_CONFIG = {
  available: { bg: 'bg-forest-light', border: 'border-forest/30', text: 'text-forest',    dot: 'bg-forest',    label: 'Kosong'    },
  reserved:  { bg: 'bg-gold-light',   border: 'border-gold/30',   text: 'text-gold-dark',  dot: 'bg-gold',      label: 'Reservasi' },
  occupied:  { bg: 'bg-terra-light',  border: 'border-terra/30',  text: 'text-[#7A2E12]',  dot: 'bg-terra',     label: 'Terisi'    },
} as const

const STATUS_ACTIONS: { status: RestaurantTable['status']; label: string; style: string }[] = [
  { status: 'available', label: 'Kosong',    style: 'bg-forest-light text-forest border border-forest/30 hover:bg-forest/15' },
  { status: 'reserved',  label: 'Reservasi', style: 'bg-gold-light text-gold-dark border border-gold/30 hover:bg-gold/15'    },
  { status: 'occupied',  label: 'Terisi',    style: 'bg-terra-light text-[#7A2E12] border border-terra/30 hover:bg-terra/15' },
]

export default function MejaPage() {
  const [tables,      setTables]      = useState<RestaurantTable[]>([])
  const [loading,     setLoading]     = useState(true)
  const [selected,    setSelected]    = useState<string | null>(null)
  const [updating,    setUpdating]    = useState<string | null>(null)
  const [deleting,    setDeleting]    = useState<string | null>(null)
  const [showModal,   setShowModal]   = useState(false)
  const [addLoading,  setAddLoading]  = useState(false)
  const [tableNum,    setTableNum]    = useState('')
  const [capacity,    setCapacity]    = useState('')
  const [addError,    setAddError]    = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsub = subscribeToTables(RESTAURANT_ID, (data) => {
      setTables(data)
      setLoading(false)
    })
    return unsub
  }, [])

  // Close panel on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setSelected(null)
      }
    }
    if (selected) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [selected])

  async function handleStatusChange(tableId: string, status: RestaurantTable['status']) {
    setUpdating(tableId)
    try {
      await updateTableStatus(RESTAURANT_ID, tableId, status)
      setSelected(null)
    } finally {
      setUpdating(null)
    }
  }

  async function handleDelete(tableId: string) {
    setDeleting(tableId)
    try {
      await deleteRestaurantTable(RESTAURANT_ID, tableId)
      setSelected(null)
    } finally {
      setDeleting(null)
    }
  }

  async function handleAddTable(e: React.FormEvent) {
    e.preventDefault()
    setAddError(null)
    if (!tableNum.trim()) { setAddError('Nomor meja wajib diisi.'); return }
    const cap = parseInt(capacity, 10)
    if (isNaN(cap) || cap < 1 || cap > 20) { setAddError('Kapasitas harus 1–20.'); return }
    const exists = tables.some((t) => t.tableNumber.toLowerCase() === tableNum.trim().toLowerCase())
    if (exists) { setAddError('Nomor meja sudah ada.'); return }

    setAddLoading(true)
    try {
      await addRestaurantTable(RESTAURANT_ID, { tableNumber: tableNum.trim(), capacity: cap })
      setTableNum('')
      setCapacity('')
      setShowModal(false)
    } catch {
      setAddError('Gagal menambah meja. Coba lagi.')
    } finally {
      setAddLoading(false)
    }
  }

  const counts = {
    available: tables.filter((t) => t.status === 'available').length,
    reserved:  tables.filter((t) => t.status === 'reserved').length,
    occupied:  tables.filter((t) => t.status === 'occupied').length,
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-ink text-2xl">Meja</h1>
          <p className="text-sm font-sans text-ink/60 mt-0.5">
            Kelola status meja secara real-time
          </p>
        </div>
        <button
          onClick={() => { setShowModal(true); setAddError(null) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-ink text-cream font-sans text-sm font-medium hover:bg-ink/90 transition-colors"
        >
          <Plus size={15} />
          Tambah Meja
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {Object.entries(STATUS_CONFIG).map(([key, { bg, border, text, dot, label }]) => (
          <div key={key} className={`rounded-xl px-4 py-3 border ${bg} ${border} flex items-center gap-3`}>
            <div className={`w-2.5 h-2.5 rounded-full ${dot}`} />
            <div>
              <p className={`text-xl font-display font-bold ${text}`}>
                {counts[key as keyof typeof counts]}
              </p>
              <p className={`text-[11px] font-sans ${text} opacity-80`}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-gold" />
        </div>
      ) : tables.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-sand flex items-center justify-center text-3xl mb-4">🪑</div>
          <p className="font-display font-medium text-ink mb-1">Belum ada meja</p>
          <p className="text-sm font-sans text-ink/60">Tambah meja pertama untuk mulai kelola</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3" ref={panelRef}>
          {tables.map((table) => {
            const cfg       = STATUS_CONFIG[table.status]
            const isSelected = selected === table.id
            const isBusy     = updating === table.id || deleting === table.id

            return (
              <div key={table.id} className="flex flex-col gap-2">
                {/* Table chip */}
                <button
                  onClick={() => setSelected(isSelected ? null : table.id)}
                  disabled={isBusy}
                  className={`relative rounded-xl p-3 border flex flex-col items-center gap-1.5 transition-all
                    ${cfg.bg} ${cfg.border}
                    ${isSelected ? 'ring-2 ring-ink/20 scale-95' : 'hover:scale-95'}
                    ${isBusy ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {isBusy && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/60">
                      <Loader2 size={14} className="animate-spin text-ink/60" />
                    </div>
                  )}
                  <span className={`font-display font-bold text-sm ${cfg.text}`}>{table.tableNumber}</span>
                  <span className={`text-[10px] font-sans ${cfg.text} opacity-70`}>{table.capacity} kursi</span>
                  <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                </button>

                {/* Inline status panel */}
                {isSelected && (
                  <div className="bg-white border border-meja-border rounded-xl p-2.5 shadow-lg flex flex-col gap-1.5 col-span-1">
                    <p className="text-[9px] font-sans font-medium text-ink/50 uppercase tracking-wider px-1 mb-0.5">
                      Ubah status
                    </p>
                    {STATUS_ACTIONS.map(({ status, label, style }) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(table.id, status)}
                        disabled={table.status === status}
                        className={`w-full px-2.5 py-1.5 rounded-lg text-[11px] font-sans font-medium transition-colors
                          ${table.status === status ? 'opacity-40 cursor-default' : style}`}
                      >
                        {label}
                      </button>
                    ))}
                    <div className="border-t border-meja-border/50 mt-1 pt-1">
                      <button
                        onClick={() => handleDelete(table.id)}
                        className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-sans text-terra hover:bg-terra-light transition-colors"
                      >
                        <Trash2 size={11} />
                        Hapus
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add Table Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-meja-border">
              <h2 className="font-display font-semibold text-ink text-lg">Tambah Meja</h2>
              <button
                onClick={() => { setShowModal(false); setTableNum(''); setCapacity(''); setAddError(null) }}
                className="w-8 h-8 rounded-full hover:bg-sand flex items-center justify-center text-ink/60 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddTable} className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-xs font-sans font-medium text-ink/60 mb-1.5">
                  Nomor / Nama Meja
                </label>
                <input
                  type="text"
                  value={tableNum}
                  onChange={(e) => setTableNum(e.target.value)}
                  placeholder="Contoh: A1, VIP-1, Meja 5"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-meja-border text-ink font-sans text-sm placeholder:text-ink/30 focus:outline-none focus:border-gold/60 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-sans font-medium text-ink/60 mb-1.5">
                  Kapasitas (orang)
                </label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  min={1}
                  max={20}
                  placeholder="2"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-meja-border text-ink font-sans text-sm placeholder:text-ink/30 focus:outline-none focus:border-gold/60 transition-colors"
                />
              </div>

              {addError && (
                <p className="text-sm font-sans text-terra bg-terra-light rounded-xl px-3.5 py-2.5">
                  {addError}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setTableNum(''); setCapacity(''); setAddError(null) }}
                  className="flex-1 py-2.5 rounded-xl border border-meja-border text-sm font-sans text-ink/60 hover:bg-sand transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex-1 py-2.5 rounded-xl bg-ink text-cream text-sm font-sans font-medium hover:bg-ink/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {addLoading && <Loader2 size={13} className="animate-spin" />}
                  {addLoading ? 'Menyimpan…' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
