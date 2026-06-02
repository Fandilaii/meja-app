import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface Props {
  label:    string
  value:    string | number
  subtitle: string
  delta?:   number   // positive = up, negative = down, undefined = neutral
}

export default function StatCard({ label, value, subtitle, delta }: Props) {
  const isUp     = delta !== undefined && delta > 0
  const isDown   = delta !== undefined && delta < 0
  const isNeutral = delta === undefined || delta === 0

  return (
    <div className="bg-white border border-meja-border rounded-xl p-4">
      <p className="text-[10px] font-sans font-medium uppercase tracking-wider text-ink/60 mb-3">
        {label}
      </p>
      <p className="font-display font-bold text-[28px] text-ink leading-none mb-1">
        {value}
      </p>
      <div className="flex items-center gap-1.5 mt-2">
        {isUp     && <TrendingUp  size={12} className="text-forest" />}
        {isDown   && <TrendingDown size={12} className="text-terra"  />}
        {isNeutral && <Minus       size={12} className="text-ink/60"  />}
        <span className={`text-[11px] font-sans ${isUp ? 'text-forest' : isDown ? 'text-terra' : 'text-ink/60'}`}>
          {subtitle}
        </span>
      </div>
    </div>
  )
}
