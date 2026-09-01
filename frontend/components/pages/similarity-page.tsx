'use client'

/**
 * Case Similarity Search.
 *
 * Surfaces open cases whose method overlaps this one. The caveat banner is not
 * boilerplate: pattern matching across cases is exactly where an investigative
 * tool can do real damage if a score is mistaken for a link between suspects,
 * so the distinction between "worth checking" and "evidence" is stated on the
 * page rather than left to the reader.
 */

import { SearchCode, ShieldAlert } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'

import { PageHeader } from '@/components/pages/page-header'
import { AsyncBoundary } from '@/components/states'
import { Stagger, StaggerItem } from '@/components/motion'
import { api } from '@/lib/api/client'
import { useAsync } from '@/lib/hooks/use-api'
import { DEMO_CASE_REF } from '@/lib/case'

interface Match {
  uid: string
  matched_case_number: string
  matched_case_title: string | null
  similarity_score: number
  matched_features: string[]
  explanation: string
  method: string
  status: string
}

export function SimilarityPage() {
  const { data, loading, error, refetch } = useAsync(
    () => api.raw<{ matches: Match[]; count: number; caveat: string }>(
      `/cases/${DEMO_CASE_REF}/similarity`,
    ),
    [],
  )

  return (
    <div className="space-y-5">
      <PageHeader
        title="Case Similarity"
        description="Open cases whose recorded method overlaps this one."
        meta={
          <span className="font-mono text-[11px] text-muted-foreground">
            {data?.count ?? 0} matches
          </span>
        }
      />

      <div className="flex items-start gap-2.5 rounded-lg border border-amber-400/40 bg-amber-500/10 p-3">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-300" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-amber-200">
          {data?.caveat ??
            'Similarity indicates a pattern worth checking. It is not evidence that the same person is responsible and must never be presented as such.'}
        </p>
      </div>

      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={refetch}
        isEmpty={(data?.matches?.length ?? 0) === 0}
        emptyTitle="No similar cases found"
        emptyDescription="No open case shares enough recorded method features with this one to surface here."
      >
        <Stagger className="space-y-3">
          {(data?.matches ?? []).map((m) => (
            <StaggerItem key={m.uid}>
              <MatchCard match={m} />
            </StaggerItem>
          ))}
        </Stagger>
      </AsyncBoundary>
    </div>
  )
}

function MatchCard({ match }: { match: Match }) {
  const reduced = useReducedMotion()
  const pct = Math.round(match.similarity_score * 100)
  const tone = pct >= 70 ? 'text-amber-300' : 'text-muted-foreground'
  const bar = pct >= 70 ? 'bg-amber-400' : 'bg-zinc-500'

  return (
    <article className="hover-lift space-y-3 rounded-xl border border-border bg-card/50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="font-mono text-[11px] tracking-wider text-primary">
            {match.matched_case_number}
          </p>
          <h4 className="text-sm font-semibold text-foreground">
            {match.matched_case_title ?? 'Untitled case'}
          </h4>
        </div>
        <div className="text-right">
          <p className={`font-mono text-2xl font-bold tabular-nums ${tone}`}>{pct}%</p>
          <p className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
            method overlap
          </p>
        </div>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <motion.div
          className={`h-full rounded-full ${bar}`}
          initial={reduced ? false : { width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {match.matched_features.map((f) => (
          <span
            key={f}
            className="rounded-full border border-border bg-secondary/60 px-2.5 py-0.5 text-[11px] text-muted-foreground"
          >
            {f}
          </span>
        ))}
      </div>

      <p className="rounded-lg border border-border/70 bg-background/50 p-3 text-xs leading-relaxed text-foreground/85">
        {match.explanation}
      </p>

      <p className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
        <SearchCode className="size-3" aria-hidden="true" />
        method: {match.method}
      </p>
    </article>
  )
}
