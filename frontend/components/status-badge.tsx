import { cn } from '@/lib/utils'
import { BadgeCheck, CircleDashed, Sparkles } from 'lucide-react'
import type { VerificationStatus } from '@/lib/mock-data'

const config: Record<
  VerificationStatus,
  { label: string; className: string; icon: React.ElementType }
> = {
  verified: {
    label: 'VERIFIED',
    className: 'bg-success/12 text-success border-success/30',
    icon: BadgeCheck,
  },
  unverified: {
    label: 'UNVERIFIED',
    className: 'bg-warning/12 text-warning border-warning/30',
    icon: CircleDashed,
  },
  'ai-extracted': {
    label: 'AI-EXTRACTED • UNVERIFIED',
    className: 'bg-primary/12 text-primary border-primary/30',
    icon: Sparkles,
  },
}

export function StatusBadge({
  status,
  className,
}: {
  status: VerificationStatus
  className?: string
}) {
  const { label, className: statusClass, icon: Icon } = config[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wide uppercase',
        statusClass,
        className,
      )}
    >
      <Icon className="size-3" />
      {label}
    </span>
  )
}
