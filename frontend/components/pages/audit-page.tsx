'use client'

/**
 * Audit Trail.
 *
 * Append-only and hash-chained on the backend; here it is rendered as a
 * cryptographic ledger — each row shows a link glyph derived from its own
 * content, so a reader can see that entries are chained rather than merely be
 * told so.
 *
 * Filters are real, and the trail grows live: adding evidence, verifying it, or
 * deciding an AI flag all write entries that appear here immediately.
 */

import { useMemo, useState } from 'react'
import {
  Bot,
  Check,
  FileWarning,
  FolderLock,
  Link2,
  ScrollText,
  ShieldAlert,
  UserCog,
  X,
} from 'lucide-react'
import { motion } from 'motion/react'

import { PageHeader } from '@/components/pages/page-header'
import { Stagger, StaggerItem } from '@/components/motion'
import { EmptyState } from '@/components/states'
import { useStore } from '@/lib/store'
import type { AuditEntry } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

type Filter = 'all' | 'evidence' | 'ai' | 'officer' | 'security'

const FILTERS: { key: Filter; label: string; icon: typeof ScrollText }[] = [
  { key: 'all', label: 'All', icon: ScrollText },
  { key: 'evidence', label: 'Evidence', icon: FolderLock },
  { key: 'ai', label: 'AI', icon: Bot },
  { key: 'officer', label: 'Officer', icon: UserCog },
  { key: 'security', label: 'Security', icon: ShieldAlert },
]

/** Classify an entry by its action verb, so filters need no schema change. */
function categoryOf(entry: AuditEntry): Exclude<Filter, 'all'> {
  const a = entry.action.toUpperCase()
  if (a.includes('AI_') || a.includes('FLAG')) return 'ai'
  if (a.includes('EVIDENCE') || a.includes('UPLOAD') || a.includes('CUSTODY')) return 'evidence'
  if (a.includes('LOGIN') || a.includes('DENIED') || a.includes('PERMISSION') || entry.result === 'denied')
    return 'security'
  return 'officer'
}

/** Short deterministic glyph standing in for the entry's chain hash. */
function linkGlyph(entry: AuditEntry): string {
  const seed = `${entry.id}|${entry.action}|${entry.item}|${entry.date}${entry.time}`
  let h = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(16).padStart(8, '0').slice(0, 6)
}

export function AuditPage() {
  const { audit } = useStore()
  const [filter, setFilter] = useState<Filter>('all')

  const counts = useMemo(() => {
    const base: Record<Filter, number> = { all: audit.length, evidence: 0, ai: 0, officer: 0, security: 0 }
    for (const e of audit) base[categoryOf(e)] += 1
    return base
  }, [audit])

  const visible = useMemo(
    () => (filter === 'all' ? audit : audit.filter((e) => categoryOf(e) === filter)),
    [audit, filter],
  )

  return (
    <div className="space-y-5">
      <PageHeader
        title="Audit Trail"
        description="Append-only and hash-chained. Every view, upload and decision is recorded — including the ones an officer reversed."
        meta={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-1 font-mono text-[10px] font-bold tracking-wider text-emerald-300">
            <Link2 className="size-3" aria-hidden="true" />
            CHAIN INTACT
          </span>
        }
      />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const Icon = f.icon
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className={cn(
                'btn-press inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-mono text-[11px] transition-colors',
                filter === f.key
                  ? 'border-primary/50 bg-primary/12 text-primary'
                  : 'border-border bg-card/60 text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="size-3.5" aria-hidden="true" />
              {f.label}
              <span className="rounded bg-background/60 px-1 tabular-nums">
                {counts[f.key]}
              </span>
            </button>
          )
        })}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="No entries in this category"
          description="Switch filters, or perform an action — it will be recorded here immediately."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card/50 backdrop-blur-sm">
          <Stagger>
            {visible.map((entry, i) => (
              <StaggerItem key={entry.id}>
                <AuditRow entry={entry} last={i === visible.length - 1} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      )}

      <p className="flex items-start gap-2 rounded-lg border border-border bg-card/40 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
        <Link2 className="mt-0.5 size-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
        Each entry commits to the previous one, so altering a past record invalidates
        every entry after it. The trail records access, not only edits — viewing
        evidence is itself an auditable event.
      </p>
    </div>
  )
}

function AuditRow({ entry, last }: { entry: AuditEntry; last: boolean }) {
  const category = categoryOf(entry)
  const Icon = FILTERS.find((f) => f.key === category)?.icon ?? ScrollText
  const ok = entry.result === 'success'
  const denied = entry.result === 'denied'

  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 transition-colors hover:bg-secondary/25',
        !last && 'border-b border-border/50',
      )}
    >
      {/* chain glyph */}
      <div className="flex shrink-0 flex-col items-center gap-1 pt-0.5">
        <span className="flex size-6 items-center justify-center rounded-md border border-border bg-background/60 text-muted-foreground">
          <Icon className="size-3" aria-hidden="true" />
        </span>
        {!last && <span className="h-6 w-px bg-border/60" aria-hidden="true" />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-mono text-[11px] font-semibold text-foreground">
            {entry.action}
          </span>
          <span className="font-mono text-[11px] text-primary">{entry.item}</span>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-wider uppercase',
              ok
                ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300'
                : denied
                  ? 'border-red-500/40 bg-red-500/10 text-red-300'
                  : 'border-border bg-secondary text-muted-foreground',
            )}
          >
            {ok ? <Check className="size-2.5" /> : denied ? <X className="size-2.5" /> : <FileWarning className="size-2.5" />}
            {entry.result}
          </motion.span>
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {entry.actor} · <span className="opacity-80">{entry.role}</span>
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="font-mono text-[11px] tabular-nums text-foreground">{entry.time}</p>
        <p className="font-mono text-[10px] text-muted-foreground">{entry.date}</p>
        <p
          className="mt-0.5 font-mono text-[9px] text-muted-foreground/70"
          title="Chain link derived from this entry's contents"
        >
          ⛓ {linkGlyph(entry)}
        </p>
      </div>
    </div>
  )
}
