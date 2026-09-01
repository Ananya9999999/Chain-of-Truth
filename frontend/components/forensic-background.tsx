'use client'

/**
 * The layered forensic backdrop used behind the landing page and the workspace.
 *
 * Composed of cheap CSS layers plus one optional WebGL layer:
 *
 *   0. radial lighting        (CSS gradients, free)
 *   1. precision grid         (CSS, parallax-shifted by pointer)
 *   2. 3D evidence network    (R3F, lazy, `variant="hero"` only by default)
 *   3. drifting data motes    (CSS keyframes)
 *   4. scanline + noise       (CSS, very low opacity)
 *
 * Everything is `pointer-events-none` and sits at z-0, with page content above
 * it, so it can never intercept a click or push the page into horizontal
 * overflow. It is deliberately NOT at a negative z-index: `body` already
 * paints an opaque background colour and gradient, and a negative layer would
 * render behind that and be invisible.
 *
 * Readability is the hard constraint. Behind the dashboard the whole stack runs
 * at roughly a third of hero strength and the WebGL layer is off, because a
 * background that makes a hash string harder to read has failed at its job
 * regardless of how good it looks.
 */

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'

import { useTheme } from '@/lib/theme'

const EvidenceNetwork = dynamic(
  () => import('@/components/three/evidence-network').then((m) => m.EvidenceNetwork),
  { ssr: false, loading: () => null },
)

export function ForensicBackground({
  variant = 'app',
  network,
}: {
  variant?: 'hero' | 'app'
  /** Force the WebGL layer on or off; defaults to on for hero only. */
  network?: boolean
}) {
  const reduced = useReducedMotion() ?? false
  // The landing hero is always dark by design; only the workspace follows the theme.
  const dark = useTheme().resolved === 'dark'
  const ref = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  const hero = variant === 'hero'
  const showNetwork = network ?? hero

  // Mount-gate the 3D layer so the first paint is never blocked by WebGL.
  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), hero ? 120 : 400)
    return () => window.clearTimeout(id)
  }, [hero])

  // Pointer parallax, written straight to CSS custom properties. Doing this
  // outside React state avoids a re-render on every mousemove.
  useEffect(() => {
    if (reduced) return
    const el = ref.current
    if (!el) return

    let frame = 0
    const onMove = (e: MouseEvent) => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const dx = e.clientX / window.innerWidth - 0.5
        const dy = e.clientY / window.innerHeight - 0.5
        el.style.setProperty('--px', `${dx * (hero ? 22 : 10)}px`)
        el.style.setProperty('--py', `${dy * (hero ? 22 : 10)}px`)
      })
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMove)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [hero, reduced])

  const strength = hero ? 1 : dark ? 0.34 : 0.20

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={
        // Hero: absolute, so the backdrop is confined to the hero section.
        // A *fixed* layer here would cover the whole page, and because a
        // positioned z-0 element paints ABOVE non-positioned in-flow content,
        // it silently hid every section below the hero.
        // App: fixed, because the workspace scrolls over a static backdrop and
        // its content is explicitly raised to z-10.
        hero
          ? 'pointer-events-none absolute inset-0 z-0 overflow-hidden'
          : 'pointer-events-none fixed inset-0 z-0 overflow-hidden'
      }
      style={{ ['--px' as string]: '0px', ['--py' as string]: '0px' }}
    >
      {/* 0 — base + radial forensic lighting */}
      <div
        className="absolute inset-0"
        style={{ background: hero || dark ? '#05070a' : '#f2f4f7' }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(90rem 50rem at 12% -10%, rgba(0,229,255,${0.09 * strength}), transparent 60%),
            radial-gradient(70rem 45rem at 105% 15%, rgba(123,0,203,${0.07 * strength}), transparent 62%),
            radial-gradient(60rem 40rem at 50% 115%, rgba(0,180,210,${0.06 * strength}), transparent 60%)
          `,
        }}
      />

      {/* 1 — precision grid, parallax-shifted */}
      <div
        className="absolute inset-[-4rem] transition-transform duration-300 ease-out"
        style={{
          transform: 'translate3d(var(--px), var(--py), 0)',
          backgroundImage: `
            linear-gradient(to right, rgba(120,200,220,${0.055 * strength}) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(120,200,220,${0.055 * strength}) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
          maskImage:
            'radial-gradient(ellipse 120% 90% at 50% 40%, black 35%, transparent 85%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 120% 90% at 50% 40%, black 35%, transparent 85%)',
        }}
      />

      {/* 2 — 3D evidence network */}
      {showNetwork && mounted && (
        <div className="absolute inset-0">
          <EvidenceNetwork intensity={hero ? 1 : 0.45} reduced={reduced} />
        </div>
      )}

      {/* 3 — drifting motes */}
      {!reduced && (
        <div
          className="absolute inset-0 transition-transform duration-500 ease-out"
          style={{ transform: 'translate3d(calc(var(--px) * -0.5), calc(var(--py) * -0.5), 0)' }}
        >
          {MOTES.map((m, i) => (
            <span
              key={i}
              className="cot-mote absolute rounded-full bg-cyan-300"
              style={{
                left: `${m.x}%`,
                top: `${m.y}%`,
                width: m.size,
                height: m.size,
                opacity: m.opacity * strength,
                animationDuration: `${m.duration}s`,
                animationDelay: `${m.delay}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* 4 — scanline + noise, both nearly invisible by design */}
      {!reduced && (
        <div
          className="cot-scan absolute inset-x-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(0,229,255,0.5), transparent)',
            opacity: 0.4 * strength,
          }}
        />
      )}
      <div
        className="absolute inset-0 mix-blend-overlay"
        style={{
          opacity: 0.16 * strength,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Vignette keeps the edges from competing with the content */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 100% 80% at 50% 50%, transparent 40%, rgba(3,5,8,0.55) 100%)',
        }}
      />
    </div>
  )
}

/** Fixed layout so server and client render identically (no hydration drift). */
const MOTES = [
  { x: 12, y: 22, size: 2, opacity: 0.5, duration: 19, delay: 0 },
  { x: 27, y: 71, size: 1.5, opacity: 0.4, duration: 24, delay: 2 },
  { x: 41, y: 15, size: 2.5, opacity: 0.55, duration: 21, delay: 5 },
  { x: 58, y: 63, size: 1.5, opacity: 0.35, duration: 27, delay: 1 },
  { x: 69, y: 31, size: 2, opacity: 0.5, duration: 18, delay: 7 },
  { x: 78, y: 79, size: 1.5, opacity: 0.4, duration: 23, delay: 3 },
  { x: 88, y: 44, size: 2, opacity: 0.45, duration: 26, delay: 9 },
  { x: 34, y: 88, size: 1.5, opacity: 0.35, duration: 20, delay: 4 },
  { x: 6, y: 55, size: 2, opacity: 0.4, duration: 25, delay: 6 },
  { x: 94, y: 12, size: 1.5, opacity: 0.4, duration: 22, delay: 8 },
]
