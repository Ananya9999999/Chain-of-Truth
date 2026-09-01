import { PageHeader } from '@/components/pages/page-header'
import { LocationAnalysis } from '@/components/location-analysis'
import { searchLocations } from '@/lib/mock-data'
import { Info } from 'lucide-react'

export function LocationPage() {
  const top = [...searchLocations].sort((a, b) => b.priority - a.priority)[0]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Location Analysis"
        description="Search-priority ranking produced by a transparent, rule-based heuristic — not a machine-learning model. Every score decomposes into three inspectable factors."
        meta={
          <span className="rounded-md border border-border bg-secondary px-2.5 py-1 font-mono text-[11px] font-semibold text-muted-foreground">
            Rule-based · not ML
          </span>
        }
      />

      <div className="flex items-start gap-2.5 rounded-lg border border-primary/25 bg-primary/[0.05] px-4 py-3 text-[13px] leading-relaxed">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">
            Priority = recency × reliability × evidence points.
          </span>{' '}
          Highest current priority is{' '}
          <span className="font-semibold text-foreground">{top.name}</span> at{' '}
          <span className="font-mono font-semibold text-foreground">
            {top.priority}
          </span>
          . Officers can inspect and override any ranking.
        </p>
      </div>

      <LocationAnalysis />
    </div>
  )
}
