import { CaseHeader } from '@/components/case-header'
import { CaseTimeline } from '@/components/case-timeline'
import { ContradictionAlert } from '@/components/contradiction-alert'
import { EvidencePanel } from '@/components/evidence-panel'
import { LocationAnalysis } from '@/components/location-analysis'
import { AiTransparency } from '@/components/ai-transparency'
import { AuditTrail } from '@/components/audit-trail'

export function OverviewPage() {
  return (
    <div className="space-y-5">
      <CaseHeader />
      <ContradictionAlert />

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <CaseTimeline />
          <LocationAnalysis />
        </div>
        <div className="space-y-5">
          <EvidencePanel />
          <AiTransparency />
          <AuditTrail />
        </div>
      </div>
    </div>
  )
}
