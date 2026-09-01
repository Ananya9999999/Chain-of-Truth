'use client'

/**
 * Autopsy Cross-Check.
 *
 * A stylised body diagram with an animated vascular network on the left, and
 * the forensic cross-check panel on the right. Selecting a region draws a
 * connector to its evidence reference.
 *
 * This is a forensic *interface*, not a diagnostic system, and the design says
 * so at every level: regions are schematic rather than anatomically detailed,
 * the vessels are drawn as cool technical lines (never red), a region only
 * highlights when the case data actually contains an observation for it, and
 * every AI-derived line carries the mandatory hypothesis disclaimer.
 *
 * Built with SVG rather than Three.js: this is a 2D schematic with labelled
 * hit-regions, and SVG gives crisp text, real focusable elements and keyboard
 * access that a WebGL canvas would have to reimplement badly.
 */

import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import {
  Activity,
  Box,
  FlaskConical,
  RotateCw,
  Square,
  Link2,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react'
import { motion } from 'motion/react'

import { PageHeader } from '@/components/pages/page-header'
import { AiHypothesisBanner, ConfidenceMeter } from '@/components/forensic'
import { Stagger, StaggerItem } from '@/components/motion'
import { BODY_REGIONS, BodyFigure } from '@/components/forensic/body-figure'
import { LoadingState } from '@/components/states'
import { useTheme } from '@/lib/theme'
import type { AnatomyMarker } from '@/components/three/anatomy-scene'
import { useStore, type BodyObservation } from '@/lib/store'
import { cn } from '@/lib/utils'

const AnatomyScene = dynamic(
  () => import('@/components/three/anatomy-scene').then((m) => m.AnatomyScene),
  { ssr: false, loading: () => <LoadingState label="Loading 3D viewer…" rows={3} /> },
)

/** Region id -> position in body space, matching the 3D figure. */
const MARKER_POSITION: Record<string, [number, number, number]> = {
  head: [0, 0.95, 0.13],
  chest: [-0.08, 0.46, 0.17],
  abdomen: [0, 0.08, 0.16],
  'left-arm': [-0.3, 0.1, 0.05],
  'right-arm': [0.3, 0.1, 0.05],
  'left-leg': [-0.11, -0.6, 0.07],
  'right-leg': [0.11, -0.6, 0.07],
}

const STATUS_META = {
  HUMAN_CONFIRMED: { label: 'HUMAN-CONFIRMED', cls: 'border-emerald-500/40 bg-emerald-500/12 text-emerald-300', dot: '#6ee7b7' },
  AI_HYPOTHESIS: { label: 'AI HYPOTHESIS', cls: 'border-violet-400/45 bg-violet-500/12 text-violet-200', dot: '#dfb7ff' },
  REQUIRES_REVIEW: { label: 'NO OBSERVATION', cls: 'border-border bg-secondary/50 text-muted-foreground', dot: '#5b6570' },
} as const

export function AutopsyPage() {
  const { body } = useStore()
  const dark = useTheme().resolved === 'dark'
  const [view, setView] = useState<'3d' | '2d'>('3d')
  const [autoRotate, setAutoRotate] = useState(false)
  const [selected, setSelected] = useState<BodyObservation | null>(
    body.find((b) => b.status === 'HUMAN_CONFIRMED') ?? null,
  )

  /** Only regions with a recorded observation become 3D markers. */
  const markers: AnatomyMarker[] = useMemo(
    () =>
      body
        .filter((o) => o.status !== 'REQUIRES_REVIEW' && MARKER_POSITION[o.region])
        .map((o) => ({
          id: o.region,
          label: o.label,
          position: MARKER_POSITION[o.region],
          color: STATUS_META[o.status].dot,
          status: o.status === 'HUMAN_CONFIRMED' ? 'confirmed' : 'hypothesis',
          summary: o.observation,
        })),
    [body],
  )

  return (
    <div className="space-y-5">
      <PageHeader
        title="Autopsy Cross-Check"
        description="Post-mortem observations checked against the case timeline. A forensic interface for a qualified reviewer — not a diagnostic system."
        meta={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/40 bg-violet-500/12 px-2.5 py-1 font-mono text-[10px] font-bold tracking-wider text-violet-200">
            <Stethoscope className="size-3" aria-hidden="true" />
            REQUIRES FORENSIC MEDICAL REVIEW
          </span>
        }
      />

      <AiHypothesisBanner />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* ── body diagram ── */}
        <div className="relative overflow-hidden rounded-xl border border-border surface-deep/80 p-4 backdrop-blur-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
              <Activity className="size-3" aria-hidden="true" />
              Regional observation map
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setAutoRotate((v) => !v)}
                aria-pressed={autoRotate}
                title="Auto-rotate"
                className={cn(
                  'btn-press flex size-7 items-center justify-center rounded-md border transition-colors',
                  autoRotate
                    ? 'border-primary/50 bg-primary/12 text-primary'
                    : 'border-border bg-secondary/50 text-muted-foreground hover:text-foreground',
                )}
              >
                <RotateCw className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setView('3d')}
                aria-pressed={view === '3d'}
                title="3D view"
                className={cn(
                  'btn-press flex size-7 items-center justify-center rounded-md border transition-colors',
                  view === '3d'
                    ? 'border-primary/50 bg-primary/12 text-primary'
                    : 'border-border bg-secondary/50 text-muted-foreground hover:text-foreground',
                )}
              >
                <Box className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setView('2d')}
                aria-pressed={view === '2d'}
                title="2D diagram"
                className={cn(
                  'btn-press flex size-7 items-center justify-center rounded-md border transition-colors',
                  view === '2d'
                    ? 'border-primary/50 bg-primary/12 text-primary'
                    : 'border-border bg-secondary/50 text-muted-foreground hover:text-foreground',
                )}
              >
                <Square className="size-3.5" />
              </button>
            </div>
          </div>

          {view === '3d' ? (
            <div className="relative h-[440px] overflow-hidden rounded-lg">
              <AnatomyScene
                markers={markers}
                selectedId={selected?.region}
                onSelect={(id) => {
                  const obs = body.find((b) => b.region === id)
                  if (obs) setSelected(obs)
                }}
                autoRotate={autoRotate}
                dark={dark}
              />
              <p className="pointer-events-none absolute bottom-2 left-2 font-mono text-[10px] text-muted-foreground">
                drag to rotate · scroll to zoom · click a marker
              </p>
            </div>
          ) : (
            <BodyFigure
              regions={BODY_REGIONS}
              selectedId={selected?.region}
              onSelect={(id) => {
                const obs = body.find((b) => b.region === id)
                if (obs) setSelected(obs)
              }}
              statusOf={(id) => {
                const o = body.find((b) => b.region === id)
                if (!o || o.status === 'REQUIRES_REVIEW') return 'none'
                return o.status === 'HUMAN_CONFIRMED' ? 'confirmed' : 'hypothesis'
              }}
              colorOf={(id) => {
                const o = body.find((b) => b.region === id)
                return STATUS_META[o?.status ?? 'REQUIRES_REVIEW'].dot
              }}
            />
          )}

          <div className="mt-2 flex flex-wrap justify-center gap-3">
            {(Object.keys(STATUS_META) as (keyof typeof STATUS_META)[]).map((k) => (
              <span key={k} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span className="size-2 rounded-full" style={{ background: STATUS_META[k].dot }} />
                {STATUS_META[k].label}
              </span>
            ))}
          </div>
        </div>

        {/* ── cross-check panel ── */}
        <div className="space-y-3">
          {selected && (
            <motion.div
              key={selected.region}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-3 rounded-xl border border-border bg-card/70 p-4 backdrop-blur-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">{selected.label}</h3>
                <span
                  className={cn(
                    'rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider',
                    STATUS_META[selected.status].cls,
                  )}
                >
                  {STATUS_META[selected.status].label}
                </span>
              </div>

              <div className="rounded-lg border border-border/70 bg-background/50 p-3">
                <p className="mb-1 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                  Observation
                </p>
                <p className="text-xs leading-relaxed text-foreground/90">
                  {selected.observation}
                </p>
              </div>

              <dl className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-background/40 px-3 py-2">
                  <dt className="font-mono text-[9px] tracking-wider text-muted-foreground uppercase">
                    Recorded
                  </dt>
                  <dd className="mt-0.5 font-mono text-xs text-foreground">
                    {selected.timestamp}
                  </dd>
                </div>
                <div className="rounded-lg border border-border bg-background/40 px-3 py-2">
                  <dt className="font-mono text-[9px] tracking-wider text-muted-foreground uppercase">
                    Evidence reference
                  </dt>
                  <dd className="mt-0.5 flex items-center gap-1.5 font-mono text-xs text-primary">
                    {selected.evidenceRef !== '—' && (
                      <Link2 className="size-3" aria-hidden="true" />
                    )}
                    {selected.evidenceRef}
                  </dd>
                </div>
              </dl>

              {selected.confidence > 0 && (
                <div className="rounded-lg border border-border bg-background/40 px-3 py-2">
                  <p className="mb-1.5 font-mono text-[9px] tracking-wider text-muted-foreground uppercase">
                    Confidence
                  </p>
                  <ConfidenceMeter value={selected.confidence} />
                </div>
              )}

              <div className="flex items-start gap-2 rounded-lg border border-border bg-background/40 p-3">
                {selected.status === 'HUMAN_CONFIRMED' ? (
                  <>
                    <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      Recorded by the examining officer and confirmed. Part of the
                      verified record.
                    </p>
                  </>
                ) : selected.status === 'AI_HYPOTHESIS' ? (
                  <>
                    <FlaskConical className="mt-0.5 size-3.5 shrink-0 text-violet-300" aria-hidden="true" />
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      Machine-derived cross-reference awaiting a forensic medical
                      officer. It identifies a comparison that has not been performed —
                      it does not assert a cause or manner of death.
                    </p>
                  </>
                ) : (
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    The case file records no observation for this region. Nothing is
                    inferred in its absence.
                  </p>
                )}
              </div>
            </motion.div>
          )}

          <div className="rounded-xl border border-border bg-card/50 p-4">
            <p className="mb-2 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
              All regions
            </p>
            <Stagger className="space-y-1.5">
              {body.map((o) => (
                <StaggerItem key={o.region}>
                  <button
                    type="button"
                    onClick={() => setSelected(o)}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors',
                      selected?.region === o.region
                        ? 'border-primary/50 bg-primary/10'
                        : 'border-border/60 bg-background/40 hover:bg-secondary/40',
                    )}
                  >
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: STATUS_META[o.status].dot }}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate text-xs text-foreground">
                      {o.label}
                    </span>
                    <span className="shrink-0 font-mono text-[9px] tracking-wider text-muted-foreground">
                      {STATUS_META[o.status].label}
                    </span>
                  </button>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
      </div>
    </div>
  )
}
