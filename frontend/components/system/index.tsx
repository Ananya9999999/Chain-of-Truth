'use client'

/**
 * Shared interface primitives: toasts, modal shell, and the forensic cursor.
 *
 * All three obey `prefers-reduced-motion`, and the cursor additionally
 * disables itself on touch devices — a custom cursor on a phone is invisible
 * dead weight, and on a screen reader it is noise.
 */

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'motion/react'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ toasts */

const TOAST_ICON = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
} as const

const TOAST_TONE = {
  success: 'border-emerald-500/40 bg-emerald-500/12 text-emerald-200',
  error: 'border-red-500/40 bg-red-500/12 text-red-200',
  info: 'border-cyan-400/40 bg-cyan-500/12 text-cyan-200',
} as const

export function ToastViewport() {
  const { toasts, dismissToast } = useStore()

  return (
    <div
      className="pointer-events-none fixed right-4 bottom-4 z-[100] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const Icon = TOAST_ICON[t.tone]
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 24, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.97 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                'pointer-events-auto flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 shadow-lg backdrop-blur-md',
                TOAST_TONE[t.tone],
              )}
            >
              <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <p className="flex-1 text-xs leading-relaxed">{t.message}</p>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                aria-label="Dismiss notification"
                className="rounded p-0.5 opacity-60 transition-opacity hover:opacity-100"
              >
                <X className="size-3.5" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------------- modal */

/**
 * Animated modal with a focus trap and Escape-to-close.
 *
 * The focus trap is not decoration: a dialog a keyboard user can tab out of,
 * behind an inert backdrop, is a trap of the worse kind.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  size?: 'md' | 'lg' | 'xl'
}) {
  const reduced = useReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Focus the first field so the keyboard lands somewhere useful.
    window.setTimeout(() => {
      panelRef.current
        ?.querySelector<HTMLElement>('input, select, textarea, button')
        ?.focus()
    }, 60)

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  const width =
    size === 'xl' ? 'max-w-3xl' : size === 'lg' ? 'max-w-2xl' : 'max-w-lg'

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cn(
              'relative w-full overflow-hidden rounded-t-2xl border border-border bg-card shadow-2xl sm:rounded-2xl',
              width,
            )}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Cyan hairline: the same status-stripe language used on cards. */}
            <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary to-transparent" />

            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-foreground">
                  {title}
                </h2>
                {description && (
                  <p className="mt-1 text-xs text-muted-foreground">{description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="btn-press rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

/* ------------------------------------------------------- form field helpers */

export function Field({
  label,
  htmlFor,
  error,
  required,
  children,
  hint,
}: {
  label: string
  htmlFor: string
  error?: string
  required?: boolean
  children: ReactNode
  hint?: string
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1 font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
      >
        {label}
        {required && <span className="text-primary">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      {error && (
        <p role="alert" className="flex items-center gap-1 text-[11px] text-red-300">
          <AlertTriangle className="size-3" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  )
}

export const inputClass =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/20'

/* ------------------------------------------------------------------ cursor */

/**
 * Forensic cursor: a small dot with a lagging ring that expands over
 * interactive targets.
 *
 * Only mounts on devices with a fine pointer, and never under reduced motion —
 * the whole effect is trailing movement, so honouring the setting means not
 * rendering it at all rather than rendering it still.
 */
export function ForensicCursor() {
  const reduced = useReducedMotion()
  const [enabled, setEnabled] = useState(false)
  const [active, setActive] = useState(false)

  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const ringX = useSpring(x, { stiffness: 380, damping: 30, mass: 0.4 })
  const ringY = useSpring(y, { stiffness: 380, damping: 30, mass: 0.4 })

  const onMove = useCallback(
    (e: MouseEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
      const el = e.target as HTMLElement | null
      setActive(
        !!el?.closest('button, a, [role="button"], input, select, textarea, canvas'),
      )
    },
    [x, y],
  )

  useEffect(() => {
    if (reduced) return
    if (!window.matchMedia('(pointer: fine)').matches) return
    setEnabled(true)

    // Stamp the root only once the custom cursor is genuinely live. The CSS
    // hides the native cursor solely on this attribute, so a device that never
    // reaches this line keeps its normal pointer instead of losing it.
    document.documentElement.setAttribute('data-cot-cursor', '')
    window.addEventListener('mousemove', onMove, { passive: true })

    return () => {
      window.removeEventListener('mousemove', onMove)
      document.documentElement.removeAttribute('data-cot-cursor')
    }
  }, [onMove, reduced])

  if (!enabled) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[200] hidden lg:block" aria-hidden="true">
      <motion.div
        className="absolute size-1 rounded-full bg-primary"
        style={{ x, y, translateX: '-50%', translateY: '-50%' }}
      />
      <motion.div
        className={cn(
          'absolute rounded-full border transition-colors duration-200',
          active ? 'border-primary/80' : 'border-primary/35',
        )}
        style={{ x: ringX, y: ringY, translateX: '-50%', translateY: '-50%' }}
        animate={{
          width: active ? 38 : 22,
          height: active ? 38 : 22,
          opacity: active ? 0.9 : 0.5,
        }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  )
}
