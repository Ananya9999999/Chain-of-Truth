'use client'

/**
 * Anatomical figure for the autopsy cross-check.
 *
 * A front-facing translucent body with a circulatory network behind it —
 * arteries warm, veins cool — in the style of a medical-imaging render. The
 * silhouette is schematic on purpose: this is a forensic *interface* for
 * locating and describing observations, not an anatomical reference, and a
 * diagram that looked authoritative would invite exactly the wrong reading.
 *
 * A region only lights up when the case file records an observation for it.
 * Nothing is inferred from an empty region.
 *
 * Pure SVG rather than WebGL: this is a 2D schematic with labelled hit-regions,
 * and SVG gives real focusable elements, crisp text and keyboard access that a
 * canvas would have to reimplement worse.
 */

import { useReducedMotion } from 'motion/react'

import { cn } from '@/lib/utils'

export interface BodyRegionSpec {
  id: string
  label: string
  /** Clickable area. */
  hit: { x: number; y: number; w: number; h: number; rx?: number }
  /** Where the marker dot sits. */
  cx: number
  cy: number
}

/** Region geometry in the 240 × 520 viewBox. */
export const BODY_REGIONS: BodyRegionSpec[] = [
  { id: 'head', label: 'Head', hit: { x: 96, y: 14, w: 48, h: 62, rx: 24 }, cx: 120, cy: 45 },
  { id: 'chest', label: 'Chest', hit: { x: 84, y: 104, w: 72, h: 66, rx: 12 }, cx: 120, cy: 137 },
  { id: 'abdomen', label: 'Abdomen', hit: { x: 88, y: 172, w: 64, h: 62, rx: 12 }, cx: 120, cy: 203 },
  { id: 'left-arm', label: 'Left arm', hit: { x: 46, y: 106, w: 32, h: 128, rx: 14 }, cx: 62, cy: 170 },
  { id: 'right-arm', label: 'Right arm', hit: { x: 162, y: 106, w: 32, h: 128, rx: 14 }, cx: 178, cy: 170 },
  { id: 'left-leg', label: 'Left leg', hit: { x: 86, y: 240, w: 30, h: 176, rx: 14 }, cx: 101, cy: 328 },
  { id: 'right-leg', label: 'Right leg', hit: { x: 124, y: 240, w: 30, h: 176, rx: 14 }, cx: 139, cy: 328 },
]

/** Arterial tree (warm). Kept anatomically suggestive, never graphic. */
const ARTERIES = [
  'M120 78 L120 150',
  'M120 96 L100 112 L92 150 L88 210',
  'M120 96 L140 112 L148 150 L152 210',
  'M120 150 L104 190 L100 236',
  'M120 150 L136 190 L140 236',
  'M100 236 L98 300 L100 386',
  'M140 236 L142 300 L140 386',
  'M92 150 L70 168 L64 224',
  'M148 150 L170 168 L176 224',
]

/** Venous return (cool), offset slightly from the arterial paths. */
const VEINS = [
  'M126 80 L126 152',
  'M114 100 L96 118 L90 158 L86 214',
  'M126 100 L144 118 L150 158 L156 214',
  'M114 154 L108 194 L106 240',
  'M126 154 L132 194 L134 240',
  'M106 240 L104 302 L106 388',
  'M134 240 L136 302 L134 388',
  'M90 158 L74 176 L68 228',
  'M150 158 L166 176 L172 228',
]

export function BodyFigure({
  regions,
  selectedId,
  onSelect,
  statusOf,
  colorOf,
  className,
}: {
  regions: BodyRegionSpec[]
  selectedId?: string | null
  onSelect: (id: string) => void
  /** Whether a region has a recorded observation. */
  statusOf: (id: string) => 'none' | 'hypothesis' | 'confirmed'
  colorOf: (id: string) => string
  className?: string
}) {
  const reduced = useReducedMotion()

  return (
    <svg
      viewBox="0 0 240 520"
      className={cn('mx-auto h-auto w-full max-w-[300px]', className)}
      role="img"
      aria-label="Anatomical figure with selectable observation regions"
    >
      <defs>
        <linearGradient id="bodyFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a6fa8" stopOpacity="0.42" />
          <stop offset="45%" stopColor="#1288c4" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#0d4f78" stopOpacity="0.38" />
        </linearGradient>
        <radialGradient id="coreGlow" cx="50%" cy="28%" r="60%">
          <stop offset="0%" stopColor="#6fd3ff" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#0a2f4a" stopOpacity="0" />
        </radialGradient>
        <filter id="vesselBlur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
        <filter id="bodyBlur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* soft body halo */}
      <g filter="url(#bodyBlur)" opacity="0.55">
        <BodyShape fill="#1b7fc0" />
      </g>

      {/* translucent body */}
      <BodyShape fill="url(#bodyFill)" stroke="#5cc6f5" strokeOpacity="0.5" />
      <ellipse cx="120" cy="150" rx="70" ry="90" fill="url(#coreGlow)" />

      {/* vessels behind the surface */}
      <g filter="url(#vesselBlur)" opacity="0.75">
        <g stroke="#ff5f6d" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.85">
          {ARTERIES.map((d, i) => <path key={`a-${i}`} d={d} />)}
        </g>
        <g stroke="#3fa9f5" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.85">
          {VEINS.map((d, i) => <path key={`v-${i}`} d={d} />)}
        </g>
      </g>

      {/* travelling light along the vessels */}
      {!reduced && (
        <>
          <g stroke="#ffb3b8" strokeWidth="1.8" fill="none" strokeLinecap="round">
            {ARTERIES.map((d, i) => (
              <path key={`af-${i}`} d={d} className="cot-vein" style={{ animationDelay: `${i * 0.4}s` }} />
            ))}
          </g>
          <g stroke="#a9dcff" strokeWidth="1.6" fill="none" strokeLinecap="round">
            {VEINS.map((d, i) => (
              <path key={`vf-${i}`} d={d} className="cot-vein" style={{ animationDelay: `${i * 0.4 + 1.2}s` }} />
            ))}
          </g>
        </>
      )}

      {/* heart marker — anchors the circulatory read */}
      <g transform="translate(120 132)">
        <circle r="9" fill="#ff5f6d" opacity="0.30" />
        <circle r="5" fill="#ff5f6d" opacity="0.75">
          {!reduced && (
            <animate attributeName="r" values="5;6.4;5" dur="1.5s" repeatCount="indefinite" />
          )}
        </circle>
      </g>

      {/* selectable regions */}
      {regions.map((r) => {
        const status = statusOf(r.id)
        const active = status !== 'none'
        const isSelected = selectedId === r.id
        const color = colorOf(r.id)

        return (
          <g key={r.id}>
            <rect
              x={r.hit.x} y={r.hit.y} width={r.hit.w} height={r.hit.h} rx={r.hit.rx ?? 10}
              role="button"
              tabIndex={0}
              aria-label={`${r.label}${active ? '' : ' — no observation recorded'}`}
              aria-pressed={isSelected}
              onClick={() => onSelect(r.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(r.id) }
              }}
              fill={isSelected ? 'rgba(0,229,255,0.14)' : 'transparent'}
              stroke={isSelected ? '#00e5ff' : 'transparent'}
              strokeWidth="1.3"
              className="cursor-pointer outline-none focus-visible:stroke-primary"
            />

            {active && (
              <g transform={`translate(${r.cx} ${r.cy})`} pointerEvents="none">
                {!reduced && (
                  <circle r="6" fill="none" stroke={color} strokeWidth="1"
                    className="cot-radar" style={{ transformOrigin: 'center' }} />
                )}
                <circle r={isSelected ? 7 : 5.5} fill="#05070a" stroke={color} strokeWidth="2" />
                <circle r={isSelected ? 3 : 2.2} fill={color} />
              </g>
            )}
          </g>
        )
      })}

      {/* leader lines + labels for regions that carry an observation */}
      {regions.map((r) => {
        if (statusOf(r.id) === 'none') return null
        const right = r.cx >= 120
        const lx = right ? 214 : 26
        return (
          <g key={`lbl-${r.id}`} pointerEvents="none" opacity={selectedId === r.id ? 1 : 0.5}>
            <line
              x1={r.cx} y1={r.cy} x2={lx} y2={r.cy}
              stroke={colorOf(r.id)} strokeWidth="0.8" strokeDasharray="2 3"
            />
            <text
              x={right ? lx + 3 : lx - 3} y={r.cy + 3}
              textAnchor={right ? 'start' : 'end'}
              className="font-mono"
              fontSize="8"
              fill={colorOf(r.id)}
            >
              {r.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/** The silhouette, reused for both the halo and the body itself. */
function BodyShape(props: React.SVGProps<SVGGElement>) {
  return (
    <g {...props}>
      <ellipse cx="120" cy="44" rx="25" ry="30" />
      <rect x="112" y="70" width="16" height="16" rx="6" />
      <path d="M86 92 q34 -12 68 0 l6 60 q-6 46 -10 84 q-30 8 -60 0 q-4 -38 -10 -84 Z" />
      <rect x="50" y="98" width="26" height="128" rx="13" />
      <rect x="164" y="98" width="26" height="128" rx="13" />
      <ellipse cx="63" cy="240" rx="11" ry="15" />
      <ellipse cx="177" cy="240" rx="11" ry="15" />
      <path d="M92 232 q28 8 56 0 l-4 92 l-6 96 h-16 l-6 -96 l-4 -50 l-4 50 l-6 96 h-16 l-6 -96 Z" />
      <ellipse cx="102" cy="428" rx="10" ry="7" />
      <ellipse cx="138" cy="428" rx="10" ry="7" />
    </g>
  )
}
