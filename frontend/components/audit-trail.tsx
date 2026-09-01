import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { auditTrail } from '@/lib/mock-data'
import { Eye, ShieldCheck, Upload, Sparkles } from 'lucide-react'

function actionIcon(action: string): React.ElementType {
  if (action.startsWith('Viewed')) return Eye
  if (action.startsWith('Reviewed')) return ShieldCheck
  if (action.startsWith('Uploaded')) return Upload
  return Sparkles
}

export function AuditTrail() {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Audit Trail</CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Immutable access log · most recent
          </p>
        </div>
        <button className="text-xs font-medium text-primary hover:underline">
          Full log
        </button>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1">
          {auditTrail.map((entry) => {
            const Icon = actionIcon(entry.action)
            return (
              <li
                key={entry.id}
                className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-secondary/50"
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                  <Icon className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-foreground">
                    {entry.action}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    <span className="text-foreground/80">{entry.actor}</span> ·{' '}
                    {entry.role}
                  </p>
                </div>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {entry.time}
                </span>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
