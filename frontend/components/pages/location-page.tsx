'use client'

/**
 * Forensic Map — a real street map with the case overlaid on it.
 *
 * Actual OpenStreetMap tiles, true Web-Mercator projection, drag-to-pan,
 * scroll-to-zoom. The forensic look comes from a canvas filter over standard
 * tiles rather than a vendor-specific dark tile set, so the map does not break
 * if one provider is unreachable — and it falls back to a coordinate grid
 * rather than going blank.
 *
 * Only case data is drawn on top. No streets or landmarks are invented; the
 * basemap supplies the real world, the overlay supplies the case.
 */

import { useCallback, useMemo, useState } from 'react'
import {
  Camera,
  Crosshair,
  Layers,
  MapPin,
  Minus,
  Plus,
  Radar,
  RotateCcw,
  Video,
} from 'lucide-react'
import { motion } from 'motion/react'

import { PageHeader } from '@/components/pages/page-header'
import { TileMap, type LatLng } from '@/components/map/tile-map'
import { useStore } from '@/lib/store'
import { useTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'

type MarkerKind = 'incident' | 'cctv' | 'evidence' | 'sighting'

interface MapPoint {
  id: string
  kind: MarkerKind
  label: string
  lng: number
  lat: number
  time: string
  relevance: string
  evidence: string[]
  priority?: number
}

/** Simulated positions for the demo case, around central Bengaluru. */
const POINTS: MapPoint[] = [
  { id: 'P1', kind: 'incident', label: 'Riverside Lot B — reported theft', lng: 77.5946, lat: 12.9716, time: '29 Aug · 21:00', relevance: 'Reported point of origin for the incident.', evidence: ['EVD-0091', 'EVD-0093'], priority: 92 },
  { id: 'P2', kind: 'cctv', label: 'CAM-07 — MG Road junction', lng: 77.5991, lat: 12.9738, time: '29 Aug · 21:47', relevance: 'Subject recorded exiting frame northbound.', evidence: ['EVD-0091'], priority: 88 },
  { id: 'P3', kind: 'cctv', label: 'CAM-12 — Brigade cross', lng: 77.6061, lat: 12.9749, time: '29 Aug · 21:58', relevance: 'Second sighting on the same northbound route.', evidence: ['EVD-0095'] },
  { id: 'P4', kind: 'evidence', label: 'Recovery point — storm drain', lng: 77.6098, lat: 12.9805, time: '30 Aug · 07:30', relevance: 'Item recovered and logged with GPS metadata.', evidence: ['EVD-0094'] },
  { id: 'P5', kind: 'sighting', label: 'Witness sighting — bus stand', lng: 77.6075, lat: 12.9790, time: '29 Aug · 22:12', relevance: 'Uncorroborated account; lower source reliability.', evidence: ['STM-0041'] },
]

const ROUTE = ['P1', 'P2', 'P3', 'P5', 'P4']

const KIND_META: Record<MarkerKind, { color: string; icon: typeof MapPin; label: string }> = {
  incident: { color: '#ff5f6d', icon: Crosshair, label: 'Incident' },
  cctv: { color: '#00e5ff', icon: Video, label: 'CCTV' },
  evidence: { color: '#34d399', icon: Camera, label: 'Evidence' },
  sighting: { color: '#fbbf24', icon: MapPin, label: 'Sighting' },
}

const DEFAULT_CENTER: LatLng = { lat: 12.9762, lng: 77.6015 }

export function LocationPage() {
  const { evidence } = useStore()
  const { resolved } = useTheme()
  const dark = resolved === 'dark'

  const [center, setCenter] = useState<LatLng>(DEFAULT_CENTER)
  const [zoom, setZoom] = useState(14.4)
  const [selected, setSelected] = useState<MapPoint | null>(null)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [hidden, setHidden] = useState<Set<MarkerKind>>(new Set())

  const visible = useMemo(() => POINTS.filter((p) => !hidden.has(p.kind)), [hidden])

  /** Overlay painter: route, priority sweep, markers, labels. */
  const paint = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      toScreen: (lng: number, lat: number) => { x: number; y: number },
    ) => {
      const now = performance.now() / 1000

      // ── movement route ──
      const pts = ROUTE.map((id) => POINTS.find((p) => p.id === id)).filter(
        (p): p is MapPoint => !!p && !hidden.has(p.kind),
      )
      if (pts.length > 1) {
        ctx.strokeStyle = dark ? 'rgba(0,229,255,0.85)' : 'rgba(0,120,160,0.85)'
        ctx.lineWidth = 2.5
        ctx.setLineDash([7, 5])
        ctx.lineJoin = 'round'
        ctx.beginPath()
        pts.forEach((p, i) => {
          const s = toScreen(p.lng, p.lat)
          if (i === 0) ctx.moveTo(s.x, s.y)
          else ctx.lineTo(s.x, s.y)
        })
        ctx.stroke()
        ctx.setLineDash([])

        // direction-of-travel pulse
        const t = (now / 4.5) % 1
        const seg = t * (pts.length - 1)
        const i = Math.min(pts.length - 2, Math.floor(seg))
        const f = seg - i
        const a = toScreen(pts[i].lng, pts[i].lat)
        const b = toScreen(pts[i + 1].lng, pts[i + 1].lat)
        ctx.beginPath()
        ctx.arc(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f, 4, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'
        ctx.shadowColor = '#00e5ff'
        ctx.shadowBlur = 10
        ctx.fill()
        ctx.shadowBlur = 0
      }

      // ── markers ──
      for (const p of visible) {
        const s = toScreen(p.lng, p.lat)
        const meta = KIND_META[p.kind]
        const isSel = selected?.id === p.id
        const isHover = hoverId === p.id

        if (p.priority) {
          const phase = (now * 0.4) % 1
          ctx.beginPath()
          ctx.arc(s.x, s.y, 12 + phase * 40, 0, Math.PI * 2)
          ctx.strokeStyle = meta.color
          ctx.globalAlpha = (1 - phase) * 0.5
          ctx.lineWidth = 1.5
          ctx.stroke()
          ctx.globalAlpha = 1
        }

        // teardrop pin, like a consumer map
        const r = isSel ? 11 : isHover ? 10 : 8.5
        ctx.save()
        ctx.shadowColor = 'rgba(0,0,0,0.55)'
        ctx.shadowBlur = 8
        ctx.shadowOffsetY = 2
        ctx.beginPath()
        ctx.arc(s.x, s.y - r, r, Math.PI * 0.85, Math.PI * 0.15)
        ctx.lineTo(s.x, s.y + r * 0.55)
        ctx.closePath()
        ctx.fillStyle = meta.color
        ctx.fill()
        ctx.restore()

        ctx.beginPath()
        ctx.arc(s.x, s.y - r, r * 0.42, 0, Math.PI * 2)
        ctx.fillStyle = dark ? '#06090e' : '#ffffff'
        ctx.fill()

        if (isSel || isHover || zoom >= 15.5) {
          const text = p.label.length > 34 ? `${p.label.slice(0, 32)}…` : p.label
          ctx.font = '600 11px ui-monospace, monospace'
          const tw = ctx.measureText(text).width
          const bx = s.x - tw / 2 - 6
          const by = s.y - r * 2 - 24
          ctx.fillStyle = dark ? 'rgba(6,9,14,0.92)' : 'rgba(255,255,255,0.95)'
          ctx.strokeStyle = meta.color
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.roundRect(bx, by, tw + 12, 19, 4)
          ctx.fill()
          ctx.stroke()
          ctx.fillStyle = dark ? '#e1e2ea' : '#101319'
          ctx.textAlign = 'center'
          ctx.fillText(text, s.x, by + 13)
          ctx.textAlign = 'left'
        }
      }
    },
    [dark, hidden, hoverId, selected, visible, zoom],
  )

  /** Hit-test in screen space using the same projection the map uses. */
  const hitTest = useCallback(
    (p: { x: number; y: number }, w: number, h: number): MapPoint | null => {
      const worldSize = 256 * Math.pow(2, zoom)
      const cp = {
        x: (center.lng + 180) / 360,
        y:
          0.5 -
          Math.log(
            (1 + Math.sin((center.lat * Math.PI) / 180)) /
              (1 - Math.sin((center.lat * Math.PI) / 180)),
          ) /
            (4 * Math.PI),
      }
      let best: MapPoint | null = null
      let bestD = 22
      for (const pt of visible) {
        const q = { x: (pt.lng + 180) / 360, y: 0.5 - Math.log((1 + Math.sin((pt.lat * Math.PI) / 180)) / (1 - Math.sin((pt.lat * Math.PI) / 180))) / (4 * Math.PI) }
        const sx = w / 2 + (q.x - cp.x) * worldSize
        const sy = h / 2 + (q.y - cp.y) * worldSize
        const d = Math.hypot(sx - p.x, sy - p.y + 9)
        if (d < bestD) { bestD = d; best = pt }
      }
      return best
    },
    [center, visible, zoom],
  )

  const mapSize = useRef2()

  function toggle(kind: MarkerKind) {
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(kind)) next.delete(kind)
      else next.add(kind)
      return next
    })
  }

  function reset() {
    setCenter(DEFAULT_CENTER)
    setZoom(14.4)
    setSelected(null)
    setHidden(new Set())
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Forensic Map"
        description="Evidence, CCTV and sighting locations on a real street map, with the derived movement route between them."
        meta={
          <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2.5 py-1 font-mono text-[10px] font-bold tracking-wider text-amber-300">
            SIMULATED DEMO LOCATIONS
          </span>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Layers className="size-3.5 text-muted-foreground" aria-hidden="true" />
        {(Object.keys(KIND_META) as MarkerKind[]).map((kind) => {
          const meta = KIND_META[kind]
          const Icon = meta.icon
          const on = !hidden.has(kind)
          return (
            <button
              key={kind}
              type="button"
              onClick={() => toggle(kind)}
              aria-pressed={on}
              className={cn(
                'btn-press inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-mono text-[11px] transition-colors',
                on ? 'border-border bg-card text-foreground'
                   : 'border-border/50 bg-card/30 text-muted-foreground/60',
              )}
            >
              <span className="size-2 rounded-full"
                style={{ background: on ? meta.color : 'transparent', border: `1px solid ${meta.color}` }} />
              <Icon className="size-3" aria-hidden="true" />
              {meta.label}
            </button>
          )
        })}
        <div className="ml-auto flex items-center gap-1">
          <MapBtn label="Zoom out" onClick={() => setZoom((z) => Math.max(3, z - 1))}><Minus className="size-3.5" /></MapBtn>
          <MapBtn label="Zoom in" onClick={() => setZoom((z) => Math.min(19, z + 1))}><Plus className="size-3.5" /></MapBtn>
          <MapBtn label="Reset view" onClick={reset}><RotateCcw className="size-3.5" /></MapBtn>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div
          ref={mapSize.ref}
          className="relative h-[480px] overflow-hidden rounded-xl border border-border"
        >
          <TileMap
            center={center}
            zoom={zoom}
            dark={dark}
            onCenterChange={setCenter}
            onZoomChange={setZoom}
            draw={paint}
            cursor={hoverId ? 'pointer' : 'grab'}
            className="absolute inset-0"
            onHover={(p) => setHoverId(hitTest(p, mapSize.w, mapSize.h)?.id ?? null)}
            onClick={(p) => setSelected(hitTest(p, mapSize.w, mapSize.h))}
          />
          <p className="pointer-events-none absolute top-3 right-3 rounded-md border border-border bg-background/80 px-2 py-1 font-mono text-[10px] text-muted-foreground backdrop-blur">
            drag · scroll to zoom · z{zoom.toFixed(1)}
          </p>
        </div>

        <aside className="space-y-3">
          {selected ? (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 rounded-xl border border-border bg-card/70 p-4 backdrop-blur-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] tracking-wider uppercase"
                    style={{ color: KIND_META[selected.kind].color }}>
                    {KIND_META[selected.kind].label}
                  </p>
                  <h3 className="mt-0.5 text-sm font-semibold text-foreground">{selected.label}</h3>
                </div>
                {selected.priority && (
                  <span className="shrink-0 rounded border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] text-amber-300">
                    {selected.priority}
                  </span>
                )}
              </div>
              <dl className="space-y-2 text-[11px]">
                <Row label="Timestamp" value={selected.time} mono />
                <Row label="Coordinates" value={`${selected.lat.toFixed(4)}, ${selected.lng.toFixed(4)}`} mono />
                <Row label="Case relevance" value={selected.relevance} />
              </dl>
              <div>
                <p className="mb-1.5 font-mono text-[9px] tracking-wider text-muted-foreground uppercase">
                  Associated evidence
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selected.evidence.map((ref) => (
                    <span key={ref}
                      className={cn('rounded border px-2 py-0.5 font-mono text-[10px]',
                        evidence.some((e) => e.id === ref)
                          ? 'border-primary/40 bg-primary/10 text-primary'
                          : 'border-border bg-background/60 text-muted-foreground')}>
                      {ref}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button"
                  onClick={() => { setCenter({ lat: selected.lat, lng: selected.lng }); setZoom(17) }}
                  className="btn-press flex-1 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-[11px] text-primary transition-colors hover:bg-primary/20">
                  Zoom to point
                </button>
                <button type="button" onClick={() => setSelected(null)}
                  className="btn-press flex-1 rounded-lg border border-border bg-secondary/60 px-3 py-1.5 text-[11px] transition-colors hover:bg-secondary">
                  Clear
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="rounded-xl border border-border bg-card/50 p-4">
              <p className="flex items-center gap-2 font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                <MapPin className="size-3.5" aria-hidden="true" /> Location inspector
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Click a pin for its timestamp, coordinates, case relevance and the evidence
                recorded there.
              </p>
            </div>
          )}

          <div className="rounded-xl border border-border bg-card/50 p-4">
            <p className="mb-2 flex items-center gap-2 font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
              <Radar className="size-3.5" aria-hidden="true" /> Priority sweep
            </p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              The expanding ring marks locations scored highest by the rule-based heuristic
              — recency, source reliability and corroboration. It prioritises where to
              search; it does not predict where anyone is.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}

/** Tracks the map container's pixel size for hit-testing. */
function useRef2() {
  const [size, setSize] = useState({ w: 0, h: 0 })
  const ref = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    const update = () => setSize({ w: node.clientWidth, h: node.clientHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(node)
  }, [])
  return { ref, w: size.w, h: size.h }
}

function MapBtn({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label}
      className="btn-press flex size-7 items-center justify-center rounded-md border border-border bg-secondary/50 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
      {children}
    </button>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="font-mono text-[9px] tracking-wider text-muted-foreground uppercase">{label}</dt>
      <dd className={cn('text-foreground', mono ? 'font-mono' : 'leading-relaxed text-muted-foreground')}>
        {value}
      </dd>
    </div>
  )
}
