'use client'

/**
 * The states every page needs besides the happy path.
 *
 * A forensic tool that only renders when everything works is a demo, not a
 * tool. `OfflineState` in particular is deliberately actionable — it prints the
 * exact command to start the backend, because "failed to fetch" tells an
 * officer nothing.
 */

import {
  AlertCircle,
  Inbox,
  Loader2,
  PlugZap,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'

import { cn } from '@/lib/utils'
import { describeError } from '@/lib/api/client'

function Frame({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'danger' | 'warning'
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border px-6 py-12 text-center',
        tone === 'danger' && 'border-red-500/30 bg-red-500/5',
        tone === 'warning' && 'border-amber-400/30 bg-amber-500/5',
        tone === 'neutral' && 'border-border bg-card/40',
      )}
      role="status"
      aria-live="polite"
    >
      {children}
    </div>
  )
}

/** Skeleton rows — shaped like the content they replace, not a generic spinner. */
export function LoadingState({
  label = 'Loading…',
  rows = 3,
}: {
  label?: string
  rows?: number
}) {
  const reduced = useReducedMotion()
  return (
    <div className="space-y-3" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }).map((_, i) => (
        <motion.div
          key={i}
          className="h-20 rounded-xl border border-border bg-card/40"
          initial={reduced ? false : { opacity: 0.4 }}
          animate={reduced ? undefined : { opacity: [0.4, 0.75, 0.4] }}
          transition={
            reduced ? undefined : { duration: 1.6, repeat: Infinity, delay: i * 0.12 }
          }
        />
      ))}
    </div>
  )
}

export function InlineSpinner({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
      <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
      {label ?? 'Working…'}
    </span>
  )
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
}: {
  title: string
  description?: string
  icon?: typeof Inbox
  action?: ReactNode
}) {
  return (
    <Frame>
      <Icon className="size-7 text-muted-foreground" aria-hidden="true" />
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && (
          <p className="mx-auto max-w-md text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </Frame>
  )
}

export function OfflineState({ onRetry }: { onRetry?: () => void }) {
  return (
    <Frame tone="warning">
      <PlugZap className="size-7 text-amber-300" aria-hidden="true" />
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">Backend unreachable</p>
        <p className="text-xs text-muted-foreground">
          The interface is running, but the API is not answering. Start it with:
        </p>
      </div>
      <code className="rounded-md border border-border bg-background px-3 py-1.5 font-mono text-[11px] text-foreground">
        uvicorn app.main:app --reload --port 8000
      </code>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/60 px-3 py-1.5 text-xs transition-colors hover:bg-secondary"
        >
          <RefreshCw className="size-3.5" aria-hidden="true" />
          Retry
        </button>
      )}
    </Frame>
  )
}

export function PermissionDeniedState({ message }: { message?: string }) {
  return (
    <Frame tone="warning">
      <ShieldAlert className="size-7 text-amber-300" aria-hidden="true" />
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">Not permitted for your role</p>
        <p className="mx-auto max-w-md text-xs leading-relaxed text-muted-foreground">
          {message ??
            'Your role does not include access to this material. This attempt has been recorded in the audit trail.'}
        </p>
      </div>
    </Frame>
  )
}

export function ErrorState({
  error,
  onRetry,
}: {
  error: unknown
  onRetry?: () => void
}) {
  const { kind, message } = describeError(error)
  if (kind === 'offline') return <OfflineState onRetry={onRetry} />
  if (kind === 'denied') return <PermissionDeniedState message={message} />

  return (
    <Frame tone="danger">
      <AlertCircle className="size-7 text-red-300" aria-hidden="true" />
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">Something went wrong</p>
        <p className="mx-auto max-w-md text-xs leading-relaxed text-muted-foreground">
          {message}
        </p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/60 px-3 py-1.5 text-xs transition-colors hover:bg-secondary"
        >
          <RefreshCw className="size-3.5" aria-hidden="true" />
          Try again
        </button>
      )}
    </Frame>
  )
}

/** One wrapper that picks the right state, so pages stay readable. */
export function AsyncBoundary({
  loading,
  error,
  isEmpty,
  emptyTitle,
  emptyDescription,
  onRetry,
  loadingRows,
  children,
}: {
  loading: boolean
  error: unknown
  isEmpty?: boolean
  emptyTitle?: string
  emptyDescription?: string
  onRetry?: () => void
  loadingRows?: number
  children: ReactNode
}) {
  if (loading) return <LoadingState rows={loadingRows} />
  if (error) return <ErrorState error={error} onRetry={onRetry} />
  if (isEmpty)
    return (
      <EmptyState
        title={emptyTitle ?? 'Nothing here yet'}
        description={emptyDescription}
      />
    )
  return <>{children}</>
}
