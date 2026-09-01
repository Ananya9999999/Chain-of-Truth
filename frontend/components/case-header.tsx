import { caseMeta } from '@/lib/mock-data'
import { Clock, FolderLock, BadgeCheck, Sparkles } from 'lucide-react'

function Stat({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: React.ElementType
  value: number
  label: string
  tone: 'neutral' | 'success' | 'primary'
}) {
  const toneMap = {
    neutral: 'text-foreground',
    success: 'text-success',
    primary: 'text-primary',
  }
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card/60 px-4 py-3">
      <Icon className={`size-4 ${toneMap[tone]}`} />
      <div className="leading-tight">
        <p className={`font-mono text-xl font-semibold ${toneMap[tone]}`}>
          {value}
        </p>
        <p className="text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

export function CaseHeader() {
  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs text-muted-foreground">
              #{caseMeta.id}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/12 px-2.5 py-0.5 text-[11px] font-semibold text-success">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
                <span className="relative inline-flex size-1.5 rounded-full bg-success" />
              </span>
              {caseMeta.status}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-balance text-foreground">
            {caseMeta.title}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            Last updated {caseMeta.lastUpdated}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <Stat
            icon={FolderLock}
            value={caseMeta.evidenceCount}
            label="Evidence items"
            tone="neutral"
          />
          <Stat
            icon={BadgeCheck}
            value={caseMeta.verifiedCount}
            label="Verified"
            tone="success"
          />
          <Stat
            icon={Sparkles}
            value={caseMeta.unverifiedFindings}
            label="Unverified AI findings"
            tone="primary"
          />
        </div>
      </div>
    </div>
  )
}
