import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, UserCheck, FileSearch, Gauge } from 'lucide-react'

export function AiTransparency() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Sparkles className="size-4" />
          </div>
          <div>
            <CardTitle>AI assists. Humans decide.</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              How the analysis layer is kept accountable
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5">
        <p className="rounded-lg border border-primary/25 bg-primary/[0.05] px-3 py-2.5 text-[13px] leading-relaxed text-foreground">
          Every AI finding is labelled{' '}
          <span className="font-mono text-[11px] font-semibold text-primary">
            HYPOTHESIS — REQUIRES HUMAN REVIEW
          </span>{' '}
          and remains outside the verified case record until an officer confirms
          it.
        </p>

        <Item
          icon={FileSearch}
          title="Source evidence attached"
          body="Each finding cites the exact statements, footage, or records it was derived from."
        />
        <Item
          icon={Gauge}
          title="Confidence score shown"
          body="A calibrated score accompanies every inference — never presented as certainty."
        />
        <Item
          icon={UserCheck}
          title="Officer response required"
          body="Findings are confirmed, dismissed, or escalated by a human, and the decision is logged."
        />
      </CardContent>
    </Card>
  )
}

function Item({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ElementType
  title: string
  body: string
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-border bg-card/40 p-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-[13px] font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
          {body}
        </p>
      </div>
    </div>
  )
}
