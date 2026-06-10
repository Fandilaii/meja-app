'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { Plus, X, MessageCircle, UserCheck, UserX, Clock, Loader2 } from 'lucide-react'
import { subscribeToWaitlist, addToWaitlist, seatWaitlistEntry, removeWaitlistEntry } from '@/lib/firestore'
import type { WaitlistEntry } from '@/types'

const RESTAURANT_ID = 'P3R1nyDl8sqYukKkculP'

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('08')) return '62' + digits.slice(1)
  if (digits.startsWith('8'))  return '62' + digits
  return digits
}

function waitTime(joinedAt: Date): string {
  const mins = Math.floor((Date.now() - joinedAt.getTime()) / 60_000)
  if (mins < 1)  return 'Baru saja'
  if (mins < 60) return `${mins} mnt`
  return `${Math.floor(mins / 60)} jam ${mins % 60} mnt`
}

export default function WaitlistPage() {
  const [entries,   setEntries]   = useState<WaitlistEntry[]>([])
  const [loading,   setLoading]   = useState(true)
  const [acting,    setActing]    = useState<string | null>(null)   // entry id being acted on
  const [notified,  setNotified]  = useState<Set<string>>(new Set())
  const [showForm,  setShowForm]  = useState(false)
  const [name,      setName]      = useState('')
  const [phone,     setPhone]     = useState('')
  const [guests,    setGuests]    = useState('')
  const [formErr,   setFormErr]   = useState<string | null>(null)
  const [formSaving, setFormSaving] = useState(false)

  useEffect(() => {
    const unsub = subscribeToWaitlist(RESTAURANT_ID, (data) => {
      setEntries(data)
      setLoading(false)
    })
    return unsub
  }, [])

  async function handleNotify(entry: WaitlistEntry) {
    setActing(entry.id)
    try {
      await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone:   entry.guestPhone,
          message: `Halo ${entry.guestName}! 👋 Meja untukmu sudah tersedia. Silakan masuk dalam 10 menit ya. — Tim Meja`,
        }),
      })
      setNotified((prev) => new Set(prev).add(entry.id))
    } finally {
      setActing(null)
    }
  }

  async function handleSeat(id: string) {
    setActing(id)
    try { await seatWaitlistEntry(id) }
    finally { setActing(null) }
  }

  async function handleLeave(id: string) {
    setActing(id)
    try { await removeWaitlistEntry(id) }
    finally { setActing(null) }
  }

  async function handleAddGuest(e: React.FormEvent) {
    e.preventDefault()
    setFormErr(null)
    if (!name.trim())  { setFormErr('Nama wajib diisi.'); return }
    if (!phone.trim()) { setFormErr('Nomor WhatsApp wajib diisi.'); return }
    const g = parseInt(guests, 10)
    if (isNaN(g) || g < 1 || g > 20) { setFormErr('Jumlah tamu harus 1–20.'); return }

    setFormSaving(true)
    try {
      await addToWaitlist({
        restaurantId: RESTAURANT_ID,
        userId:       '',
        guestName:    name.trim(),
        guestPhone:   normalizePhone(phone),
        guestCount:   g,
      })
      setName(''); setPhone(''); setGuests('')
      setShowForm(false)
    } catch {
      setFormErr('Gagal menambah. Coba lagi.')
    } finally {
      setFormSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-ink text-2xl">Waitlist</h1>
          <p className="text-sm font-sans text-ink/60 mt-0.5">
            {loading ? 'Memuat…' : `${entries.length} tamu menunggu`}
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setFormErr(null) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-ink text-cream font-sans text-sm font-medium hover:bg-ink/90 transition-colors"
        >
          <Plus size={15} />
          Tambah Tamu
        </button>
      </div>

      {/* Add guest form */}
      {showForm && (
        <div className="bg-white border border-meja-border rounded-2xl p-5 mb-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-ink text-base">Tambah ke Waitlist</h2>
            <button
              onClick={() => { setShowForm(false); setName(''); setPhone(''); setGuests(''); setFormErr(null) }}
              className="w-7 h-7 rounded-full hover:bg-sand flex items-center justify-center text-ink/50 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          <form onSubmit={handleAddGuest} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-sans font-medium text-ink/60 mb-1.5">Nama Tamu</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Budi Santoso"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-meja-border text-ink font-sans text-sm placeholder:text-ink/30 focus:outline-none focus:border-gold/60 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-sans font-medium text-ink/60 mb-1.5">Nomor WhatsApp</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812xxxx"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-meja-border text-ink font-sans text-sm placeholder:text-ink/30 focus:outline-none focus:border-gold/60 transition-colors"
                />
              </div>
            </div>
            <div className="w-32">
              <label className="block text-xs font-sans font-medium text-ink/60 mb-1.5">Jumlah Tamu</label>
              <input
                type="number"
                min={1}
                max={20}
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                placeholder="2"
                className="w-full px-3.5 py-2.5 rounded-xl border border-meja-border text-ink font-sans text-sm placeholder:text-ink/30 focus:outline-none focus:border-gold/60 transition-colors"
              />
            </div>
            {formErr && (
              <p className="text-sm font-sans text-terra bg-terra-light rounded-xl px-3.5 py-2">{formErr}</p>
            )}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setShowForm(false); setName(''); setPhone(''); setGuests(''); setFormErr(null) }}
                className="flex-1 py-2.5 rounded-xl border border-meja-border text-sm font-sans text-ink/60 hover:bg-sand transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={formSaving}
                className="flex-1 py-2.5 rounded-xl bg-ink text-cream text-sm font-sans font-medium hover:bg-ink/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {formSaving && <Loader2 size={13} className="animate-spin" />}
                {formSaving ? 'Menyimpan…' : 'Tambah'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Waitlist */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-gold" />
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-meja-border">
          <div className="w-16 h-16 rounded-2xl bg-sand flex items-center justify-center text-3xl mb-4">⏳</div>
          <p className="font-display font-medium text-ink mb-1">Waitlist kosong</p>
          <p className="text-sm font-sans text-ink/60">Tambah tamu yang menunggu di luar</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-meja-border overflow-hidden">
          {/* Legend */}
          <div className="px-5 py-3 border-b border-meja-border flex items-center gap-1 text-[10px] font-sans text-ink/50 uppercase tracking-wider">
            <span className="w-8">#</span>
            <span className="flex-1">Tamu</span>
            <span className="w-16 text-center">Tamu</span>
            <span className="w-20 text-center">Tunggu</span>
            <span className="w-28 text-right">Aksi</span>
          </div>

          <div className="divide-y divide-meja-border/50">
            {entries.map((entry, idx) => {
              const isBusy     = acting === entry.id
              const isNotified = notified.has(entry.id) || entry.status === 'notified'

              return (
                <div key={entry.id} className={`flex items-center gap-3 px-5 py-3.5 ${isBusy ? 'opacity-60' : ''}`}>
                  {/* Position */}
                  <div className="w-8 h-8 rounded-full bg-sand flex items-center justify-center flex-shrink-0">
                    <span className="text-[11px] font-display font-bold text-ink">{idx + 1}</span>
                  </div>

                  {/* Name + phone */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-sans font-medium text-ink truncate">{entry.guestName}</p>
                    <a
                      href={`https://wa.me/${entry.guestPhone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-sans text-forest hover:underline truncate block"
                    >
                      {entry.guestPhone}
                    </a>
                  </div>

                  {/* Guest count */}
                  <div className="w-16 text-center">
                    <span className="text-xs font-sans text-ink/60 bg-sand rounded-full px-2 py-0.5">
                      {entry.guestCount} org
                    </span>
                  </div>

                  {/* Wait time */}
                  <div className="w-20 text-center flex items-center justify-center gap-1">
                    <Clock size={10} className="text-ink/40 flex-shrink-0" />
                    <span className="text-[11px] font-sans text-ink/60">{waitTime(entry.joinedAt)}</span>
                  </div>

                  {/* Actions */}
                  <div className="w-28 flex items-center justify-end gap-1.5">
                    {/* Notify */}
                    <button
                      onClick={() => handleNotify(entry)}
                      disabled={isBusy || isNotified}
                      title={isNotified ? 'Sudah dikirim' : 'Kirim notifikasi WhatsApp'}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0
                        ${isNotified
                          ? 'bg-forest-light text-forest cursor-default'
                          : 'bg-gold text-white hover:bg-gold-dark'
                        }`}
                    >
                      {isBusy ? <Loader2 size={13} className="animate-spin" /> : <MessageCircle size={13} />}
                    </button>

                    {/* Seat */}
                    <button
                      onClick={() => handleSeat(entry.id)}
                      disabled={isBusy}
                      title="Dudukkan tamu"
                      className="w-8 h-8 rounded-full bg-forest-light text-forest flex items-center justify-center hover:bg-forest/20 transition-colors flex-shrink-0"
                    >
                      {isBusy ? <Loader2 size={13} className="animate-spin" /> : <UserCheck size={13} />}
                    </button>

                    {/* Leave */}
                    <button
                      onClick={() => handleLeave(entry.id)}
                      disabled={isBusy}
                      title="Tandai tidak hadir"
                      className="w-8 h-8 rounded-full bg-terra-light text-[#7A2E12] flex items-center justify-center hover:bg-terra/20 transition-colors flex-shrink-0"
                    >
                      {isBusy ? <Loader2 size={13} className="animate-spin" /> : <UserX size={13} />}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
