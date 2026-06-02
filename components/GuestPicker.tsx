'use client'

interface Props {
  value: number
  onChange: (n: number) => void
  max?: number
}

export default function GuestPicker({ value, onChange, max = 8 }: Props) {
  const options = Array.from({ length: max }, (_, i) => i + 1)

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {options.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`w-9 h-9 rounded-full text-sm font-medium font-sans transition-colors
            ${value === n
              ? 'bg-ink text-cream'
              : 'bg-white border border-meja-border text-ink hover:border-gold'
            }`}
        >
          {n === max ? `${n}+` : n}
        </button>
      ))}
    </div>
  )
}
