'use client'

interface Props {
  slots: string[]
  disabledSlots: string[]
  nearlyFullSlots?: string[]
  selected: string | null
  onChange: (slot: string) => void
}

export default function TimeSlotPicker({ slots, disabledSlots, nearlyFullSlots = [], selected, onChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {slots.map((slot) => {
        const disabled    = disabledSlots.includes(slot)
        const nearlyFull  = !disabled && nearlyFullSlots.includes(slot)
        const isSelected  = selected === slot

        return (
          <button
            key={slot}
            type="button"
            disabled={disabled}
            onClick={() => onChange(slot)}
            className={`py-2 px-3 rounded-lg text-sm font-sans font-medium transition-colors
              ${disabled
                ? 'bg-sand text-ink/30 cursor-not-allowed line-through'
                : isSelected
                  ? 'bg-ink text-cream border border-ink'
                  : nearlyFull
                    ? 'bg-gold-light border border-gold/40 text-ink hover:border-gold'
                    : 'bg-white border border-meja-border text-ink hover:border-gold'
              }`}
          >
            {slot}
            {nearlyFull && !isSelected && (
              <span className="block text-[9px] font-sans text-[#5C3E10] mt-0.5 leading-none">
                Hampir penuh
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
