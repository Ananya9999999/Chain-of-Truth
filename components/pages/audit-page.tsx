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
  success: 'border-success/35 bg-success/10 text-success font-semibold',
  denied: 'border-danger/35 bg-danger/10 text-danger font-bold',
  info: 'border-border/80 bg-secondary/80 text-muted-foreground',
}

export function AuditPage() {
  const denied = auditTrail.filter((e) => e.result === 'denied').length

  return (
    <div className="space-y-5">
      <PageHeader
        title="Immutable Audit Ledger"
        description="Append-only cryptographic record of every interaction, credential verification, and automated background analysis executed against this case repository."
        meta={
          <>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-secondary/80 px-2.5 py-1 font-mono text-[10.5px] font-semibold text-muted-foreground shadow-xs">
              <Lock className="size-3 text-primary" />
              Cryptographic WORM
            </span>
            {denied > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-danger/35 bg-danger/10 px-2.5 py-1 font-mono text-[10.5px] font-semibold text-danger shadow-xs">
                <Ban className="size-3" />
                {denied} Access Denied
              </span>
            )}
          </>
        }
      />

      <div className="overflow-hidden rounded-xl border border-border/80 bg-card/60 shadow-sm backdrop-blur-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border/80 bg-secondary/50 font-mono text-[9.5px] tracking-wider text-muted-foreground uppercase select-none">
                <th className="px-4 py-3 font-semibold">Actor / Entity</th>
                <th className="px-4 py-3 font-semibold">Operation Executed</th>
                <th className="px-4 py-3 font-semibold">Target Entity</th>
                <th className="px-4 py-3 font-semibold">Audit Timestamp</th>
                <th className="px-4 py-3 font-semibold">Security Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 font-sans">
              {auditTrail.map((entry) => {
                const Icon = actionIcon(entry)
                return (
                  <tr
                    key={entry.id}
                    className="transition-colors hover:bg-secondary/40"
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground text-xs">
                        {entry.actor}
                      </p>
                      <p className="font-mono text-[10px] text-muted-foreground">
                        {entry.role}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2 text-foreground font-medium text-xs">
                        <Icon className="size-3 text-primary shrink-0" />
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[11px] text-foreground/80 rounded bg-secondary/70 border border-border/60 px-1.5 py-0.5">
                        {entry.item}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                      {entry.date} · {entry.time}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-[9.5px] tracking-wider uppercase ${resultStyle[entry.result]}`}
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

