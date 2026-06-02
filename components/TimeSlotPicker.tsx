'use client'

interface Props {
  slots: string[]
  disabledSlots: string[]
  selected: string | null
  onChange: (slot: string) => void
}

export default function TimeSlotPicker({ slots, disabledSlots, selected, onChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {slots.map((slot) => {
        const disabled = disabledSlots.includes(slot)
        const isSelected = selected === slot

        return (
          <button
            key={slot}
            type="button"
            disabled={disabled}
            onClick={() => onChange(slot)}
            className={`py-2 px-3 rounded-lg text-sm font-sans font-medium transition-colors
              ${disabled
                ? 'bg-sand text-ink/60 cursor-not-allowed line-through decoration-muted/40'
                : isSelected
                  ? 'bg-ink text-cream border border-ink'
                  : 'bg-white border border-meja-border text-ink hover:border-gold'
              }`}
          >
            {slot}
          </button>
        )
      })}
    </div>
  )
}
