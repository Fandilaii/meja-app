import type { RestaurantTable } from '@/types'

interface Props {
  tables: RestaurantTable[]
}

const STATE_CONFIG = {
  available: { bg: 'bg-forest-light', text: 'text-forest',   label: 'Kosong'    },
  reserved:  { bg: 'bg-gold-light',   text: 'text-gold-dark', label: 'Reservasi' },
  occupied:  { bg: 'bg-terra-light',  text: 'text-terra',    label: 'Terisi'    },
}

export default function TableMap({ tables }: Props) {
  return (
    <div className="bg-white rounded-xl border border-meja-border overflow-hidden">
      <div className="px-4 py-3 border-b border-meja-border flex items-center justify-between">
        <h3 className="font-display font-medium text-ink text-base">Peta Meja</h3>
        <div className="flex items-center gap-3">
          {Object.entries(STATE_CONFIG).map(([key, { bg, text, label }]) => (
            <div key={key} className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${bg} border border-current ${text}`} />
              <span className="text-[10px] font-sans text-muted">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 grid grid-cols-3 gap-2">
        {tables.map((table) => {
          const { bg, text } = STATE_CONFIG[table.status]
          return (
            <div
              key={table.id}
              className={`rounded-xl p-3 flex flex-col items-center gap-1 border ${bg} border-current/20`}
            >
              <span className={`font-display font-bold text-sm ${text}`}>{table.tableNumber}</span>
              <span className={`text-[10px] font-sans ${text} opacity-70`}>{table.capacity} kursi</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
