import type { Reservation } from '@/types'

interface Props {
  reservations: Reservation[]
  restaurantName: string
}

const STATUS_COLORS: Record<string, string> = {
  arrived:   'bg-forest-light border-forest/20',
  confirmed: 'bg-blue-50 border-blue-200',
  pending:   'bg-gold-light border-gold/20',
}

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  arrived:   { bg: 'bg-forest-light',  text: 'text-forest',   label: 'Hadir'      },
  confirmed: { bg: 'bg-blue-100',      text: 'text-blue-700', label: 'Konfirmasi' },
  pending:   { bg: 'bg-gold-light',    text: 'text-gold-dark', label: 'Baru'      },
  cancelled: { bg: 'bg-terra-light',   text: 'text-terra',    label: 'Batal'      },
}

function generateSlots(): string[] {
  const slots: string[] = []
  for (let h = 17; h < 23; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
    slots.push(`${String(h).padStart(2, '0')}:30`)
  }
  return slots
}

export default function BookingTimeline({ reservations }: Props) {
  const slots = generateSlots()

  return (
    <div className="bg-white rounded-xl border border-meja-border overflow-hidden">
      <div className="px-4 py-3 border-b border-meja-border">
        <h3 className="font-display font-medium text-ink text-base">Timeline Malam Ini</h3>
      </div>
      <div className="overflow-y-auto max-h-[480px]">
        {slots.map((slot) => {
          const slotReservations = reservations.filter((r) => r.timeSlot === slot)
          return (
            <div key={slot} className="flex gap-3 px-4 py-2.5 border-b border-meja-border/50 last:border-0">
              <span className="w-11 flex-shrink-0 text-[10px] font-mono text-muted pt-0.5">{slot}</span>
              <div className="flex-1 space-y-1.5">
                {slotReservations.length === 0 ? (
                  <div className="h-6 flex items-center">
                    <span className="text-[11px] text-muted/40 font-sans">—</span>
                  </div>
                ) : (
                  slotReservations.map((res) => {
                    const color   = STATUS_COLORS[res.status] ?? 'bg-sand border-meja-border'
                    const badge   = STATUS_BADGE[res.status]
                    return (
                      <div
                        key={res.id}
                        className={`flex items-center justify-between rounded-lg px-3 py-1.5 border ${color}`}
                      >
                        <div>
                          <span className="text-[11px] font-sans font-bold text-ink">{res.guestName}</span>
                          <span className="text-[10px] font-sans text-muted ml-2">
                            Meja {res.tableId !== 'auto' ? res.tableId : '—'} · {res.guestCount} tamu
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-sans px-2 py-0.5 rounded-full ${badge?.bg} ${badge?.text}`}>
                            {badge?.label}
                          </span>
                          <span className="text-[10px] font-sans text-muted bg-meja-border/50 rounded-full px-1.5 py-0.5">
                            {res.guestCount}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
