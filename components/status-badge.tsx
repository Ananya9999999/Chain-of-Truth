import { cn } from '@/lib/utils'
import { BadgeCheck, CircleDashed, Sparkles } from 'lucide-react'
import type { VerificationStatus } from '@/lib/mock-data'

const config: Record<
  VerificationStatus,
  { label: string; className: string; icon: React.ElementType; dotClass: string }
> = {
  verified: {
    label: 'VERIFIED RECORD',
    className: 'bg-success/[0.08] text-success border-success/35 shadow-xs',
    icon: BadgeCheck,
    dotClass: 'bg-success',
  },
  unverified: {
    label: 'UNVERIFIED PENDING',
    className: 'bg-warning/[0.08] text-warning border-warning/35 shadow-xs',
    icon: CircleDashed,
    dotClass: 'bg-warning',
  },
  'ai-extracted': {
    label: 'AI HYPOTHESIS • UNVERIFIED',
    className: 'bg-primary/[0.08] text-primary border-primary/35 shadow-xs',
    icon: Sparkles,
    dotClass: 'bg-primary',
  },
}

export function StatusBadge({
  status,
  className,
}: {
  status: VerificationStatus
  className?: string
}) {
  const { label, className: statusClass, icon: Icon, dotClass } = config[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[9.5px] font-semibold tracking-wider uppercase backdrop-blur-xs',
        statusClass,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', dotClass)} />
      <Icon className="size-3 shrink-0" />
      <span>{label}</span>
    </span>
  )
}

