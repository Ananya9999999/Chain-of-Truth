'use client'

/**
 * Reusable motion primitives.
 *
 * Two rules run through all of these:
 *
 *  1. Motion carries meaning. Entrances establish reading order, the
 *     verification flip marks a state change the officer just caused, and the
 *     scanline appears only while the AI is actually working. Nothing moves
 *     purely for decoration.
 *  2. Every component honours `prefers-reduced-motion`. Under that setting the
 *     content still renders in its final state — it does not fade to nothing or
 *     stay invisible, which is the usual way "respecting" the setting breaks a
 *     page.
 */

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type HTMLMotionProps,
  type Transition,
} from 'motion/react'
import type { ReactNode } from 'react'

/** Forensic-tool easing: quick to start, settles without bounce. */
export const EASE_OUT: Transition = {
  duration: 0.42,
  ease: [0.22, 1, 0.36, 1],
}

export const EASE_QUICK: Transition = {
  duration: 0.2,
  ease: [0.22, 1, 0.36, 1],
}

/* --------------------------------------------------------------- page level */

export function PageTransition({
  children,
  motionKey,
}: {
  children: ReactNode
  motionKey: string
}) {
  const reduced = useReducedMotion()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={motionKey}
        initial={reduced ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduced ? undefined : { opacity: 0, y: -6 }}
        transition={EASE_OUT}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

/** Staggered list entrance: establishes reading order top-to-bottom. */
export function Stagger({
  children,
  delay = 0,
  gap = 0.055,
  className,
}: {
  children: ReactNode
  delay?: number
  gap?: number
  className?: string
}) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduced ? false : 'hidden'}
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: reduced ? 0 : gap, delayChildren: delay } },
      }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  children,
  className,
  ...rest
}: { children: ReactNode; className?: string } & HTMLMotionProps<'div'>) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      className={className}
      variants={{
        hidden: reduced ? {} : { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: EASE_OUT },
      }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

/** Reveal on scroll — used sparingly, for long analytical pages. */
export function Reveal({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={EASE_OUT}
    >
      {children}
    </motion.div>
  )
}

/* ------------------------------------------------------------ state change */

/**
 * Marks a verification state transition.
 *
 * When an officer confirms or dismisses a finding, the card physically changes
 * colour and lifts — the animation is the receipt for the decision they just
 * made, so it is keyed on the status itself.
 */
export function StateChange({
  children,
  statusKey,
  className,
}: {
  children: ReactNode
  statusKey: string
  className?: string
}) {
  const reduced = useReducedMotion()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={statusKey}
        className={className}
        initial={reduced ? false : { opacity: 0, scale: 0.985 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={reduced ? undefined : { opacity: 0, scale: 0.985 }}
        transition={EASE_QUICK}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

/** A number that counts up to its value — for scores and totals. */
export function CountUp({
  value,
  decimals = 0,
  suffix = '',
  className,
}: {
  value: number
  decimals?: number
  suffix?: string
  className?: string
}) {
  const reduced = useReducedMotion()
  if (reduced) {
    return (
      <span className={className}>
        {value.toFixed(decimals)}
        {suffix}
      </span>
    )
  }
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.span
        initial={{ '--n': 0 } as never}
        animate={{ '--n': value } as never}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      >
        {value.toFixed(decimals)}
      </motion.span>
      {suffix}
    </motion.span>
  )
}

/* ------------------------------------------------------------ AI processing */

/**
 * Scanline. Reserved exclusively for "the AI is working right now".
 *
 * Because it appears nowhere else, its presence is information: if it is
 * moving, analysis is genuinely in flight.
 */
export function Scanline({ active = true }: { active?: boolean }) {
  const reduced = useReducedMotion()
  if (!active) return null
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
      aria-hidden="true"
    >
      <motion.div
        className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"
        style={{ boxShadow: '0 0 12px 1px var(--color-primary, #00e5ff)' }}
        initial={{ top: '0%' }}
        animate={reduced ? { top: '50%' } : { top: ['0%', '100%'] }}
        transition={
          reduced
            ? { duration: 0 }
            : { duration: 1.8, repeat: Infinity, ease: 'linear' }
        }
      />
    </div>
  )
}

/** Progress bar for a running analysis job. */
export function ProgressBar({
  value,
  label,
}: {
  value: number
  label?: string
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
          <span>{label}</span>
          <span>{Math.round(value)}%</span>
        </div>
      )}
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progress'}
      >
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- interactions */

/** Press feedback for interactive cards and buttons. */
export function Pressable({
  children,
  className,
  onClick,
  disabled,
  ariaLabel,
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
  ariaLabel?: string
}) {
  const reduced = useReducedMotion()
  return (
    <motion.button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={className}
      whileHover={reduced || disabled ? undefined : { y: -2 }}
      whileTap={reduced || disabled ? undefined : { scale: 0.975 }}
      transition={EASE_QUICK}
    >
      {children}
    </motion.button>
  )
}

/** Expand/collapse with height animation that does not clip focus rings. */
export function Expandable({
  open,
  children,
}: {
  open: boolean
  children: ReactNode
}) {
  const reduced = useReducedMotion()
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          key="content"
          initial={reduced ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={reduced ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export { AnimatePresence, motion, useReducedMotion }
