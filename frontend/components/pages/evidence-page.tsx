import { PageHeader } from '@/components/pages/page-header'
import { StatusBadge } from '@/components/status-badge'
import { evidenceItems } from '@/lib/mock-data'
import { Hash, Users, ShieldCheck, Check, X } from 'lucide-react'

export function EvidencePage() {
  const verified = evidenceItems.filter((e) => e.status === 'verified').length
  const confirmed = evidenceItems.filter((e) => e.twoPersonConfirmed).length

  return (
    <div className="space-y-5">
      <PageHeader
        title="Evidence"
        description="Every item is sealed with a SHA-256 hash and requires two-person confirmation before it enters the verified case record."
        meta={
          <>
            <span className="rounded-md border border-success/30 bg-success/12 px-2.5 py-1 font-mono text-[11px] font-semibold text-success">
              {verified} verified
            </span>
            <span className="rounded-md border border-border bg-secondary px-2.5 py-1 font-mono text-[11px] font-semibold text-muted-foreground">
              {confirmed}/{evidenceItems.length} two-person
            </span>
          </>
        }
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40 font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
                <th className="px-4 py-3 font-medium">Evidence ID</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Filename</th>
                <th className="px-4 py-3 font-medium">Timestamp</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Uploaded by</th>
                <th className="px-4 py-3 font-medium">SHA-256</th>
                <th className="px-4 py-3 font-medium">2-person</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {evidenceItems.map((ev) => (
                <tr
                  key={ev.id}
                  className="border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/30"
                >
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-foreground">
                    {ev.id}
                  </td>
                  <td className="px-4 py-3 text-foreground">{ev.type}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {ev.filename}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {ev.timestamp}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {ev.location}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {ev.uploadedBy}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs text-success">
                      <Hash className="size-3" />
                      {ev.hash}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {ev.twoPersonConfirmed ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
                        <Check className="size-3.5" /> Confirmed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-warning">
                        <X className="size-3.5" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={ev.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <ShieldCheck className="size-3.5 text-success" />
        Hashes are recomputed nightly by the integrity monitor. Any mismatch
        breaks the chain of custody and locks the item.
        <Users className="ml-2 size-3.5" />
        Two-person confirmation requires two distinct officers.
      </p>
    </div>
  )
}
