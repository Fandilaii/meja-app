'use client'

import { useState } from 'react'
import { MessageCircle, Clock } from 'lucide-react'
import type { WaitlistEntry } from '@/types'

interface Props {
  waitlist: WaitlistEntry[]
}

function minutesAgo(d: Date): string {
  const mins = Math.floor((Date.now() - d.getTime()) / 60_000)
  if (mins < 1)  return 'Baru saja'
  if (mins < 60) return `${mins} mnt lalu`
  return `${Math.floor(mins / 60)} jam lalu`
}

export default function WaitlistPanel({ waitlist }: Props) {
  const [notified, setNotified] = useState<Set<string>>(new Set())

  async function handleNotify(entry: WaitlistEntry) {
    setNotified((prev) => new Set(prev).add(entry.id))
    try {
      await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone:   entry.guestPhone,
          message: `Halo ${entry.guestName}! 👋 Meja untukmu sudah tersedia. Silakan masuk dalam 10 menit ya. — Tim Meja`,
        }),
      })
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-meja-border overflow-hidden">
      <div className="px-4 py-3 border-b border-meja-border flex items-center justify-between">
        <h3 className="font-display font-medium text-ink text-base">Waitlist</h3>
        <span className="text-xs font-sans text-ink/60 bg-sand rounded-full px-2 py-0.5">
          {waitlist.filter((w) => w.status === 'waiting').length} menunggu
        </span>
      </div>

      <div className="divide-y divide-meja-border/50">
        {waitlist.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm font-sans text-ink/60">Waitlist kosong</p>
          </div>
        ) : (
          waitlist.map((entry, idx) => {
            const isNotified = notified.has(entry.id) || entry.status === 'notified'
            return (
              <div key={entry.id} className="flex items-center gap-3 px-4 py-3">
                {/* Position */}
                <div className="w-7 h-7 rounded-full bg-sand flex items-center justify-center flex-shrink-0">
                  <span className="text-[11px] font-display font-bold text-ink">{idx + 1}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-sans font-medium text-ink truncate">{entry.guestName}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Clock size={10} className="text-ink/60" />
                    <span className="text-[10px] font-sans text-ink/60">{minutesAgo(entry.joinedAt)}</span>
                  </div>
                </div>

                {/* Guest count */}
                <span className="text-[11px] font-sans text-ink/60 bg-sand rounded-full px-2 py-0.5 flex-shrink-0">
                  {entry.guestCount} tamu
                </span>

                {/* Notify button */}
                <button
                  onClick={() => handleNotify(entry)}
                  disabled={isNotified}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors flex-shrink-0
                    ${isNotified
                      ? 'bg-forest-light text-forest cursor-default'
                      : 'bg-gold text-white hover:bg-gold-dark'
                    }`}
                >
                  <MessageCircle size={13} />
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
