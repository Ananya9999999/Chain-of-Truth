import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/status-badge'
import { evidenceItems } from '@/lib/mock-data'
import { Hash, MapPin, User, Users, Video, FileText } from 'lucide-react'

const typeIcon: Record<string, React.ElementType> = {
  'CCTV Footage': Video,
  'Witness Statement': FileText,
  'ANPR Record': Hash,
  Photograph: FileText,
}

export function EvidencePanel() {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Evidence</CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Recent items · cryptographically sealed
          </p>
        </div>
        <button className="text-xs font-medium text-primary hover:underline">
          View all
        </button>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {evidenceItems.map((ev) => {
          const Icon = typeIcon[ev.type] ?? FileText
          return (
            <div
              key={ev.id}
              className="rounded-lg border border-border bg-card/40 p-3.5 transition-colors hover:border-border/80"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                    <Icon className="size-4" />
                  </div>
                  <div className="leading-tight">
                    <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                      {ev.type}
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {ev.id}
                      </span>
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                      {ev.filename}
                    </p>
                  </div>
                </div>
                <StatusBadge status={ev.status} />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-border/60 pt-2.5 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3" /> {ev.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <User className="size-3" /> {ev.uploadedBy}
                </span>
                <span className="flex items-center gap-1.5 font-mono">
                  <Hash className="size-3" /> SHA-256 {ev.hash}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users
                    className={`size-3 ${ev.twoPersonConfirmed ? 'text-success' : 'text-warning'}`}
                  />
                  <span
                    className={
                      ev.twoPersonConfirmed ? 'text-success' : 'text-warning'
                    }
                  >
                    {ev.twoPersonConfirmed
                      ? 'Two-person confirmed'
                      : 'Awaiting 2nd confirm'}
                  </span>
                </span>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
