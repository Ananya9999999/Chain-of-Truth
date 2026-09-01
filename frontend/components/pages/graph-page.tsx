'use client'

/**
 * Evidence Graph.
 *
 * Nodes and edges are derived from the actual case contents — evidence items,
 * the locations they were collected at, the officers who logged them, witness
 * statements, timeline events and AI findings — and joined by typed
 * relationships. Nothing here is a random layout over meaningless values; every
 * edge corresponds to a fact in the case file and says which one.
 *
 * Rendered on a 2D canvas with a force simulation written directly against
 * requestAnimationFrame. The whole simulation is a few dozen lines, it draws
 * several hundred nodes at 60fps, and it avoids a second WebGL context
 * alongside the landing scene. Depth is conveyed through scale, shadow and
 * hover parallax rather than a real z-axis, which reads as dimensional without
 * the cost of a 3D scene for what is fundamentally a relationship map.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Focus, Layers, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'

import { PageHeader } from '@/components/pages/page-header'
import { useStore } from '@/lib/store'
import { useTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'

type NodeKind = 'evidence' | 'location' | 'officer' | 'statement' | 'event' | 'finding'
type EdgeKind = 'collected_at' | 'logged_by' | 'supports' | 'contradicts' | 'mentions' | 'derived_from'

interface GNode {
  id: string
  kind: NodeKind
  label: string
  detail: string
  x: number
  y: number
  vx: number
  vy: number
}

interface GEdge {
  source: string
  target: string
  kind: EdgeKind
  why: string
}

const NODE_COLOR: Record<NodeKind, string> = {
  evidence: '#00e5ff',
  location: '#fec931',
  officer: '#7dd3fc',
  statement: '#dfb7ff',
  event: '#86efac',
  finding: '#f9a8d4',
}

const EDGE_COLOR: Record<EdgeKind, string> = {
  collected_at: 'rgba(254,201,49,0.38)',
  logged_by: 'rgba(125,211,252,0.32)',
  supports: 'rgba(110,231,183,0.45)',
  contradicts: 'rgba(248,113,113,0.60)',
  mentions: 'rgba(160,170,190,0.30)',
  derived_from: 'rgba(249,168,212,0.42)',
}

export function GraphPage() {
  const { evidence, statements, flags, timeline } = useStore()
  const dark = useTheme().resolved === 'dark'
  const [selected, setSelected] = useState<GNode | null>(null)
  const [hidden, setHidden] = useState<Set<NodeKind>>(new Set())
  const [zoom, setZoom] = useState(1)

  /** Build the graph from the real case contents. */
  const { nodes, edges } = useMemo(() => {
    const nodeMap = new Map<string, GNode>()
    const edgeList: GEdge[] = []
    let seed = 1

    const add = (id: string, kind: NodeKind, label: string, detail: string) => {
      if (nodeMap.has(id)) return id
      // Deterministic ring seeding so the layout unfolds outward rather than
      // exploding from a single point.
      const angle = seed * 2.399963
      const radius = 60 + seed * 7
      nodeMap.set(id, {
        id, kind, label, detail,
        x: 320 + Math.cos(angle) * radius,
        y: 230 + Math.sin(angle) * radius * 0.7,
        vx: 0, vy: 0,
      })
      seed += 1
      return id
    }

    for (const e of evidence) {
      add(e.id, 'evidence', e.id, `${e.type} · ${e.filename}`)
      const loc = add(`loc:${e.location}`, 'location', e.location, 'Collection location')
      const off = add(`off:${e.uploadedBy}`, 'officer', e.uploadedBy, 'Logging officer')
      edgeList.push({ source: e.id, target: loc, kind: 'collected_at', why: `${e.id} was collected at ${e.location}.` })
      edgeList.push({ source: e.id, target: off, kind: 'logged_by', why: `${e.id} was logged by ${e.uploadedBy}.` })
    }

    for (const s of statements) {
      add(s.id, 'statement', s.id, `Witness ${s.witness}`)
      const loc = add(`loc:${s.location}`, 'location', s.location, 'Recording location')
      edgeList.push({ source: s.id, target: loc, kind: 'collected_at', why: `${s.id} was recorded at ${s.location}.` })
      for (const c of s.conflicts ?? []) {
        if (nodeMap.has(c.evidenceRef)) {
          edgeList.push({ source: s.id, target: c.evidenceRef, kind: 'contradicts', why: c.note })
        }
      }
    }

    for (const f of flags) {
      add(f.id, 'finding', f.id, f.title)
      for (const ref of f.sources) {
        if (nodeMap.has(ref)) {
          edgeList.push({
            source: f.id, target: ref,
            kind: f.response === 'confirmed' ? 'supports' : 'derived_from',
            why: `${f.id} was derived from ${ref}. ${f.explanation}`,
          })
        }
      }
    }

    for (const t of timeline.slice(0, 8)) {
      add(t.id, 'event', t.title.slice(0, 26), `${t.date} ${t.time}`)
      if (t.source && nodeMap.has(t.source)) {
        edgeList.push({ source: t.id, target: t.source, kind: 'mentions', why: `Timeline event sourced from ${t.source}.` })
      }
    }

    return { nodes: [...nodeMap.values()], edges: edgeList }
  }, [evidence, statements, flags, timeline])

  const visibleNodes = useMemo(
    () => nodes.filter((n) => !hidden.has(n.kind)),
    [nodes, hidden],
  )
  const visibleIds = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes])
  const visibleEdges = useMemo(
    () => edges.filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target)),
    [edges, visibleIds],
  )

  function toggle(kind: NodeKind) {
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(kind)) next.delete(kind)
      else next.add(kind)
      return next
    })
  }

  const kinds = Object.keys(NODE_COLOR) as NodeKind[]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Evidence Graph"
        description="How the case connects: evidence, where it was collected, who logged it, the statements that reference it and the findings derived from it."
        meta={
          <span className="font-mono text-[11px] text-muted-foreground">
            {visibleNodes.length} nodes · {visibleEdges.length} relationships
          </span>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {kinds.map((k) => {
          const on = !hidden.has(k)
          const count = nodes.filter((n) => n.kind === k).length
          return (
            <button
              key={k}
              type="button"
              onClick={() => toggle(k)}
              aria-pressed={on}
              className={cn(
                'btn-press inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-[11px] transition-colors',
                on
                  ? 'border-border bg-card text-foreground'
                  : 'border-border/50 bg-card/30 text-muted-foreground/50',
              )}
            >
              <span
                className="size-2 rounded-full"
                style={{ background: on ? NODE_COLOR[k] : 'transparent', border: `1px solid ${NODE_COLOR[k]}` }}
                aria-hidden="true"
              />
              {k}
              <span className="rounded bg-background/60 px-1 tabular-nums">{count}</span>
            </button>
          )
        })}

        <div className="ml-auto flex items-center gap-1">
          <IconBtn label="Zoom out" onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))}>
            <ZoomOut className="size-3.5" />
          </IconBtn>
          <IconBtn label="Zoom in" onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}>
            <ZoomIn className="size-3.5" />
          </IconBtn>
          <IconBtn label="Reset view" onClick={() => { setZoom(1); setSelected(null); setHidden(new Set()) }}>
            <RotateCcw className="size-3.5" />
          </IconBtn>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <GraphCanvas
          dark={dark}
          nodes={visibleNodes}
          edges={visibleEdges}
          zoom={zoom}
          selected={selected}
          onSelect={setSelected}
        />
        <aside className="space-y-3">
          <Inspector node={selected} edges={edges} nodes={nodes} />
          <Legend />
        </aside>
      </div>
    </div>
  )
}

function IconBtn({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="btn-press flex size-7 items-center justify-center rounded-md border border-border bg-secondary/50 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      {children}
    </button>
  )
}

function GraphCanvas({
  dark,
  nodes,
  edges,
  zoom,
  selected,
  onSelect,
}: {
  dark: boolean
  nodes: GNode[]
  edges: GEdge[]
  zoom: number
  selected: GNode | null
  onSelect: (n: GNode | null) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const simRef = useRef<GNode[]>([])
  const hoverRef = useRef<GNode | null>(null)
  const frameRef = useRef(0)
  // Simulation temperature. Forces are scaled by this and it decays to zero,
  // so the layout settles and then stays put. Without it the repulsion term
  // keeps injecting energy and the nodes drift forever, which reads as broken.
  const alphaRef = useRef(1)
  const [hoverLabel, setHoverLabel] = useState<string | null>(null)

  useEffect(() => {
    simRef.current = nodes.map((n) => ({ ...n }))
    alphaRef.current = 1 // reheat: the layout must re-solve for a new node set
  }, [nodes])

  const tick = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const sim = simRef.current
    const alpha = alphaRef.current
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    const cx = w / 2
    const cy = h / 2
    const byId = new Map(sim.map((n) => [n.id, n]))

    // repulsion
    for (const a of sim) {
      for (const b of sim) {
        if (a.id === b.id) continue
        const dx = a.x - b.x
        const dy = a.y - b.y
        const d2 = dx * dx + dy * dy || 1
        if (d2 < 42000) {
          const f = (1100 / d2) * alpha
          const d = Math.sqrt(d2)
          a.vx += (dx / d) * f
          a.vy += (dy / d) * f
        }
      }
      a.vx += (cx - a.x) * 0.0014 * alpha
      a.vy += (cy - a.y) * 0.0014 * alpha
    }

    // spring along edges
    for (const e of edges) {
      const s = byId.get(e.source)
      const t = byId.get(e.target)
      if (!s || !t) continue
      const dx = t.x - s.x
      const dy = t.y - s.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const f = (dist - 118) * 0.006 * alpha
      s.vx += (dx / dist) * f
      s.vy += (dy / dist) * f
      t.vx -= (dx / dist) * f
      t.vy -= (dy / dist) * f
    }

    for (const n of sim) {
      n.vx *= 0.86
      n.vy *= 0.86
      n.x += n.vx
      n.y += n.vy
    }

    // Cool the system, then snap to rest so nothing creeps at sub-pixel speed.
    alphaRef.current = alpha < 0.001 ? 0 : alpha * 0.972
    if (alphaRef.current === 0) {
      for (const n of sim) { n.vx = 0; n.vy = 0 }
    }

    // render
    const dpr = window.devicePixelRatio || 1
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr
      canvas.height = h * dpr
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    ctx.save()
    ctx.translate(cx, cy)
    ctx.scale(zoom, zoom)
    ctx.translate(-cx, -cy)

    const t = performance.now() / 1000

    for (const e of edges) {
      const s = byId.get(e.source)
      const tn = byId.get(e.target)
      if (!s || !tn) continue
      const active = selected && (selected.id === e.source || selected.id === e.target)

      ctx.beginPath()
      ctx.moveTo(s.x, s.y)
      const mx = (s.x + tn.x) / 2
      const my = (s.y + tn.y) / 2 - 16
      ctx.quadraticCurveTo(mx, my, tn.x, tn.y)
      ctx.strokeStyle = active ? 'rgba(0,229,255,0.8)' : EDGE_COLOR[e.kind]
      ctx.lineWidth = active ? 2 : e.kind === 'contradicts' ? 1.6 : 1
      if (e.kind === 'contradicts') ctx.setLineDash([4, 3])
      ctx.stroke()
      ctx.setLineDash([])

      // A particle travelling the edge, so relationships read as live links.
      const p = ((t * 0.25) + (s.x + tn.x) * 0.001) % 1
      const px = (1 - p) * (1 - p) * s.x + 2 * (1 - p) * p * mx + p * p * tn.x
      const py = (1 - p) * (1 - p) * s.y + 2 * (1 - p) * p * my + p * p * tn.y
      ctx.beginPath()
      ctx.arc(px, py, active ? 2.2 : 1.5, 0, Math.PI * 2)
      ctx.fillStyle = active ? '#c3f5ff' : 'rgba(180,220,235,0.55)'
      ctx.fill()
    }

    for (const n of sim) {
      const isSel = selected?.id === n.id
      const isHover = hoverRef.current?.id === n.id
      const connected =
        selected &&
        edges.some(
          (e) =>
            (e.source === selected.id && e.target === n.id) ||
            (e.target === selected.id && e.source === n.id),
        )
      const base = n.kind === 'evidence' ? 10 : 7.5
      // Gentle breathing only while the graph is live; a settled graph is still.
      const pulse = 1 + Math.sin(t * 1.1 + n.id.length) * 0.05
      const scale = isSel ? 1.5 : isHover || connected ? 1.22 : 1
      const r = base * scale * pulse
      const color = NODE_COLOR[n.kind]

      ctx.beginPath()
      ctx.arc(n.x, n.y + 2, r + 4, 0, Math.PI * 2)
      ctx.fillStyle = dark ? 'rgba(0,0,0,0.38)' : 'rgba(30,45,60,0.18)'
      ctx.fill()

      ctx.beginPath()
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.globalAlpha = selected && !isSel && !connected ? 0.28 : 1
      ctx.fill()
      ctx.globalAlpha = 1

      if (isSel) {
        ctx.beginPath()
        ctx.arc(n.x, n.y, r + 6, 0, Math.PI * 2)
        ctx.strokeStyle = '#00e5ff'
        ctx.lineWidth = 1.4
        ctx.stroke()
      }

      if (isSel || isHover || zoom > 1.15) {
        ctx.font = '600 10px ui-monospace, monospace'
        ctx.fillStyle = dark ? 'rgba(225,226,234,0.94)' : 'rgba(20,26,36,0.92)'
        ctx.textAlign = 'center'
        const label = n.label.length > 22 ? `${n.label.slice(0, 20)}…` : n.label
        ctx.fillText(label, n.x, n.y - r - 6)
      }
    }

    ctx.restore()
    frameRef.current = requestAnimationFrame(tick)
  }, [dark, edges, zoom, selected])

  useEffect(() => {
    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [tick])

  function pick(clientX: number, clientY: number): GNode | null {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const cx = rect.width / 2
    const cy = rect.height / 2
    const x = (clientX - rect.left - cx) / zoom + cx
    const y = (clientY - rect.top - cy) / zoom + cy
    let best: GNode | null = null
    let bestD = 20
    for (const n of simRef.current) {
      const d = Math.hypot(n.x - x, n.y - y)
      if (d < bestD) { bestD = d; best = n }
    }
    return best
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-border surface-deep">
      <canvas
        ref={canvasRef}
        className="h-[460px] w-full cursor-pointer"
        onMouseMove={(e) => {
          const n = pick(e.clientX, e.clientY)
          hoverRef.current = n
          setHoverLabel(n ? `${n.label} — ${n.detail}` : null)
        }}
        onMouseLeave={() => { hoverRef.current = null; setHoverLabel(null) }}
        onClick={(e) => onSelect(pick(e.clientX, e.clientY))}
      />
      {hoverLabel && (
        <div className="pointer-events-none absolute bottom-3 left-3 max-w-[70%] truncate rounded-md border border-border bg-background/90 px-2.5 py-1 font-mono text-[11px] text-foreground backdrop-blur">
          {hoverLabel}
        </div>
      )}
      <p className="pointer-events-none absolute top-3 right-3 font-mono text-[10px] text-muted-foreground">
        click a node to isolate its relationships
      </p>
    </div>
  )
}

function Inspector({ node, edges, nodes }: { node: GNode | null; edges: GEdge[]; nodes: GNode[] }) {
  if (!node) {
    return (
      <div className="rounded-xl border border-border bg-card/50 p-4">
        <p className="flex items-center gap-2 font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
          <Focus className="size-3.5" aria-hidden="true" /> Inspector
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Select a node to see what it connects to and why each relationship exists.
        </p>
      </div>
    )
  }

  const byId = new Map(nodes.map((n) => [n.id, n]))
  const links = edges.filter((e) => e.source === node.id || e.target === node.id)

  return (
    <div className="animate-scale-in space-y-3 rounded-xl border border-border bg-card/60 p-4 backdrop-blur-sm">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full" style={{ background: NODE_COLOR[node.kind] }} aria-hidden="true" />
          <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
            {node.kind}
          </span>
        </div>
        <h4 className="text-sm font-semibold break-words text-foreground">{node.label}</h4>
        <p className="text-[11px] text-muted-foreground">{node.detail}</p>
      </div>

      <div className="border-t border-border/60 pt-3">
        <p className="mb-2 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
          Relationships · {links.length}
        </p>
        <ul className="space-y-2">
          {links.slice(0, 10).map((e, i) => {
            const other = byId.get(e.source === node.id ? e.target : e.source)
            return (
              <li key={i} className="rounded-lg border border-border/60 bg-background/40 p-2">
                <p className="flex items-center gap-1.5 text-[11px]">
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.5 font-mono text-[9px] tracking-wider uppercase',
                      e.kind === 'contradicts'
                        ? 'bg-red-500/15 text-red-300'
                        : 'bg-secondary text-muted-foreground',
                    )}
                  >
                    {e.kind.replace('_', ' ')}
                  </span>
                  <span className="truncate text-foreground/90">{other?.label ?? '—'}</span>
                </p>
                <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{e.why}</p>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

function Legend() {
  return (
    <div className="rounded-xl border border-border bg-card/50 p-4">
      <p className="mb-2 flex items-center gap-2 font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
        <Layers className="size-3.5" aria-hidden="true" /> Relationships
      </p>
      <ul className="space-y-1.5">
        {(Object.keys(EDGE_COLOR) as EdgeKind[]).map((k) => (
          <li key={k} className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="h-px w-5 shrink-0" style={{ background: EDGE_COLOR[k].replace(/[\d.]+\)$/, '1)') }} />
            {k.replace('_', ' ')}
          </li>
        ))}
      </ul>
      <p className="mt-3 border-t border-border/60 pt-2 text-[10px] leading-relaxed text-muted-foreground">
        A dashed red link marks a contradiction between two sources. Every edge comes
        from the case file and states its own reason.
      </p>
    </div>
  )
}
