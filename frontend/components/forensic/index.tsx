'use client'

/**
 * The forensic component vocabulary.
 *
 * These are the pieces that make "AI assists, humans decide" visible rather
 * than merely claimed. Two rules are enforced here so no page can forget them:
 *
 *  - Status is never conveyed by colour alone. Every chip carries an icon and a
 *    word, so it survives greyscale printing, projector washout and colour
 *    blindness — all three of which happen at a hackathon demo.
 *  - AI output cannot be rendered without its provenance. SourceExcerpt shows
 *    the literal text a claim came from, and AiProviderBadge says whether a
 *    language model or a deterministic rule produced it.
 */

import {
  AlertTriangle,
  BadgeCheck,
  Ban,
  Bot,
  Check,
  CircleHelp,
  Cpu,
  Eye,
  FlaskConical,
  Loader2,
  ShieldCheck,
  X,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'

import { cn } from '@/lib/utils'
import type {
  AiProviderInfo,
  Decision,
  Severity,
  VerificationStatus,
} from '@/lib/types'

/* -------------------------------------------------------------- status chip */

const STATUS_META: Record<
  VerificationStatus,
  { label: string; icon: typeof Check; className: string; description: string }
> = {
  VERIFIED: {
    label: 'VERIFIED',
    icon: ShieldCheck,
    className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    description: 'Part of the verified case record.',
  },
  HUMAN_CONFIRMED: {
    label: 'HUMAN-CONFIRMED',
    icon: BadgeCheck,
    className: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
    description: 'An officer reviewed this and confirmed it.',
  },
  AI_EXTRACTED_UNVERIFIED: {
    label: 'AI-EXTRACTED · UNVERIFIED',
    icon: Bot,
    className: 'border-violet-400/40 bg-violet-500/10 text-violet-300 border-dashed',
    description: 'Machine-derived. Not part of the case record until confirmed.',
  },
  AI_HYPOTHESIS: {
    label: 'AI HYPOTHESIS',
    icon: FlaskConical,
    className: 'border-violet-400/50 bg-violet-500/15 text-violet-200',
    description: 'An investigative hypothesis requiring qualified review.',
  },
  REQUIRES_REVIEW: {
    label: 'REQUIRES REVIEW',
    icon: AlertTriangle,
    className: 'border-amber-400/45 bg-amber-500/10 text-amber-300',
    description: 'Awaiting a human decision.',
  },
  DISMISSED: {
    label: 'DISMISSED',
    icon: Ban,
    className: 'border-zinc-500/40 bg-zinc-500/10 text-zinc-400',
    description: 'An officer reviewed this and dismissed it. Retained for the record.',
  },
}

export function StatusChip({
  status,
  size = 'md',
  className,
}: {
  status: VerificationStatus
  size?: 'sm' | 'md'
  className?: string
}) {
  const meta = STATUS_META[status] ?? STATUS_META.REQUIRES_REVIEW
  const Icon = meta.icon
  return (
    <span
      title={meta.description}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-mono font-bold tracking-wider whitespace-nowrap',
        size === 'sm' ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]',
        meta.className,
        className,
      )}
    >
      <Icon className={size === 'sm' ? 'size-2.5' : 'size-3'} aria-hidden="true" />
      {meta.label}
    </span>
  )
}

/* ----------------------------------------------------------------- severity */

const SEVERITY_META: Record<string, { className: string }> = {
  CRITICAL: { className: 'border-red-500/50 bg-red-500/15 text-red-300' },
  HIGH: { className: 'border-red-500/45 bg-red-500/12 text-red-300' },
  MAJOR: { className: 'border-red-400/40 bg-red-500/10 text-red-300' },
  MODERATE: { className: 'border-amber-400/45 bg-amber-500/12 text-amber-300' },
  MINOR: { className: 'border-amber-400/40 bg-amber-500/10 text-amber-300' },
  LOW: { className: 'border-zinc-500/40 bg-zinc-500/10 text-zinc-400' },
  REVIEW: { className: 'border-violet-400/40 bg-violet-500/10 text-violet-300' },
}

/**
 * Renders the severity the backend actually reported.
 *
 * Deliberately does NOT fall back to a default label for an unrecognised
 * value: an engine that emits "HIGH" must not be rendered as "MINOR" because
 * the styling map happens to lack that key. Unknown severities keep their own
 * text and get neutral styling — under-styled is recoverable, mislabelled is
 * not.
 */
export function SeverityChip({ severity }: { severity: Severity | string }) {
  const key = String(severity || 'UNKNOWN').toUpperCase()
  const meta = SEVERITY_META[key] ?? {
    className: 'border-zinc-500/40 bg-zinc-500/10 text-zinc-300',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider',
        meta.className,
      )}
    >
      <AlertTriangle className="size-2.5" aria-hidden="true" />
      {key}
    </span>
  )
}

/* --------------------------------------------------------------- confidence */

/**
 * Confidence is shown as a number, a bar AND a word.
 *
 * "0.72" alone invites false precision; the qualitative band keeps the reader
 * honest about what a machine score actually tells them.
 */
export function ConfidenceMeter({
  value,
  showBar = true,
  className,
}: {
  value: number
  showBar?: boolean
  className?: string
}) {
  const reduced = useReducedMotion()
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  const band = pct >= 85 ? 'high' : pct >= 60 ? 'moderate' : 'low'
  const tone =
    band === 'high'
      ? 'text-emerald-300'
      : band === 'moderate'
        ? 'text-amber-300'
        : 'text-zinc-400'
  const bar =
    band === 'high' ? 'bg-emerald-400' : band === 'moderate' ? 'bg-amber-400' : 'bg-zinc-500'

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className={cn('font-mono text-[11px] font-semibold tabular-nums', tone)}>
        {pct}%
      </span>
      {showBar && (
        <div className="h-1 w-14 overflow-hidden rounded-full bg-secondary">
          <motion.div
            className={cn('h-full rounded-full', bar)}
            initial={reduced ? false : { width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      )}
      <span className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
        {band} confidence
      </span>
    </div>
  )
}

/* ------------------------------------------------------------ source excerpt */

/**
 * A claim shown beside the literal text it came from.
 *
 * This is the specification's fix for hallucination: the officer verifies in
 * two seconds by reading, instead of trusting. The highlighted span is the
 * exact character range the backend recorded.
 */
export function SourceExcerpt({
  excerpt,
  highlight,
  label = 'Source',
  evidenceRef,
  offsets,
}: {
  excerpt: string
  highlight?: string
  label?: string
  evidenceRef?: string | number | null
  offsets?: { start: number | null; end: number | null }
}) {
  let body: ReactNode = excerpt
  if (highlight && excerpt) {
    const idx = excerpt.toLowerCase().indexOf(highlight.toLowerCase())
    if (idx >= 0) {
      body = (
        <>
          {excerpt.slice(0, idx)}
          <mark className="rounded-sm bg-primary/25 px-0.5 font-semibold text-primary-foreground ring-1 ring-primary/40">
            {excerpt.slice(idx, idx + highlight.length)}
          </mark>
          {excerpt.slice(idx + highlight.length)}
        </>
      )
    }
  }

  return (
    <figure className="rounded-lg border border-border/70 bg-background/60 p-3">
      <figcaption className="mb-1.5 flex flex-wrap items-center gap-2 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
        <Eye className="size-3" aria-hidden="true" />
        {label}
        {evidenceRef != null && <span>· evidence #{evidenceRef}</span>}
        {offsets?.start != null && offsets?.end != null && (
          <span>· chars {offsets.start}–{offsets.end}</span>
        )}
      </figcaption>
      <blockquote className="font-mono text-xs leading-relaxed text-foreground/90">
        {body}
      </blockquote>
    </figure>
  )
}

/* -------------------------------------------------------- AI provider badge */

/** Says plainly whether a language model or a deterministic rule ran. */
export function AiProviderBadge({
  provider,
  className,
}: {
  provider?: AiProviderInfo | null
  className?: string
}) {
  if (!provider) return null
  const live = provider.is_live_inference
  return (
    <span
      title={provider.disclaimer}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold tracking-wider',
        live
          ? 'border-violet-400/50 bg-violet-500/15 text-violet-200'
          : 'border-cyan-400/40 bg-cyan-500/10 text-cyan-300',
        className,
      )}
    >
      <Cpu className="size-3" aria-hidden="true" />
      AI: {live ? 'LIVE' : 'MOCK'}
      <span className="font-normal opacity-70">· {provider.model ?? provider.provider}</span>
    </span>
  )
}

/* ------------------------------------------------------------ AI disclaimer */

export function AiHypothesisBanner({ text }: { text?: string }) {
  return (
    <div
      role="note"
      className="flex items-start gap-2.5 rounded-lg border border-violet-400/40 bg-violet-500/10 p-3 text-violet-200"
    >
      <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p className="text-xs leading-relaxed">
        {text ??
          'AI-generated investigative hypothesis — requires forensic medical officer review. Not a medical diagnosis or cause-of-death conclusion.'}
      </p>
    </div>
  )
}

/* --------------------------------------------------------------- hash chip */

export function HashChip({
  hash,
  label = 'SHA-256',
}: {
  hash: string
  label?: string
}) {
  if (!hash) return null
  return (
    <span
      title={hash}
      className="inline-flex items-center gap-1.5 rounded border border-border bg-secondary/60 px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
    >
      <span className="tracking-wider uppercase opacity-70">{label}</span>
      <span className="text-foreground/80">{hash.slice(0, 12)}…{hash.slice(-6)}</span>
    </span>
  )
}

/* ------------------------------------------------------------ verify actions */

/**
 * The human gate, as a control.
 *
 * Every path here is deliberate and logged: dismissing is as recorded as
 * confirming, and neither deletes the AI's original finding.
 */
export function VerifyActions({
  onDecision,
  pending,
  disabled,
  disabledReason,
  compact,
}: {
  onDecision: (decision: Decision) => void
  pending?: Decision | null
  disabled?: boolean
  disabledReason?: string
  compact?: boolean
}) {
  const base = cn(
    'inline-flex items-center justify-center gap-1.5 rounded-lg border font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
    compact ? 'px-2.5 py-1.5 text-[11px]' : 'px-3 py-2 text-xs',
  )

  if (disabled && disabledReason) {
    return (
      <p className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-[11px] text-muted-foreground">
        <CircleHelp className="size-3.5 shrink-0" aria-hidden="true" />
        {disabledReason}
      </p>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={disabled || !!pending}
        onClick={() => onDecision('CONFIRM')}
        className={cn(
          base,
          'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20',
        )}
      >
        {pending === 'CONFIRM' ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <Check className="size-3.5" aria-hidden="true" />
        )}
        Confirm
      </button>

      <button
        type="button"
        disabled={disabled || !!pending}
        onClick={() => onDecision('DISMISS')}
        className={cn(base, 'border-border bg-secondary/60 text-foreground hover:bg-secondary')}
      >
        {pending === 'DISMISS' ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <X className="size-3.5" aria-hidden="true" />
        )}
        Dismiss
      </button>

      <button
        type="button"
        disabled={disabled || !!pending}
        onClick={() => onDecision('REQUEST_REVIEW')}
        className={cn(
          base,
          'border-amber-400/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20',
        )}
      >
        {pending === 'REQUEST_REVIEW' ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <AlertTriangle className="size-3.5" aria-hidden="true" />
        )}
        Request review
      </button>
    </div>
  )
}

/* ------------------------------------------------------------- layer legend */

/** Makes the verified / AI split explicit wherever both are on screen. */
export function LayerLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-border/70 bg-card/40 px-3 py-2 text-[11px] text-muted-foreground">
      <span className="font-mono tracking-wider uppercase">Layers:</span>
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-emerald-400" aria-hidden="true" />
        Verified case record
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-violet-400" aria-hidden="true" />
        AI working analysis — not case fact until confirmed
      </span>
    </div>
  )
}
