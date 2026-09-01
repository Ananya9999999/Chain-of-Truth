'use client'

/**
 * AI Flags — the machine's working analysis, and the human gate over it.
 *
 * The framing is load-bearing, not cosmetic: every finding is banded as an
 * AI WORKING HYPOTHESIS and carries HUMAN VERIFICATION REQUIRED until an
 * officer acts. Confirming does not make the AI "right" — it records that a
 * human agreed, which is a different and auditable claim.
 *
 * Undo is real: the store snapshots the previous response before each decision,
 * so reverting restores the actual prior state rather than guessing at
 * "pending".
 */

import { useState } from 'react'
import {
  Bot,
  Check,
  Eye,
  RotateCcw,
  ShieldAlert,
  Undo2,
  X,
} from 'lucide-react'
import { motion } from 'motion/react'

import { PageHeader } from '@/components/pages/page-header'
import { ConfidenceMeter } from '@/components/forensic'
import { Expandable, Stagger, StaggerItem, StateChange } from '@/components/motion'
import { EmptyState } from '@/components/states'
import { useStore } from '@/lib/store'
import type { AiFlag } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

type Tab = 'pending' | 'confirmed' | 'dismissed'

export function AiFlagsPage() {
  const { flags } = useStore()
  const [tab, setTab] = useState<Tab>('pending')

  const counts = {
    pending: flags.filter((f) => f.response === 'pending').length,
    confirmed: flags.filter((f) => f.response === 'confirmed').length,
    dismissed: flags.filter((f) => f.response === 'dismissed').length,
  }
  const visible = flags.filter((f) => f.response === tab)

  return (
    <div className="space-y-5">
      <PageHeader
        title="AI Flags"
        description="Patterns the system noticed. Each one is a prompt to look closer — never a conclusion, and never evidence on its own."
        meta={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/40 bg-violet-500/12 px-2.5 py-1 font-mono text-[10px] font-bold tracking-wider text-violet-200">
            <Bot className="size-3" aria-hidden="true" />
            AI WORKING HYPOTHESIS
          </span>
        }
      />

      <div className="flex items-start gap-2.5 rounded-lg border border-violet-400/35 bg-violet-500/[0.07] p-3">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-violet-300" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-violet-200">
          <span className="font-mono font-bold">HUMAN VERIFICATION REQUIRED.</span>{' '}
          Nothing on this page is part of the verified case record. An AI finding
          becomes case fact only when an officer confirms it, and both confirmations
          and dismissals are written permanently to the audit trail.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['pending', 'confirmed', 'dismissed'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            aria-pressed={tab === t}
            className={cn(
              'btn-press inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-[11px] capitalize transition-colors',
              tab === t
                ? 'border-primary/50 bg-primary/12 text-primary'
                : 'border-border bg-card/60 text-muted-foreground hover:text-foreground',
            )}
          >
            {t}
            <span className="rounded bg-background/60 px-1 tabular-nums">{counts[t]}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title={`No ${tab} findings`}
          description={
            tab === 'pending'
              ? 'Every AI finding on this case has an officer decision recorded against it.'
              : `Nothing has been ${tab} yet.`
          }
        />
      ) : (
        <Stagger className="space-y-3">
          {visible.map((flag) => (
            <StaggerItem key={flag.id}>
              <FlagCard flag={flag} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  )
}

const SEVERITY = {
  high: 'border-red-500/40 bg-red-500/10 text-red-300',
  medium: 'border-amber-400/40 bg-amber-500/10 text-amber-300',
  low: 'border-zinc-500/40 bg-zinc-500/10 text-zinc-300',
} as const

function FlagCard({ flag }: { flag: AiFlag }) {
  const { respondToFlag, undoFlag, flagHistory } = useStore()
  const [open, setOpen] = useState(flag.response === 'pending')

  const decided = flag.response !== 'pending'
  const canUndo = flagHistory[flag.id] !== undefined

  return (
    <StateChange statusKey={flag.response}>
      <article
        className={cn(
          'hover-lift overflow-hidden rounded-xl border bg-card/60 backdrop-blur-sm',
          flag.response === 'confirmed'
            ? 'border-emerald-500/35'
            : flag.response === 'dismissed'
              ? 'border-border/60 opacity-80'
              : 'border-violet-400/35',
        )}
      >
        <div
          className={cn(
            'h-0.5 w-full',
            flag.response === 'confirmed'
              ? 'bg-emerald-400'
              : flag.response === 'dismissed'
                ? 'bg-zinc-600'
                : 'bg-violet-400',
          )}
        />

        <div className="space-y-3 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] font-bold text-primary">
                  {flag.id}
                </span>
                <span
                  className={cn(
                    'rounded border px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider uppercase',
                    SEVERITY[flag.severity],
                  )}
                >
                  {flag.severity}
                </span>
                <span
                  className={cn(
                    'rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider',
                    flag.response === 'confirmed'
                      ? 'border-emerald-500/40 bg-emerald-500/12 text-emerald-300'
                      : flag.response === 'dismissed'
                        ? 'border-zinc-500/40 bg-zinc-500/10 text-zinc-400'
                        : 'border-amber-400/40 bg-amber-500/10 text-amber-300',
                  )}
                >
                  {flag.response === 'pending'
                    ? 'HUMAN VERIFICATION REQUIRED'
                    : flag.response === 'confirmed'
                      ? 'HUMAN-CONFIRMED'
                      : 'DISMISSED'}
                </span>
              </div>
              <h3 className="text-sm leading-snug font-semibold text-foreground">
                {flag.title}
              </h3>
            </div>
            <ConfidenceMeter value={flag.confidence} />
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="btn-press inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Eye className="size-3" aria-hidden="true" />
            {open ? 'Hide reasoning' : 'Show reasoning & sources'}
          </button>

          <Expandable open={open}>
            <div className="space-y-3 pt-1">
              <div className="rounded-lg border border-border/70 bg-background/50 p-3">
                <p className="mb-1 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                  Why the system raised this
                </p>
                <p className="text-xs leading-relaxed text-foreground/85">
                  {flag.explanation}
                </p>
              </div>
              <div>
                <p className="mb-1.5 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                  Evidence references
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {flag.sources.map((s) => (
                    <span
                      key={s}
                      className="rounded border border-border bg-background/60 px-2 py-0.5 font-mono text-[10px] text-foreground/85"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Expandable>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
            {decided ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-muted-foreground">
                  {flag.response === 'confirmed'
                    ? 'An officer confirmed this finding.'
                    : 'An officer dismissed this finding. It is retained for the record.'}
                </span>
                {canUndo && (
                  <button
                    type="button"
                    onClick={() => undoFlag(flag.id)}
                    className="btn-press inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/60 px-2.5 py-1.5 text-[11px] transition-colors hover:bg-secondary"
                  >
                    <Undo2 className="size-3.5" aria-hidden="true" /> Undo
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <ActionButton
                  icon={Check}
                  label="Confirm"
                  tone="emerald"
                  onClick={() => respondToFlag(flag.id, 'confirmed')}
                />
                <ActionButton
                  icon={X}
                  label="Dismiss"
                  tone="neutral"
                  onClick={() => respondToFlag(flag.id, 'dismissed')}
                />
                <ActionButton
                  icon={RotateCcw}
                  label="Review later"
                  tone="amber"
                  onClick={() => setOpen(true)}
                />
              </div>
            )}
          </div>
        </div>
      </article>
    </StateChange>
  )
}

function ActionButton({
  icon: Icon,
  label,
  tone,
  onClick,
}: {
  icon: typeof Check
  label: string
  tone: 'emerald' | 'amber' | 'neutral'
  onClick: () => void
}) {
  const cls =
    tone === 'emerald'
      ? 'border-emerald-500/40 bg-emerald-500/12 text-emerald-300 hover:bg-emerald-500/20'
      : tone === 'amber'
        ? 'border-amber-400/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
        : 'border-border bg-secondary/60 text-foreground hover:bg-secondary'
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
        cls,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </motion.button>
  )
}
