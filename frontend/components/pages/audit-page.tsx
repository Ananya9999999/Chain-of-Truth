import { PageHeader } from '@/components/pages/page-header'
import { auditTrail, type AuditEntry } from '@/lib/mock-data'
import { Eye, ShieldCheck, Upload, Sparkles, Ban, Check, Lock } from 'lucide-react'

function actionIcon(entry: AuditEntry): React.ElementType {
  if (entry.result === 'denied') return Ban
  if (entry.action.startsWith('Viewed')) return Eye
  if (entry.action.startsWith('Reviewed')) return ShieldCheck
  if (entry.action.startsWith('Uploaded')) return Upload
  if (entry.action.startsWith('Confirmed')) return Check
  if (entry.actor === 'System') return Sparkles
  return ShieldCheck
}

const resultStyle: Record<AuditEntry['result'], string> = {
  success: 'border-success/30 bg-success/12 text-success',
  denied: 'border-danger/30 bg-danger/12 text-danger',
  info: 'border-border bg-secondary text-muted-foreground',
}

export function AuditPage() {
  const denied = auditTrail.filter((e) => e.result === 'denied').length

  return (
    <div className="space-y-5">
      <PageHeader
        title="Audit Trail"
        description="Immutable, append-only log of every access and action taken against the case. Denied attempts are recorded with the same permanence as successful ones."
        meta={
          <>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2.5 py-1 font-mono text-[11px] font-semibold text-muted-foreground">
              <Lock className="size-3.5" />
              Append-only
            </span>
            {denied > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-danger/30 bg-danger/12 px-2.5 py-1 font-mono text-[11px] font-semibold text-danger">
                <Ban className="size-3.5" />
                {denied} denied
              </span>
            )}
          </>
        }
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40 font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
                <th className="px-4 py-3 font-medium">User / Role</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Timestamp</th>
                <th className="px-4 py-3 font-medium">Result</th>
              </tr>
            </thead>
            <tbody>
              {auditTrail.map((entry) => {
                const Icon = actionIcon(entry)
                return (
                  <tr
                    key={entry.id}
                    className="border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/30"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">
                        {entry.actor}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {entry.role}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2 text-foreground">
                        <Icon className="size-3.5 text-muted-foreground" />
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {entry.item}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {entry.date} · {entry.time}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wide uppercase ${resultStyle[entry.result]}`}
                      >
                        {entry.result}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
