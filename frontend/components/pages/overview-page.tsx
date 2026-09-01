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
      <div className="stagger-item" style={{ ['--stagger-i' as string]: 0 }}>
        <CaseHeader />
      </div>
      <div className="stagger-item" style={{ ['--stagger-i' as string]: 1 }}>
        <ContradictionAlert />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <div className="stagger-item" style={{ ['--stagger-i' as string]: 2 }}>
            <CaseTimeline />
          </div>
          <div className="stagger-item" style={{ ['--stagger-i' as string]: 3 }}>
            <LocationAnalysis />
          </div>
        </div>
        <div className="space-y-5">
          <div className="stagger-item" style={{ ['--stagger-i' as string]: 2 }}>
            <EvidencePanel />
          </div>
          <div className="stagger-item" style={{ ['--stagger-i' as string]: 3 }}>
            <AiTransparency />
          </div>
          <div className="stagger-item" style={{ ['--stagger-i' as string]: 4 }}>
            <AuditTrail />
          </div>
        </div>
      </div>
    </div>
  )
}
