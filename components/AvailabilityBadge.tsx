import type { AvailabilityStatus } from '@/types'

interface Props {
  status: AvailabilityStatus
  className?: string
}

const statusConfig: Record<AvailabilityStatus, { bg: string; text: string }> = {
  Tersedia:     { bg: 'bg-forest-light', text: 'text-forest' },
  'Hampir penuh': { bg: 'bg-gold-light',   text: 'text-gold-dark' },
  Penuh:        { bg: 'bg-terra-light',  text: 'text-terra' },
}

export default function AvailabilityBadge({ status, className = '' }: Props) {
  const { bg, text } = statusConfig[status]
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-pill text-[11px] font-medium font-sans ${bg} ${text} ${className}`}
    >
      {status}
    </span>
  )
}
