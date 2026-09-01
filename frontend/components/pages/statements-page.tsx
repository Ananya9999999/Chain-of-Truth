'use client'

/**
 * Statements — recording, comparison, and conflict review.
 *
 * Switching between versions animates the content out and the replacement in,
 * so the reader can see that they are looking at a different account rather
 * than a silently mutated one. Conflicting passages are highlighted inline at
 * the exact character range the case data records, with the reason and the
 * evidence that disagrees.
 *
 * The framing is deliberate throughout: a changed account is an investigative
 * flag, not a finding that a witness is untruthful. Memory shifts, and a
 * machine is in no position to say why.
 */

import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowLeftRight,
  MessagesSquare,
  Plus,
  User,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

import { PageHeader } from '@/components/pages/page-header'
import { StatusBadge } from '@/components/status-badge'
import { AddStatementModal } from '@/components/modals'
import { Stagger, StaggerItem } from '@/components/motion'
import { EmptyState } from '@/components/states'
import { useStore, type Statement } from '@/lib/store'
import { cn } from '@/lib/utils'

export function StatementsPage() {
  const { statements } = useStore()
  const [activeId, setActiveId] = useState(statements[0]?.id ?? '')
  const [adding, setAdding] = useState(false)
  const [compareId, setCompareId] = useState<string | null>(null)

  const active = statements.find((s) => s.id === activeId) ?? statements[0] ?? null
  const compare = statements.find((s) => s.id === compareId) ?? null

  return (
    <div className="space-y-5">
      <PageHeader
        title="Statements"
        description="Recorded witness accounts, with changes between versions surfaced for human review."
        meta={
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="btn-press inline-flex items-center gap-1.5 rounded-lg border border-primary/50 bg-primary/15 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/25"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Add statement
          </button>
        }
      />

      {statements.length === 0 ? (
        <EmptyState
          title="No statements recorded"
          description="Record a witness account and it will appear here and on the case timeline."
          action={
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="btn-press inline-flex items-center gap-1.5 rounded-lg border border-primary/50 bg-primary/15 px-3 py-1.5 text-xs text-primary"
            >
              <Plus className="size-3.5" /> Add statement
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          {/* ── selector ── */}
          <aside className="space-y-2">
            <p className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
              Recorded accounts · {statements.length}
            </p>
            <Stagger className="space-y-2">
              {statements.map((s) => (
                <StaggerItem key={s.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(s.id)}
                    className={cn(
                      'hover-lift w-full rounded-xl border p-3 text-left transition-colors',
                      s.id === active?.id
                        ? 'border-primary/50 bg-primary/10'
                        : 'border-border bg-card/50 hover:bg-card',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-semibold text-foreground">
                        {s.id}
                      </span>
                      {s.conflicts?.length ? (
                        <span className="inline-flex items-center gap-1 rounded border border-amber-400/40 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[9px] text-amber-300">
                          <AlertTriangle className="size-2.5" aria-hidden="true" />
                          {s.conflicts.length}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-foreground">
                      <User className="size-3 text-muted-foreground" aria-hidden="true" />
                      {s.witness}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                      {s.date} · {s.time}
                    </p>
                  </button>
                </StaggerItem>
              ))}
            </Stagger>
          </aside>

          {/* ── viewer ── */}
          <div className="space-y-3">
            {active && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={active.status} />
                  <span className="font-mono text-[11px] text-muted-foreground">
                    Recorded by {active.officer} · {active.location}
                  </span>
                  <div className="ml-auto flex items-center gap-2">
                    <label htmlFor="cmp" className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                      Compare with
                    </label>
                    <select
                      id="cmp"
                      value={compareId ?? ''}
                      onChange={(e) => setCompareId(e.target.value || null)}
                      className="rounded-lg border border-border bg-card px-2 py-1 text-[11px] outline-none focus:border-primary/50"
                    >
                      <option value="">— none —</option>
                      {statements
                        .filter((s) => s.id !== active.id)
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.id} · {s.date}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className={cn('grid gap-3', compare && 'lg:grid-cols-2')}>
                  <StatementCard statement={active} primary />
                  {compare && <StatementCard statement={compare} />}
                </div>

                {compare && <DiffPanel a={active} b={compare} />}

                {active.conflicts?.length ? (
                  <section className="space-y-2">
                    <h3 className="flex items-center gap-2 font-mono text-[11px] tracking-wider text-amber-300 uppercase">
                      <AlertTriangle className="size-3.5" aria-hidden="true" />
                      Flagged passages · {active.conflicts.length}
                    </h3>
                    {active.conflicts.map((c, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-amber-400/30 bg-amber-500/[0.05] p-3"
                      >
                        <p className="font-mono text-[10px] tracking-wider text-amber-300 uppercase">
                          Conflicts with {c.evidenceRef}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-foreground/85">
                          {c.note}
                        </p>
                        <p className="mt-2 rounded border border-border/60 bg-background/50 px-2 py-1 font-mono text-[11px] text-amber-200">
                          “{active.text.slice(c.start, c.end)}”
                        </p>
                        <p className="mt-2 text-[10px] text-muted-foreground">
                          Requires human review. This marks a discrepancy to check — it
                          does not determine which source is correct.
                        </p>
                      </div>
                    ))}
                  </section>
                ) : null}
              </>
            )}
          </div>
        </div>
      )}

      <AddStatementModal open={adding} onClose={() => setAdding(false)} />
    </div>
  )
}

/** Renders the statement with any flagged character ranges highlighted. */
function StatementCard({
  statement,
  primary,
}: {
  statement: Statement
  primary?: boolean
}) {
  const segments = useMemo(() => {
    const conflicts = [...(statement.conflicts ?? [])].sort((a, b) => a.start - b.start)
    if (conflicts.length === 0) return [{ text: statement.text, flagged: false }]

    const out: { text: string; flagged: boolean }[] = []
    let cursor = 0
    for (const c of conflicts) {
      const start = Math.max(cursor, Math.min(c.start, statement.text.length))
      const end = Math.max(start, Math.min(c.end, statement.text.length))
      if (start > cursor) out.push({ text: statement.text.slice(cursor, start), flagged: false })
      if (end > start) out.push({ text: statement.text.slice(start, end), flagged: true })
      cursor = end
    }
    if (cursor < statement.text.length)
      out.push({ text: statement.text.slice(cursor), flagged: false })
    return out
  }, [statement])

  return (
    <AnimatePresence mode="wait">
      <motion.article
        key={statement.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          'paper-doc rounded-sm p-5 pl-12',
          primary ? 'ring-1 ring-primary/40' : '',
        )}
      >
        <header className="mb-3 flex flex-wrap items-start justify-between gap-2 border-b border-[rgba(120,95,55,0.3)] pb-2">
          <div>
            <p className="font-mono text-[10px] tracking-[0.18em] text-[#6b573a] uppercase">
              Witness statement
            </p>
            <p className="font-mono text-sm font-bold text-[#2a2118]">{statement.id}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[10px] text-[#6b573a]">
              {statement.date} · {statement.time}
            </p>
            <p className="font-mono text-[10px] text-[#6b573a]">{statement.location}</p>
          </div>
        </header>

        <p className="paper-body text-[13px] text-[#2a2118]">
          {segments.map((seg, i) =>
            seg.flagged ? (
              <mark
                key={i}
                className="rounded-[1px] bg-[rgba(200,60,50,0.18)] px-0.5 text-[#7a1f18] decoration-[rgba(160,40,30,0.5)] underline decoration-wavy underline-offset-4"
                title="Flagged as conflicting with other evidence"
              >
                {seg.text}
              </mark>
            ) : (
              <span key={i}>{seg.text}</span>
            ),
          )}
        </p>

        <footer className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-[rgba(120,95,55,0.3)] pt-2">
          <div>
            <p className="font-mono text-[9px] tracking-wider text-[#6b573a] uppercase">
              Recorded by
            </p>
            <p className="font-mono text-[11px] text-[#2a2118]">{statement.officer}</p>
          </div>
          <span
            className={cn(
              'paper-stamp text-[10px] font-bold',
              statement.status === 'verified' ? 'text-[#2f6b3f]' : 'text-[#8a5a1f]',
            )}
          >
            {statement.status === 'verified' ? 'VERIFIED' : 'UNVERIFIED'}
          </span>
        </footer>
      </motion.article>
    </AnimatePresence>
  )
}

/** Word-level differences between two accounts, computed on the fly. */
function DiffPanel({ a, b }: { a: Statement; b: Statement }) {
  const { onlyA, onlyB } = useMemo(() => {
    const words = (s: string) =>
      new Set(s.toLowerCase().replace(/[^a-z0-9\s:]/g, '').split(/\s+/).filter(Boolean))
    const wa = words(a.text)
    const wb = words(b.text)
    return {
      onlyA: [...wa].filter((w) => !wb.has(w)).slice(0, 14),
      onlyB: [...wb].filter((w) => !wa.has(w)).slice(0, 14),
    }
  }, [a, b])

  return (
    <div className="rounded-xl border border-border bg-card/50 p-4">
      <p className="mb-3 flex items-center gap-2 font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
        <ArrowLeftRight className="size-3.5" aria-hidden="true" />
        What changed between {a.id} and {b.id}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 font-mono text-[10px] text-muted-foreground">
            Only in {a.id}
          </p>
          <div className="flex flex-wrap gap-1">
            {onlyA.length === 0 ? (
              <span className="text-[11px] text-muted-foreground">—</span>
            ) : (
              onlyA.map((w) => (
                <span key={w} className="rounded border border-cyan-400/30 bg-cyan-500/10 px-1.5 py-0.5 font-mono text-[10px] text-cyan-200">
                  {w}
                </span>
              ))
            )}
          </div>
        </div>
        <div>
          <p className="mb-1.5 font-mono text-[10px] text-muted-foreground">
            Only in {b.id}
          </p>
          <div className="flex flex-wrap gap-1">
            {onlyB.length === 0 ? (
              <span className="text-[11px] text-muted-foreground">—</span>
            ) : (
              onlyB.map((w) => (
                <span key={w} className="rounded border border-amber-400/30 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] text-amber-200">
                  {w}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
      <p className="mt-3 flex items-start gap-2 text-[10px] leading-relaxed text-muted-foreground">
        <MessagesSquare className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
        A lexical comparison, shown to direct attention. It is not an assessment of
        credibility, and a difference in wording is not evidence of anything on its own.
      </p>
    </div>
  )
}
