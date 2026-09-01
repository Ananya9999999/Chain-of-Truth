'use client'

/**
 * The opening sequence.
 *
 * A staged reveal over the 3D evidence network: grid, then mark, then the
 * title resolving character by character, then subtitle, then a system-status
 * readout, then the calls to action. The sequence is choreographed with
 * explicit delays rather than left to chance, so it reads the same on every
 * machine.
 *
 * The whole thing collapses to its final frame under `prefers-reduced-motion`:
 * a viewer who has asked for less motion still sees the complete page, just
 * without the theatre.
 *
 * "Enter" performs a deliberate transition — the scene dims and the network
 * pulls forward — before routing, so the move into the workspace feels
 * continuous rather than like a page swap.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowRight, PlayCircle, ShieldCheck } from 'lucide-react'

import { ForensicBackground } from '@/components/forensic-background'

const TITLE = 'CHAIN OF TRUTH'

/** Beat timings in seconds, from mount. */
const BEAT = {
  grid: 0.15,
  mark: 0.7,
  title: 1.15,
  subtitle: 2.15,
  status: 2.55,
  cta: 2.95,
}

const STATUS_LINES = [
  { label: 'INTEGRITY LEDGER', value: 'SHA-256 CHAIN ACTIVE' },
  { label: 'ANALYSIS LAYER', value: 'HUMAN GATE ENFORCED' },
  { label: 'AUDIT', value: 'APPEND-ONLY' },
]

export function CinematicHero() {
  const router = useRouter()
  const reduced = useReducedMotion() ?? false
  const [entering, setEntering] = useState(false)

  // Warm the workspace bundle while the viewer reads, so "Enter" is instant.
  useEffect(() => {
    router.prefetch('/dashboard')
  }, [router])

  function enter() {
    if (reduced) {
      router.push('/dashboard')
      return
    }
    setEntering(true)
    window.setTimeout(() => router.push('/dashboard'), 620)
  }

  function viewDemo() {
    document.getElementById('workflow')?.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      block: 'start',
    })
  }

  const at = (t: number) => (reduced ? 0 : t)

  return (
    <section
      id="top"
      className="relative flex min-h-screen items-center overflow-hidden px-6 pt-28 pb-20 md:px-12 lg:px-20"
    >
      <ForensicBackground variant="hero" />

      {/* Transition veil: dims and pushes toward the viewer on entry. */}
      <AnimatePresence>
        {entering && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-50 bg-[#05070a]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 1, 1] }}
          />
        )}
      </AnimatePresence>

      <motion.div
        className="relative z-10 mx-auto w-full max-w-5xl"
        animate={entering && !reduced ? { scale: 1.06, opacity: 0 } : { scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 1, 1] }}
      >
        {/* ── mark ── */}
        <motion.div
          className="mb-6 flex items-center gap-3"
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: at(BEAT.mark), duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="relative flex size-10 items-center justify-center rounded-lg border border-primary/40 bg-primary/10">
            <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
            {!reduced && (
              <motion.span
                className="absolute inset-0 rounded-lg border border-primary/50"
                animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeOut' }}
              />
            )}
          </span>
          <span className="font-mono text-[11px] tracking-[0.24em] text-primary/80 uppercase">
            Digital Forensics Command Platform
          </span>
        </motion.div>

        {/* ── title, resolving character by character ── */}
        <h1
          className="text-4xl leading-[1.05] font-bold tracking-tight text-white sm:text-6xl lg:text-7xl"
          aria-label={TITLE}
        >
          {TITLE.split('').map((ch, i) => (
            <motion.span
              key={i}
              aria-hidden="true"
              className={ch === ' ' ? 'inline-block w-3 sm:w-5' : 'inline-block'}
              initial={reduced ? false : { opacity: 0, y: 18, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{
                delay: at(BEAT.title + i * 0.045),
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {ch}
            </motion.span>
          ))}
        </h1>

        {/* ── subtitle ── */}
        <motion.p
          className="mt-5 max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg"
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: at(BEAT.subtitle), duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          Evidence sealed the moment it is collected. An AI layer that reads it,
          connects it and catches contradictions — while every finding waits for a
          human to decide.
        </motion.p>

        <motion.p
          className="mt-3 font-mono text-xs tracking-wide text-primary/70"
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: at(BEAT.subtitle + 0.25), duration: 0.6 }}
        >
          AI ASSISTS. HUMANS DECIDE.
        </motion.p>

        {/* ── system status ── */}
        <motion.div
          className="mt-8 flex flex-wrap gap-x-6 gap-y-2"
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: at(BEAT.status), duration: 0.6 }}
        >
          {STATUS_LINES.map((line, i) => (
            <motion.div
              key={line.label}
              className="flex items-center gap-2"
              initial={reduced ? false : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: at(BEAT.status + i * 0.12), duration: 0.45 }}
            >
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full rounded-full bg-emerald-400/70" />
                {!reduced && (
                  <motion.span
                    className="absolute inline-flex size-full rounded-full bg-emerald-400"
                    animate={{ scale: [1, 2.2], opacity: [0.7, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.35 }}
                  />
                )}
              </span>
              <span className="font-mono text-[10px] tracking-widest text-white/40 uppercase">
                {line.label}
              </span>
              <span className="font-mono text-[10px] tracking-widest text-emerald-300/80 uppercase">
                {line.value}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* ── calls to action ── */}
        <motion.div
          className="mt-10 flex flex-col gap-3 sm:flex-row"
          initial={reduced ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: at(BEAT.cta), duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.button
            type="button"
            onClick={enter}
            whileHover={reduced ? undefined : { y: -2 }}
            whileTap={reduced ? undefined : { scale: 0.98 }}
            className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-lg border border-primary/50 bg-primary/15 px-6 py-3.5 text-sm font-semibold tracking-wide text-primary transition-colors hover:bg-primary/25"
          >
            <span className="relative z-10">ENTER FORENSIC COMMAND CENTER</span>
            <ArrowRight
              className="relative z-10 size-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
            {!reduced && (
              <motion.span
                className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-primary/25 to-transparent"
                animate={{ left: ['-20%', '120%'] }}
                transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 1.6, ease: 'easeInOut' }}
                aria-hidden="true"
              />
            )}
          </motion.button>

          <motion.button
            type="button"
            onClick={viewDemo}
            whileHover={reduced ? undefined : { y: -2 }}
            whileTap={reduced ? undefined : { scale: 0.98 }}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[0.03] px-6 py-3.5 text-sm font-medium tracking-wide text-white/80 transition-colors hover:border-white/25 hover:bg-white/[0.07]"
          >
            <PlayCircle className="size-4" aria-hidden="true" />
            VIEW INVESTIGATION DEMO
          </motion.button>
        </motion.div>

        <motion.p
          className="mt-6 font-mono text-[10px] tracking-wider text-white/30"
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: at(BEAT.cta + 0.3), duration: 0.6 }}
        >
          Demo environment · all case data is fictional
        </motion.p>
      </motion.div>
    </section>
  )
}
