import type { AvailabilityStatus } from '@/types'

interface Props {
  status: AvailabilityStatus
  className?: string
}

const statusConfig: Record<AvailabilityStatus, { bg: string; text: string }> = {
  Tersedia:       { bg: 'bg-forest-light', text: 'text-forest'       }, // 5.1:1 ✓
  'Hampir penuh': { bg: 'bg-gold-light',   text: 'text-[#5C3E10]'    }, // 7.4:1 ✓ (was gold-dark 4.28:1 ✗)
  Penuh:          { bg: 'bg-terra-light',  text: 'text-[#7A2E12]'    }, // 6.9:1 ✓ (was terra 3.30:1 ✗)
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
