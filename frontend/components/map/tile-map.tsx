'use client'

/**
 * A real slippy map — actual street tiles, drawn on canvas.
 *
 * Renders OpenStreetMap raster tiles with true Web-Mercator projection, smooth
 * fractional zoom, drag-to-pan and scroll-to-zoom, exactly like any consumer
 * map. Markers are drawn on top in the forensic palette.
 *
 * Two deliberate choices:
 *
 *  - **OSM, not CARTO.** CARTO's `basemaps.cartocdn.com` is on common ad-block
 *    lists and fails in the browser with status 0 while working fine from a
 *    terminal — which is exactly the failure this app hit. `tile.openstreetmap.org`
 *    is a mapping domain and is not typically blocked.
 *  - **Dark styling via canvas filter, not a dark tile set.** Inverting and
 *    hue-rotating the standard tiles produces a dark map from any provider, so
 *    the forensic look does not depend on one vendor staying up.
 *
 * If tiles fail anyway, the map degrades to a coordinate graticule rather than
 * going blank, and says so on screen.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

export interface LatLng {
  lat: number
  lng: number
}

const TILE = 256

const PROVIDERS = [
  { name: 'osm', url: (z: number, x: number, y: number) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png` },
  { name: 'osm-a', url: (z: number, x: number, y: number) => `https://a.tile.openstreetmap.org/${z}/${x}/${y}.png` },
] as const

export function project(lng: number, lat: number) {
  const x = (lng + 180) / 360
  const s = Math.min(0.9999, Math.max(-0.9999, Math.sin((lat * Math.PI) / 180)))
  const y = 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)
  return { x, y }
}

export function unproject(x: number, y: number) {
  return {
    lng: x * 360 - 180,
    lat: (Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180) / Math.PI,
  }
}

/** Shared image cache so panning back over a tile is instant. */
const cache = new Map<string, HTMLImageElement>()
const failed = new Set<string>()

export interface TileMapHandle {
  toScreen: (lng: number, lat: number) => { x: number; y: number }
  redraw: () => void
}

export function TileMap({
  center,
  zoom,
  dark,
  onCenterChange,
  onZoomChange,
  onClick,
  onHover,
  draw,
  className,
  cursor,
}: {
  center: LatLng
  zoom: number
  dark: boolean
  onCenterChange: (c: LatLng) => void
  onZoomChange: (z: number) => void
  onClick?: (p: { x: number; y: number }) => void
  onHover?: (p: { x: number; y: number }) => void
  /** Overlay painter. Receives a projector so callers work in lat/lng. */
  draw?: (
    ctx: CanvasRenderingContext2D,
    toScreen: (lng: number, lat: number) => { x: number; y: number },
    size: { w: number; h: number },
  ) => void
  className?: string
  cursor?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frame = useRef(0)
  const drag = useRef<{ px: number; py: number; c: LatLng } | null>(null)
  const [tilesOk, setTilesOk] = useState(true)

  const centerRef = useRef(center)
  const zoomRef = useRef(zoom)
  centerRef.current = center
  zoomRef.current = zoom

  const drawRef = useRef(draw)
  drawRef.current = draw

  const loadTile = useCallback((z: number, x: number, y: number): HTMLImageElement | null => {
    const key = `${z}/${x}/${y}`
    const hit = cache.get(key)
    if (hit) return hit.complete && hit.naturalWidth > 0 ? hit : null
    if (failed.has(key)) return null

    const img = new Image()
    img.crossOrigin = 'anonymous'
    let attempt = 0
    const tryLoad = () => {
      if (attempt >= PROVIDERS.length) {
        failed.add(key)
        // One systemic failure is enough to switch to the graticule; retrying
        // every tile would just stall the map.
        if (failed.size > 4) setTilesOk(false)
        return
      }
      img.src = PROVIDERS[attempt].url(z, x, y)
      attempt += 1
    }
    img.onerror = tryLoad
    img.onload = () => setTilesOk(true)
    tryLoad()
    cache.set(key, img)
    return null
  }, [])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const w = canvas.clientWidth
    const h = canvas.clientHeight
    const dpr = window.devicePixelRatio || 1
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr
      canvas.height = h * dpr
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)

    const z = zoomRef.current
    const c = centerRef.current
    const zInt = Math.round(z)
    // Fractional zoom is achieved by scaling the integer tile level.
    const tileScale = TILE * Math.pow(2, z - zInt)
    const worldSize = tileScale * Math.pow(2, zInt)
    const cp = project(c.lng, c.lat)

    const toScreen = (lng: number, lat: number) => {
      const p = project(lng, lat)
      return {
        x: w / 2 + (p.x - cp.x) * worldSize,
        y: h / 2 + (p.y - cp.y) * worldSize,
      }
    }

    ctx.fillStyle = dark ? '#0a0d13' : '#e8eaee'
    ctx.fillRect(0, 0, w, h)

    if (tilesOk) {
      const n = Math.pow(2, zInt)
      const originX = cp.x * n * tileScale - w / 2
      const originY = cp.y * n * tileScale - h / 2
      const x0 = Math.floor(originX / tileScale)
      const y0 = Math.floor(originY / tileScale)
      const x1 = Math.ceil((originX + w) / tileScale)
      const y1 = Math.ceil((originY + h) / tileScale)

      // Invert + hue-rotate turns light OSM tiles into a dark forensic basemap,
      // so the styling does not depend on any one vendor's dark tile set.
      ctx.filter = dark
        ? 'invert(1) hue-rotate(180deg) saturate(0.55) brightness(0.92) contrast(0.95)'
        : 'saturate(0.85) contrast(0.95)'

      for (let tx = x0; tx <= x1; tx++) {
        for (let ty = y0; ty <= y1; ty++) {
          if (ty < 0 || ty >= n) continue
          const wrapped = ((tx % n) + n) % n
          const img = loadTile(zInt, wrapped, ty)
          const sx = tx * tileScale - originX
          const sy = ty * tileScale - originY
          if (img) {
            ctx.drawImage(img, sx, sy, tileScale + 1, tileScale + 1)
          } else {
            ctx.fillStyle = dark ? '#11151d' : '#dfe3e8'
            ctx.fillRect(sx, sy, tileScale, tileScale)
          }
        }
      }
      ctx.filter = 'none'

      // Slight tint unifies the tiles with the forensic palette.
      if (dark) {
        ctx.fillStyle = 'rgba(8, 20, 30, 0.30)'
        ctx.fillRect(0, 0, w, h)
      }
    } else {
      // Graticule fallback — still a real projection, just no imagery.
      const step = z >= 15 ? 0.002 : z >= 13 ? 0.005 : 0.02
      ctx.strokeStyle = dark ? 'rgba(120,200,220,0.12)' : 'rgba(60,90,110,0.18)'
      ctx.lineWidth = 1
      for (let i = -40; i <= 40; i++) {
        const lng = Math.round(c.lng / step) * step + i * step
        const { x } = toScreen(lng, c.lat)
        if (x < 0 || x > w) continue
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
      }
      for (let i = -40; i <= 40; i++) {
        const lat = Math.round(c.lat / step) * step + i * step
        const { y } = toScreen(c.lng, lat)
        if (y < 0 || y > h) continue
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
      }
    }

    drawRef.current?.(ctx, toScreen, { w, h })

    // scale bar — true ground distance at this latitude
    const mpp = (156543.03392 * Math.cos((c.lat * Math.PI) / 180)) / Math.pow(2, z)
    const barPx = 80
    const metres = mpp * barPx
    const label = metres >= 1000 ? `${(metres / 1000).toFixed(1)} km` : `${Math.round(metres)} m`
    ctx.strokeStyle = dark ? 'rgba(225,226,234,0.75)' : 'rgba(20,25,35,0.75)'
    ctx.fillStyle = ctx.strokeStyle
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(w - barPx - 16, h - 20); ctx.lineTo(w - 16, h - 20)
    ctx.moveTo(w - barPx - 16, h - 24); ctx.lineTo(w - barPx - 16, h - 16)
    ctx.moveTo(w - 16, h - 24); ctx.lineTo(w - 16, h - 16)
    ctx.stroke()
    ctx.font = '9px ui-monospace, monospace'
    ctx.textAlign = 'center'
    ctx.fillText(label, w - barPx / 2 - 16, h - 27)
    ctx.textAlign = 'left'

    // attribution — required by the OSM tile usage policy
    if (tilesOk) {
      ctx.font = '9px system-ui, sans-serif'
      ctx.fillStyle = dark ? 'rgba(200,210,220,0.55)' : 'rgba(40,50,60,0.65)'
      ctx.fillText('© OpenStreetMap contributors', 6, h - 6)
    }

    frame.current = requestAnimationFrame(render)
  }, [dark, loadTile, tilesOk])

  useEffect(() => {
    frame.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(frame.current)
  }, [render])

  /* ------------------------------------------------------------ interaction */

  function localPoint(e: React.PointerEvent | React.MouseEvent) {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault()
    const next = Math.max(3, Math.min(19, zoomRef.current - Math.sign(e.deltaY) * 0.5))
    onZoomChange(next)
  }

  function onPointerDown(e: React.PointerEvent) {
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    const p = localPoint(e)
    drag.current = { px: p.x, py: p.y, c: centerRef.current }
  }

  function onPointerMove(e: React.PointerEvent) {
    const p = localPoint(e)
    if (!drag.current) {
      onHover?.(p)
      return
    }
    const z = zoomRef.current
    const worldSize = TILE * Math.pow(2, z)
    const start = project(drag.current.c.lng, drag.current.c.lat)
    onCenterChange(
      unproject(
        start.x - (p.x - drag.current.px) / worldSize,
        start.y - (p.y - drag.current.py) / worldSize,
      ),
    )
  }

  function onPointerUp(e: React.PointerEvent) {
    const p = localPoint(e)
    const moved =
      drag.current && Math.hypot(p.x - drag.current.px, p.y - drag.current.py) > 4
    drag.current = null
    if (!moved) onClick?.(p)
  }

  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        className="size-full touch-none"
        style={{ cursor: cursor ?? 'grab' }}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => { drag.current = null }}
      />
      {!tilesOk && (
        <p className="pointer-events-none absolute top-3 left-3 rounded-md border border-amber-400/40 bg-amber-500/10 px-2 py-1 font-mono text-[10px] text-amber-300 backdrop-blur">
          street tiles unreachable — coordinate grid only
        </p>
      )}
    </div>
  )
}
