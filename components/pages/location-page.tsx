import { PageHeader } from '@/components/pages/page-header'
import { LocationAnalysis } from '@/components/location-analysis'
import { searchLocations } from '@/lib/mock-data'
import { Info, MapPin } from 'lucide-react'

export function LocationPage() {
  const top = [...searchLocations].sort((a, b) => b.priority - a.priority)[0]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Geospatial Priority Analysis"
        description="Transparent search-priority ranking calculated from verified CCTV timestamps, ANPR pings, and witness reports using deterministic factor weighting."
        meta={
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-secondary/80 px-2.5 py-1 font-mono text-[10.5px] font-semibold text-muted-foreground shadow-xs">
            <MapPin className="size-3 text-primary" />
            Rule-based Heuristic
          </span>
        }
      />

      <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/[0.04] p-4 text-xs leading-relaxed shadow-xs">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="text-muted-foreground">
          <span className="font-semibold text-foreground">
            Formulation: Priority Score = (Recency Weight × 0.45) + (Location Reliability × 0.35) + (Corroborating Artifacts × 0.20).
          </span>{' '}
          Highest current active sector is{' '}
          <span className="font-bold text-foreground">{top.name}</span> with a composite priority of{' '}
          <span className="font-mono font-bold text-primary">
            {top.priority}/100
          </span>
          . Officers maintain full override capability over algorithmic recommendations.
        </p>
      </div>

      <LocationAnalysis />
    </div>
  )
}

