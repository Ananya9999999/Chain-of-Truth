'use client'

import { PageHeader } from '@/components/pages/page-header'
import { Link2, ShieldCheck, Hash } from 'lucide-react'
import { chainMock } from '@/lib/mock-agents'
import { cn } from '@/lib/utils'

export function ChainPage() {
  const data = chainMock

  return (
    <div className="page-enter space-y-5">
      <PageHeader
        title="Hash Chain Integrity"
        description="SHA-256 hash chain over evidence events. Cryptographic — not AI. Tampering with any past entry breaks every entry after it."
      />

      <div
        className={cn(
          'animate-pop flex flex-wrap items-center justify-between gap-4 rounded-xl border p-5',
          data.valid
            ? 'border-success/40 bg-success/[0.07]'
            : 'border-danger/40 bg-danger/[0.07]',
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex size-11 items-center justify-center rounded-xl',
              data.valid ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger',
            )}
          >
            {data.valid ? <ShieldCheck className="size-6" /> : <Link2 className="size-6" />}
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">
              {data.valid ? 'Chain Intact' : 'Chain Broken'}
            </p>
            <p className="text-sm text-muted-foreground">{data.message}</p>
          </div>
        </div>
        <div className="font-mono text-xs text-muted-foreground">
          {data.entries} entries · SHA-256
        </div>
      </div>

      <div className="space-y-2">
        {data.hashes.map((h, i) => (
          <div
            key={h.id}
            className="stagger-item hover-lift flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card/50 px-4 py-3"
            style={{ ['--stagger-i' as string]: i }}
          >
            <div className="flex size-8 items-center justify-center rounded-lg bg-secondary">
              <Hash className="size-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">Evidence #{h.id}</p>
              <p className="truncate font-mono text-[11px] text-muted-foreground">
                content {h.file_hash}
              </p>
              <p className="truncate font-mono text-[11px] text-primary/80">
                chain {h.chain_hash}
              </p>
            </div>
            {i > 0 && (
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                linked ← #{data.hashes[i - 1].id}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
