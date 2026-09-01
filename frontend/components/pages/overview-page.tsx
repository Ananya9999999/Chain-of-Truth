'use client'

/**
 * Command Center — deliberately brief.
 *
 * A summary, the numbers that matter, what needs a human, and the actions an
 * officer actually starts from. Detailed evidence lives on the Evidence page;
 * duplicating it here is how a command view turns into a second, worse
 * evidence table.
 */

import { useState } from 'react'
import {
  AlertTriangle,
  ArrowUpRight,
  ClipboardCheck,
  FileText,
  FolderLock,
  Plus,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { motion } from 'motion/react'

import { AddEvidenceModal, AddStatementModal } from '@/components/modals'
import { Stagger, StaggerItem } from '@/components/motion'
import { useStore } from '@/lib/store'
import { useNavigate } from '@/lib/navigation'
import type { PageKey } from '@/lib/nav'
import { cn } from '@/lib/utils'

export function OverviewPage() {
  const { activeCase, stats, flags, evidence } = useStore()
  const [addEvidence, setAddEvidence] = useState(false)
  const [addStatement, setAddStatement] = useState(false)

  const openFlags = flags.filter((f) => f.response === 'pending')
  const pendingTwoPerson = evidence.filter((e) => !e.twoPersonConfirmed)

  return (
    <div className="space-y-5">
      <Stagger className="space-y-5">
        {/* ── investigation summary ── */}
        <StaggerItem>
          <section className="hover-lift overflow-hidden rounded-xl border border-border bg-card/70 backdrop-blur-sm">
            <div className="h-0.5 w-full bg-gradient-to-r from-primary/70 via-primary/20 to-transparent" />
            <div className="flex flex-wrap items-start justify-between gap-4 p-5">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-primary">
                    {activeCase.id}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-emerald-300">
                    <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
                    {activeCase.status.toUpperCase()}
                  </span>
                </div>
                <h1 className="text-xl font-semibold tracking-tight text-foreground">
                  {activeCase.title}
                </h1>
                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {activeCase.description}
                </p>
              </div>

              <dl className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-1">
                <div>
                  <dt className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                    Lead officer
                  </dt>
                  <dd className="text-foreground">{activeCase.officer}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                    Opened
                  </dt>
                  <dd className="font-mono text-foreground">{activeCase.date}</dd>
                </div>
              </dl>
            </div>
          </section>
        </StaggerItem>

        {/* ── critical statistics ── */}
        <StaggerItem>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat icon={FolderLock} label="Evidence items" value={stats.total}
              detail={`${stats.verified} verified`} tone="cyan" />
            <Stat icon={ShieldCheck} label="Two-person confirmed" value={stats.twoPerson}
              detail={`${pendingTwoPerson.length} pending`} tone="emerald" />
            <Stat icon={AlertTriangle} label="Open AI flags" value={stats.openFlags}
              detail="awaiting a human" tone="amber" />
            <Stat icon={ClipboardCheck} label="Unverified" value={stats.unverified}
              detail="not yet in the record" tone="violet" />
          </div>
        </StaggerItem>

        {/* ── alerts ── */}
        {openFlags.length > 0 && (
          <StaggerItem>
            <section className="space-y-2">
              <h2 className="flex items-center gap-2 font-mono text-[11px] tracking-wider text-amber-300 uppercase">
                <AlertTriangle className="size-3.5" aria-hidden="true" />
                Requires attention · {openFlags.length}
              </h2>
              <div className="space-y-2">
                {openFlags.slice(0, 3).map((f) => (
                  <div
                    key={f.id}
                    className="hover-lift flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/30 bg-amber-500/[0.05] px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <span className="font-mono text-[10px] text-amber-300">{f.id}</span>
                        {f.title}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {f.explanation}
                      </p>
                    </div>
                    <span className="shrink-0 rounded border border-violet-400/40 bg-violet-500/10 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-violet-300">
                      AI WORKING HYPOTHESIS
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </StaggerItem>
        )}

        {/* ── quick actions ── */}
        <StaggerItem>
          <section className="space-y-2">
            <h2 className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
              Quick actions
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <ActionCard
                icon={Plus}
                title="Add evidence"
                detail="Log CCTV footage or a photograph"
                onClick={() => setAddEvidence(true)}
                primary
              />
              <ActionCard
                icon={FileText}
                title="Record statement"
                detail="Capture a witness account"
                onClick={() => setAddStatement(true)}
              />
              <ActionCard
                icon={ClipboardCheck}
                title="Review queue"
                detail={`${stats.openFlags} findings await a decision`}
                href="verification"
              />
              <ActionCard
                icon={Users}
                title="Audit trail"
                detail="Every view, upload and decision"
                href="audit"
              />
            </div>
          </section>
        </StaggerItem>

        <StaggerItem>
          <p className="rounded-lg border border-border bg-card/40 px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
            <span className="font-mono font-bold text-primary">AI assists.</span>{' '}
            <span className="font-mono font-bold text-emerald-400">Humans decide.</span>{' '}
            Nothing the AI produces enters the verified case record until an officer
            confirms it, and every decision — including a dismissal — is recorded
            permanently in the audit trail.
          </p>
        </StaggerItem>
      </Stagger>

      <AddEvidenceModal open={addEvidence} onClose={() => setAddEvidence(false)} />
      <AddStatementModal open={addStatement} onClose={() => setAddStatement(false)} />
    </div>
  )
}

const TONE = {
  cyan: 'text-cyan-300 border-cyan-400/25',
  emerald: 'text-emerald-300 border-emerald-500/25',
  amber: 'text-amber-300 border-amber-400/25',
  violet: 'text-violet-300 border-violet-400/25',
} as const

function Stat({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: typeof FolderLock
  label: string
  value: number
  detail: string
  tone: keyof typeof TONE
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18 }}
      className={cn(
        'rounded-xl border bg-card/60 p-4 backdrop-blur-sm',
        TONE[tone].split(' ')[1],
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn('size-3.5', TONE[tone].split(' ')[0])} aria-hidden="true" />
        <p className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
          {label}
        </p>
      </div>
      <p className={cn('mt-2 font-mono text-3xl font-bold tabular-nums', TONE[tone].split(' ')[0])}>
        {value}
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{detail}</p>
    </motion.div>
  )
}

function ActionCard({
  icon: Icon,
  title,
  detail,
  onClick,
  href,
  primary,
}: {
  icon: typeof Plus
  title: string
  detail: string
  onClick?: () => void
  href?: PageKey
  primary?: boolean
}) {
  const navigate = useNavigate()
  const handle = onClick ?? (() => href && navigate(href))

  return (
    <motion.button
      type="button"
      onClick={handle}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.18 }}
      className={cn(
        'group flex items-start gap-3 rounded-xl border p-4 text-left transition-colors',
        primary
          ? 'border-primary/45 bg-primary/10 hover:bg-primary/16'
          : 'border-border bg-card/60 hover:border-border/80 hover:bg-card',
      )}
    >
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-lg',
          primary ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground',
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1 text-sm font-medium text-foreground">
          {title}
          <ArrowUpRight className="size-3 opacity-0 transition-opacity group-hover:opacity-60" aria-hidden="true" />
        </span>
        <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">
          {detail}
        </span>
      </span>
    </motion.button>
  )
}
