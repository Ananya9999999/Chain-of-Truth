'use client'

/**
 * Evidence Vault.
 *
 * Card grid rather than a dense table: each item carries an integrity summary
 * (hash, two-person state, verification status) that a table row cannot show
 * without becoming unreadable. Every button does something — View opens the
 * preview, Verify performs second-officer confirmation and writes to the audit
 * trail, Add Evidence opens the capture dialog.
 */

import { useMemo, useState } from 'react'
import {
  Camera,
  Eye,
  FileText,
  Hash,
  Info,
  Plus,
  Search,
  ShieldCheck,
  Users,
  Video,
} from 'lucide-react'
import { motion } from 'motion/react'

import { PageHeader } from '@/components/pages/page-header'
import { StatusBadge } from '@/components/status-badge'
import { AddEvidenceModal, EvidencePreviewModal } from '@/components/modals'
import { Stagger, StaggerItem } from '@/components/motion'
import { EmptyState } from '@/components/states'
import { useStore } from '@/lib/store'
import type { Evidence } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

type Filter = 'all' | 'CCTV Footage' | 'Photograph' | 'unverified'

export function EvidencePage() {
  const { evidence, stats, verifyEvidence } = useStore()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [adding, setAdding] = useState(false)
  const [preview, setPreview] = useState<Evidence | null>(null)
  const [details, setDetails] = useState<string | null>(null)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return evidence.filter((e) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'unverified' ? e.status !== 'verified' : e.type === filter)
      const matchesQuery =
        !q ||
        [e.id, e.filename, e.location, e.uploadedBy, e.hash, e.type].some((f) =>
          f.toLowerCase().includes(q),
        )
      return matchesFilter && matchesQuery
    })
  }, [evidence, filter, query])

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: evidence.length },
    { key: 'CCTV Footage', label: 'CCTV', count: evidence.filter((e) => e.type === 'CCTV Footage').length },
    { key: 'Photograph', label: 'Photographs', count: evidence.filter((e) => e.type === 'Photograph').length },
    { key: 'unverified', label: 'Unverified', count: stats.unverified },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Evidence Vault"
        description="Every item is sealed with a content hash and requires two-person confirmation before it enters the verified case record."
        meta={
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="btn-press inline-flex items-center gap-1.5 rounded-lg border border-primary/50 bg-primary/15 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/25"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Add evidence
          </button>
        }
      />

      {/* ── filters + search ── */}
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((f) => (
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
            {f.label}
            <span className="rounded bg-background/60 px-1 tabular-nums">{f.count}</span>
          </button>
        ))}

        <div className="relative ml-auto w-full sm:w-64">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by ID, file, hash…"
            aria-label="Filter evidence"
            className="w-full rounded-lg border border-border bg-card/60 py-1.5 pr-3 pl-8 text-xs outline-none transition-colors focus:border-primary/50"
          />
        </div>
      </div>

      {/* ── cards ── */}
      {visible.length === 0 ? (
        <EmptyState
          title="No evidence matches"
          description="Adjust the filter or search, or log a new item into the vault."
          action={
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="btn-press inline-flex items-center gap-1.5 rounded-lg border border-primary/50 bg-primary/15 px-3 py-1.5 text-xs text-primary"
            >
              <Plus className="size-3.5" /> Add evidence
            </button>
          }
        />
      ) : (
        <Stagger className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((ev) => (
            <StaggerItem key={ev.id}>
              <EvidenceCard
                item={ev}
                expanded={details === ev.id}
                onToggleDetails={() => setDetails(details === ev.id ? null : ev.id)}
                onView={() => setPreview(ev)}
                onVerify={() => verifyEvidence(ev.id)}
              />
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <p className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card/40 px-3 py-2 text-[11px] text-muted-foreground">
        <ShieldCheck className="size-3.5 text-emerald-400" aria-hidden="true" />
        A content hash detects modification after upload. It does not prove what was
        originally recorded was true.
        <Users className="ml-2 size-3.5" aria-hidden="true" />
        Two-person confirmation requires two distinct officers.
      </p>

      <AddEvidenceModal open={adding} onClose={() => setAdding(false)} />
      <EvidencePreviewModal item={preview} onClose={() => setPreview(null)} />
    </div>
  )
}

function EvidenceCard({
  item,
  expanded,
  onToggleDetails,
  onView,
  onVerify,
}: {
  item: Evidence
  expanded: boolean
  onToggleDetails: () => void
  onView: () => void
  onVerify: () => void
}) {
  const isVideo = item.type === 'CCTV Footage'
  const Icon = isVideo ? Video : item.type === 'Photograph' ? Camera : FileText
  const verified = item.status === 'verified'

  return (
    <motion.article
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18 }}
      className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card/60 backdrop-blur-sm"
    >
      {/* Status stripe — paired with the badge below, never colour alone. */}
      <div className={cn('h-0.5 w-full', verified ? 'bg-emerald-400' : 'bg-violet-400')} />

      <div className="flex-1 space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="font-mono text-xs font-semibold text-foreground">{item.id}</p>
              <p className="truncate font-mono text-[11px] text-muted-foreground">
                {item.filename}
              </p>
            </div>
          </div>
          <StatusBadge status={item.status} />
        </div>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
          <Row label="Type" value={item.type} />
          <Row label="Captured" value={item.timestamp} mono />
          <Row label="Location" value={item.location} />
          <Row label="Uploaded by" value={item.uploadedBy} />
        </dl>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded border border-border bg-background/60 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
            <Hash className="size-2.5" aria-hidden="true" />
            {item.hash}
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[10px]',
              item.twoPersonConfirmed
                ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300'
                : 'border-amber-400/35 bg-amber-500/10 text-amber-300',
            )}
          >
            <Users className="size-2.5" aria-hidden="true" />
            {item.twoPersonConfirmed ? '2-person ✓' : '2-person pending'}
          </span>
        </div>

        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="overflow-hidden rounded-lg border border-border bg-background/50 p-3 text-[11px] leading-relaxed text-muted-foreground"
          >
            <p className="mb-1 flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-foreground uppercase">
              <Info className="size-3" aria-hidden="true" /> Integrity record
            </p>
            <p>
              Hash <span className="font-mono text-foreground">{item.hash}</span> was
              computed when the item was logged and is re-checked by the integrity
              monitor. A mismatch breaks the chain of custody and locks the item.
            </p>
            <p className="mt-1.5">
              {item.twoPersonConfirmed
                ? 'Confirmed by a second officer; this item is part of the verified record.'
                : 'Awaiting a second officer. Until then it stays outside the verified record.'}
            </p>
          </motion.div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border/60 p-3">
        <button
          type="button"
          onClick={onView}
          className="btn-press inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-secondary/60 px-2.5 py-1.5 text-[11px] transition-colors hover:bg-secondary"
        >
          <Eye className="size-3.5" aria-hidden="true" /> View
        </button>
        <button
          type="button"
          onClick={onToggleDetails}
          aria-expanded={expanded}
          className="btn-press inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-secondary/60 px-2.5 py-1.5 text-[11px] transition-colors hover:bg-secondary"
        >
          <Info className="size-3.5" aria-hidden="true" /> Details
        </button>
        <button
          type="button"
          onClick={onVerify}
          disabled={verified}
          title={verified ? 'Already verified' : 'Confirm as a second officer'}
          className={cn(
            'btn-press inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] transition-colors',
            verified
              ? 'cursor-not-allowed border-border bg-secondary/30 text-muted-foreground opacity-60'
              : 'border-emerald-500/40 bg-emerald-500/12 text-emerald-300 hover:bg-emerald-500/20',
          )}
        >
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          {verified ? 'Verified' : 'Verify'}
        </button>
      </div>
    </motion.article>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="font-mono text-[9px] tracking-wider text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className={cn('truncate text-foreground', mono && 'font-mono')}>{value}</dd>
    </div>
  )
}
