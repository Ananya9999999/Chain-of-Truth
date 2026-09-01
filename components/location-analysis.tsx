'use client'

import { useEffect, useState } from 'react'
import {
  Activity,
  Compass,
  Crosshair,
  Info,
  MapPin,
  Navigation,
  Radar,
  Radio,
  ScanLine,
  Satellite,
  Signal,
  Target,
  Zap,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { searchLocations, type SearchLocation } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

function priorityColor(priority: number) {
  if (priority >= 75) return 'var(--danger)'
  if (priority >= 55) return 'var(--warning)'
  return 'var(--primary)'
}

function AnimatedScore({ value }: { value: number }) {
  const [score, setScore] = useState(0)

  useEffect(() => {
    let current = 0

    const timer = setInterval(() => {
      current += Math.max(1, Math.ceil(value / 25))

      if (current >= value) {
        current = value
        clearInterval(timer)
      }

      setScore(current)
    }, 35)

    return () => clearInterval(timer)
  }, [value])

  return <>{score}</>
}

const particles = [
  [12, 22],
  [24, 71],
  [37, 16],
  [58, 82],
  [69, 27],
  [81, 63],
  [91, 38],
  [47, 58],
]

export function LocationAnalysis() {
  const [selected, setSelected] = useState<SearchLocation>(
    searchLocations[0],
  )

  const [telemetry, setTelemetry] = useState(97)
  const [scanCount, setScanCount] = useState(1284)

  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetry((value) => {
        const next = value + (Math.random() > 0.5 ? 1 : -1)
        return Math.max(94, Math.min(99, next))
      })

      setScanCount((value) => value + Math.floor(Math.random() * 4) + 1)
    }, 1800)

    return () => clearInterval(timer)
  }, [])

  const selectedColor = priorityColor(selected.priority)

  return (
    <>
      <style jsx>{`
        @keyframes locationReveal {
          from {
            opacity: 0;
            transform: translateY(16px);
            filter: blur(5px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        @keyframes radarSweep {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @keyframes radarPulse {
          0% {
            transform: scale(0.55);
            opacity: 0.65;
          }

          100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }

        @keyframes markerPulse {
          0%,
          100% {
            transform: translate(-50%, -50%) scale(0.9);
          }

          50% {
            transform: translate(-50%, -50%) scale(1.08);
          }
        }

        @keyframes scannerHorizontal {
          0% {
            transform: translateX(-120%);
            opacity: 0;
          }

          20% {
            opacity: 0.8;
          }

          80% {
            opacity: 0.25;
          }

          100% {
            transform: translateX(500%);
            opacity: 0;
          }
        }

        @keyframes scannerVertical {
          0% {
            transform: translateY(-120%);
            opacity: 0;
          }

          20% {
            opacity: 0.7;
          }

          80% {
            opacity: 0.2;
          }

          100% {
            transform: translateY(500%);
            opacity: 0;
          }
        }

        @keyframes particle {
          0%,
          100% {
            opacity: 0.12;
            transform: scale(0.6);
          }

          50% {
            opacity: 0.95;
            transform: scale(1.5);
          }
        }

        @keyframes routeFlow {
          from {
            stroke-dashoffset: 120;
          }

          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes scoreGlow {
          0%,
          100% {
            text-shadow: 0 0 0 transparent;
          }

          50% {
            text-shadow: 0 0 18px currentColor;
          }
        }

        @keyframes signalPulse {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(0.85);
          }

          50% {
            opacity: 1;
            transform: scale(1.15);
          }
        }

        @keyframes dataFlow {
          from {
            transform: translateX(-120%);
          }

          to {
            transform: translateX(420%);
          }
        }

        @keyframes targetLock {
          0%,
          100% {
            transform: rotate(0deg) scale(1);
          }

          50% {
            transform: rotate(90deg) scale(1.05);
          }

          100% {
            transform: rotate(180deg) scale(1);
          }
        }

        @keyframes telemetryBlink {
          0%,
          100% {
            opacity: 0.45;
          }

          50% {
            opacity: 1;
          }
        }

        .location-page {
          animation: locationReveal 0.7s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .radar-sweep {
          transform-origin: center;
          animation: radarSweep 5s linear infinite;
        }

        .radar-pulse {
          animation: radarPulse 2.5s ease-out infinite;
        }

        .marker-pulse {
          animation: markerPulse 2s ease-in-out infinite;
        }

        .horizontal-scan {
          animation: scannerHorizontal 3.5s ease-in-out infinite;
        }

        .vertical-scan {
          animation: scannerVertical 5s ease-in-out infinite;
        }

        .location-particle {
          animation: particle 2.4s ease-in-out infinite;
        }

        .location-route {
          stroke-dasharray: 5 4;
          animation: routeFlow 3s linear infinite;
        }

        .score-glow {
          animation: scoreGlow 2.8s ease-in-out infinite;
        }

        .signal-pulse {
          animation: signalPulse 1.8s ease-in-out infinite;
        }

        .data-flow {
          animation: dataFlow 2.8s linear infinite;
        }

        .target-lock {
          animation: targetLock 7s linear infinite;
        }

        .telemetry-blink {
          animation: telemetryBlink 1.8s ease-in-out infinite;
        }

        .location-button {
          transition:
            transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
            filter 220ms ease;
        }

        .location-button:hover {
          transform: translate(-50%, -50%) scale(1.15);
          filter: brightness(1.2);
        }

        .ranking-button {
          transition:
            transform 220ms ease,
            border-color 220ms ease,
            background-color 220ms ease,
            box-shadow 220ms ease;
        }

        .ranking-button:hover {
          transform: translateX(4px);
        }

        @media (prefers-reduced-motion: reduce) {
          .location-page,
          .radar-sweep,
          .radar-pulse,
          .marker-pulse,
          .horizontal-scan,
          .vertical-scan,
          .location-particle,
          .location-route,
          .score-glow,
          .signal-pulse,
          .data-flow,
          .target-lock,
          .telemetry-blink {
            animation: none;
          }
        }
      `}</style>

      <div className="location-page">
        <Card className="overflow-hidden border-border/70 bg-card/55 shadow-xl backdrop-blur-xl">

          {/* ================================================= */}
          {/* HEADER */}
          {/* ================================================= */}

          <CardHeader className="border-b border-border/60 pb-3.5">

            <div className="flex flex-wrap items-center justify-between gap-3">

              <div>

                <div className="flex flex-wrap items-center gap-2">

                  <div className="flex items-center gap-2">

                    <div className="relative flex size-7 items-center justify-center rounded-lg border border-primary/25 bg-primary/10">

                      <Radar className="size-3.5 text-primary" />

                      <span className="signal-pulse absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-primary" />

                    </div>

                    <CardTitle>
                      Geospatial Search Priority
                    </CardTitle>

                  </div>

                  <span className="inline-flex items-center gap-1 rounded border border-primary/25 bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-primary">

                    <Zap className="size-2.5" />

                    HEURISTIC ENGINE

                  </span>

                </div>

                <p className="mt-1 font-mono text-[10.5px] text-muted-foreground">
                  Multi-factor spatial scoring · Explainable rule-based decomposition
                </p>

              </div>


              <div className="flex items-center gap-2">

                <span className="flex items-center gap-1.5 rounded border border-success/25 bg-success/10 px-2 py-1 font-mono text-[9px] font-semibold text-success">

                  <span className="signal-pulse size-1.5 rounded-full bg-success" />

                  RADAR ACTIVE

                </span>

                <span className="hidden rounded border border-border/70 bg-secondary/70 px-2 py-1 font-mono text-[9px] font-semibold text-muted-foreground sm:block">
                  DETERMINISTIC
                </span>

              </div>

            </div>

          </CardHeader>


          <CardContent className="pt-4">

            <div className="grid gap-4 lg:grid-cols-5">

              {/* ================================================= */}
              {/* RADAR */}
              {/* ================================================= */}

              <div className="lg:col-span-3">

                <div
                  className="group relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-primary/15 shadow-2xl transition-all duration-500 hover:border-primary/30"
                  style={{
                    background:
                      'radial-gradient(circle at 50% 50%, oklch(0.18 0.03 230 / 0.7), transparent 38%), radial-gradient(circle at 20% 15%, oklch(0.20 0.02 230 / 0.5), transparent 52%), radial-gradient(circle at 85% 80%, oklch(0.17 0.03 190 / 0.4), transparent 48%), var(--card)',
                  }}
                >

                  {/* ================================================= */}
                  {/* MAP GRID */}
                  {/* ================================================= */}

                  <svg
                    className="absolute inset-0 h-full w-full opacity-45"
                    aria-hidden="true"
                  >
                    <defs>

                      <pattern
                        id="tactical-grid-final"
                        width="32"
                        height="32"
                        patternUnits="userSpaceOnUse"
                      >
                        <path
                          d="M 32 0 L 0 0 0 32"
                          fill="none"
                          stroke="currentColor"
                          strokeOpacity="0.18"
                          strokeWidth="0.8"
                        />
                      </pattern>

                      <radialGradient id="centerGlowFinal">

                        <stop
                          offset="0%"
                          stopColor="var(--primary)"
                          stopOpacity="0.18"
                        />

                        <stop
                          offset="100%"
                          stopColor="var(--primary)"
                          stopOpacity="0"
                        />

                      </radialGradient>

                    </defs>

                    <rect
                      width="100%"
                      height="100%"
                      fill="url(#tactical-grid-final)"
                    />

                    <circle
                      cx="50%"
                      cy="50%"
                      r="44%"
                      fill="url(#centerGlowFinal)"
                    />

                    <line
                      x1="50%"
                      y1="0"
                      x2="50%"
                      y2="100%"
                      stroke="currentColor"
                      strokeOpacity="0.14"
                      strokeDasharray="4 5"
                    />

                    <line
                      x1="0"
                      y1="50%"
                      x2="100%"
                      y2="50%"
                      stroke="currentColor"
                      strokeOpacity="0.14"
                      strokeDasharray="4 5"
                    />
                  </svg>


                  {/* ================================================= */}
                  {/* SENSOR PARTICLES */}
                  {/* ================================================= */}

                  {particles.map(([x, y], index) => (
                    <span
                      key={index}
                      className="location-particle absolute z-[3] size-1 rounded-full bg-primary"
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        animationDelay: `${index * 0.4}s`,
                        boxShadow:
                          '0 0 6px var(--primary), 0 0 14px color-mix(in oklch, var(--primary) 45%, transparent)',
                      }}
                    />
                  ))}


                  {/* ================================================= */}
                  {/* RADAR */}
                  {/* ================================================= */}

                  <div className="absolute left-1/2 top-1/2 aspect-square w-[48%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/10">

                    <div className="absolute inset-[12%] rounded-full border border-primary/10" />

                    <div className="absolute inset-[25%] rounded-full border border-primary/10" />

                    <div className="absolute inset-[38%] rounded-full border border-primary/10" />

                    <div className="absolute inset-[49%] rounded-full bg-primary/10" />


                    {/* Pulse */}

                    <div className="radar-pulse absolute inset-[43%] rounded-full border border-primary/45" />


                    {/* Sweep */}

                    <div className="radar-sweep absolute left-1/2 top-1/2 h-1/2 w-px origin-bottom bg-gradient-to-t from-primary/90 to-transparent shadow-[0_0_10px_var(--primary)]" />

                    <div className="radar-sweep absolute left-1/2 top-1/2 h-1/2 w-1/2 origin-bottom -translate-y-full bg-gradient-to-t from-primary/20 to-transparent" />

                  </div>


                  {/* ================================================= */}
                  {/* ROUTE TO SELECTED TARGET */}
                  {/* ================================================= */}

                  <svg
                    className="pointer-events-none absolute inset-0 z-[4] h-full w-full"
                    aria-hidden="true"
                  >

                    <defs>

                      <linearGradient
                        id="route-gradient-final"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop
                          offset="0%"
                          stopColor="var(--primary)"
                          stopOpacity="0"
                        />

                        <stop
                          offset="55%"
                          stopColor="var(--primary)"
                          stopOpacity="0.75"
                        />

                        <stop
                          offset="100%"
                          stopColor={selectedColor}
                          stopOpacity="0.95"
                        />
                      </linearGradient>

                    </defs>

                    <path
                      d={`M 50 50
                          C 43 45, 37 40, 31 34
                          C 26 29, 23 24, ${selected.x} ${selected.y}`}
                      fill="none"
                      stroke="url(#route-gradient-final)"
                      strokeWidth="0.7"
                      strokeDasharray="5 4"
                      pathLength="120"
                      className="location-route"
                    />

                    <circle
                      cx="50"
                      cy="50"
                      r="0.9"
                      fill="var(--primary)"
                    />

                  </svg>


                  {/* ================================================= */}
                  {/* SCANNERS */}
                  {/* ================================================= */}

                  <div className="pointer-events-none absolute left-0 top-[44%] h-px w-full overflow-hidden">

                    <div className="horizontal-scan h-full w-1/4 bg-primary/50 blur-[1px] shadow-[0_0_8px_var(--primary)]" />

                  </div>


                  <div className="pointer-events-none absolute left-[50%] top-0 h-full w-px overflow-hidden">

                    <div className="vertical-scan h-1/4 w-full bg-primary/30" />

                  </div>


                  {/* ================================================= */}
                  {/* CENTER */}
                  {/* ================================================= */}

                  <div className="absolute left-1/2 top-1/2 z-[5] -translate-x-1/2 -translate-y-1/2">

                    <div className="relative flex size-12 items-center justify-center">

                      <div className="absolute inset-0 rounded-full border border-primary/20" />

                      <div className="target-lock absolute inset-1 rounded-full border border-dashed border-primary/30" />

                      <Crosshair className="relative size-6 text-primary/55" />

                      <span className="signal-pulse absolute size-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />

                    </div>

                  </div>


                  {/* ================================================= */}
                  {/* LOCATION MARKERS */}
                  {/* ================================================= */}

                  {searchLocations.map((location) => {

                    const color = priorityColor(location.priority)
                    const isSelected = selected.id === location.id

                    const size =
                      18 + (location.priority / 100) * 38

                    return (
                      <button
                        key={location.id}
                        onClick={() => setSelected(location)}
                        aria-label={`${location.name}, priority ${location.priority}`}
                        className={cn(
                          'location-button absolute z-10 cursor-pointer -translate-x-1/2 -translate-y-1/2 focus:outline-none',
                          isSelected && 'z-30',
                        )}
                        style={{
                          left: `${location.x}%`,
                          top: `${location.y}%`,
                        }}
                      >

                        {/* Selected rings */}

                        {isSelected && (
                          <>
                            <span
                              className="radar-pulse absolute left-1/2 top-1/2 rounded-full border"
                              style={{
                                width: size * 1.8,
                                height: size * 1.8,
                                borderColor: color,
                                transform: 'translate(-50%, -50%)',
                              }}
                            />

                            <span
                              className="radar-pulse absolute left-1/2 top-1/2 rounded-full border"
                              style={{
                                width: size * 2.7,
                                height: size * 2.7,
                                borderColor: color,
                                animationDelay: '0.8s',
                                transform: 'translate(-50%, -50%)',
                              }}
                            />
                          </>
                        )}


                        {/* Heat aura */}

                        <span
                          className="absolute left-1/2 top-1/2 rounded-full blur-xl"
                          style={{
                            width: size * 2,
                            height: size * 2,
                            background: color,
                            opacity: isSelected ? 0.35 : 0.12,
                            transform: 'translate(-50%, -50%)',
                          }}
                        />


                        {/* Marker */}

                        <span
                          className="marker-pulse relative flex items-center justify-center rounded-full border"
                          style={{
                            width: size,
                            height: size,
                            borderColor: color,
                            background:
                              `color-mix(in oklch, ${color} 16%, transparent)`,
                            boxShadow: isSelected
                              ? `0 0 0 3px color-mix(in oklch, ${color} 25%, transparent), 0 0 30px color-mix(in oklch, ${color} 35%, transparent)`
                              : `0 0 15px color-mix(in oklch, ${color} 15%, transparent)`,
                          }}
                        >

                          <MapPin
                            className="size-3.5"
                            style={{ color }}
                            strokeWidth={2.5}
                          />

                        </span>


                        {/* Selected label */}

                        {isSelected && (
                          <span
                            className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded border bg-background/90 px-2 py-1 font-mono text-[7px] font-bold tracking-wider backdrop-blur-md"
                            style={{
                              color,
                              borderColor:
                                `color-mix(in oklch, ${color} 30%, transparent)`,
                            }}
                          >
                            TARGET LOCK · {location.id}
                          </span>
                        )}

                      </button>
                    )
                  })}


                  {/* ================================================= */}
                  {/* HUD CORNERS */}
                  {/* ================================================= */}

                  <div className="absolute left-2 top-2 rounded-lg border border-border/50 bg-background/80 px-2.5 py-1.5 font-mono text-[8px] text-muted-foreground backdrop-blur-xl">

                    <div className="flex items-center gap-1.5">

                      <Compass className="size-3 text-primary" />

                      <span>GRID SECTOR N4</span>

                      <span className="text-primary">•</span>

                      <span className="text-success">LIVE</span>

                    </div>

                  </div>


                  <div className="absolute right-2 top-2 rounded-lg border border-success/20 bg-background/80 px-2.5 py-1.5 font-mono text-[8px] text-success backdrop-blur-xl">

                    <div className="flex items-center gap-1.5">

                      <Signal className="size-3" />

                      SIGNAL LOCKED

                    </div>

                  </div>


                  {/* Bottom left */}

                  <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-lg border border-border/50 bg-background/80 px-2 py-1.5 font-mono text-[7px] text-muted-foreground backdrop-blur-xl">

                    <ScanLine className="size-2.5 text-primary" />

                    SCANNING SPATIAL FIELD

                  </div>


                  {/* Bottom right */}

                  <div className="absolute bottom-2 right-2 rounded-lg border border-primary/20 bg-background/80 px-2 py-1.5 font-mono text-[7px] text-primary backdrop-blur-xl">

                    TARGET: {selected.id}

                  </div>


                  {/* ================================================= */}
                  {/* CORNER BRACKETS */}
                  {/* ================================================= */}

                  <div className="pointer-events-none absolute left-3 top-3 h-4 w-4 border-l border-t border-primary/25" />

                  <div className="pointer-events-none absolute right-3 top-3 h-4 w-4 border-r border-t border-primary/25" />

                  <div className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 border-b border-l border-primary/25" />

                  <div className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 border-b border-r border-primary/25" />

                </div>


                {/* ================================================= */}
                {/* TELEMETRY */}
                {/* ================================================= */}

                <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">

                  <Telemetry
                    icon={Satellite}
                    label="SATELLITES"
                    value="08"
                  />

                  <Telemetry
                    icon={Signal}
                    label="SIGNAL"
                    value={`${telemetry}%`}
                    live
                  />

                  <Telemetry
                    icon={ScanLine}
                    label="SCANS"
                    value={scanCount.toString()}
                  />

                  <Telemetry
                    icon={Radio}
                    label="LINK"
                    value="SECURE"
                    success
                  />

                </div>


                {/* Legend */}

                <div className="mt-2.5 flex flex-wrap items-center gap-4 text-[9px] font-mono text-muted-foreground select-none">

                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-danger" />
                    High (75+)
                  </span>

                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-warning" />
                    Medium (55–74)
                  </span>

                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-primary" />
                    Low (&lt;55)
                  </span>

                  <span className="ml-auto flex items-center gap-1.5">

                    <span className="signal-pulse size-1.5 rounded-full bg-success" />

                    LIVE SENSOR FEED

                  </span>

                </div>

              </div>


              {/* ================================================= */}
              {/* RIGHT PANEL */}
              {/* ================================================= */}

              <div className="space-y-2.5 lg:col-span-2">

                {/* Priority Matrix */}

                <div className="space-y-1">

                  <div className="mb-2 flex items-center justify-between">

                    <div className="flex items-center gap-1.5">

                      <Activity className="size-3 text-primary" />

                      <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                        Priority Matrix
                      </span>

                    </div>

                    <span className="font-mono text-[8px] uppercase text-primary">
                      {searchLocations.length} TARGETS
                    </span>

                  </div>


                  {searchLocations.map((location, index) => {

                    const isSelected =
                      selected.id === location.id

                    const color =
                      priorityColor(location.priority)

                    return (
                      <button
                        key={location.id}
                        onClick={() => setSelected(location)}
                        className={cn(
                          'ranking-button flex w-full cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left shadow-sm',
                          isSelected
                            ? 'border-primary/40 bg-primary/[0.08] shadow-lg shadow-primary/[0.04]'
                            : 'border-border/60 bg-card/40 hover:border-primary/20 hover:bg-card/70',
                        )}
                      >

                        <span className="w-4 font-mono text-[8px] text-muted-foreground/60">
                          {String(index + 1).padStart(2, '0')}
                        </span>

                        <span
                          className="w-8 font-mono text-xs font-black"
                          style={{ color }}
                        >
                          {location.priority}
                        </span>

                        <span className="flex-1 truncate text-xs font-semibold text-foreground">
                          {location.name}
                        </span>

                        {isSelected && (
                          <Target className="size-3 text-primary" />
                        )}

                      </button>
                    )
                  })}

                </div>


                {/* ================================================= */}
                {/* SELECTED TARGET */}
                {/* ================================================= */}

                <div className="relative overflow-hidden rounded-xl border border-border/70 bg-secondary/35 p-3.5 shadow-lg">

                  {/* Scanner */}

                  <div className="pointer-events-none absolute left-0 top-0 h-px w-full overflow-hidden">

                    <div className="data-flow h-full w-1/4 bg-primary/70 shadow-[0_0_8px_var(--primary)]" />

                  </div>


                  <div className="flex items-center justify-between border-b border-border/50 pb-2.5">

                    <div className="flex min-w-0 items-center gap-2">

                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">

                        <Navigation className="size-3.5 text-primary" />

                      </div>

                      <div className="min-w-0">

                        <p className="truncate text-xs font-bold text-foreground">
                          {selected.name}
                        </p>

                        <p className="font-mono text-[7px] uppercase tracking-wider text-muted-foreground">
                          TARGET IDENTIFIED
                        </p>

                      </div>

                    </div>


                    <span
                      className="score-glow shrink-0 rounded-lg border px-2 py-1 font-mono text-sm font-black"
                      style={{
                        color: selectedColor,
                        borderColor:
                          `color-mix(in oklch, ${selectedColor} 35%, transparent)`,
                        background:
                          `color-mix(in oklch, ${selectedColor} 9%, transparent)`,
                      }}
                    >
                      <AnimatedScore value={selected.priority} />
                    </span>

                  </div>


                  {/* Status */}

                  <div className="mt-2 flex items-center justify-between rounded-md border border-border/40 bg-background/25 px-2 py-1.5">

                    <span className="flex items-center gap-1.5 font-mono text-[7px] uppercase tracking-wider text-muted-foreground">

                      <span
                        className="signal-pulse size-1.5 rounded-full"
                        style={{ background: selectedColor }}
                      />

                      TARGET SIGNAL

                    </span>

                    <span
                      className="font-mono text-[8px] font-bold"
                      style={{ color: selectedColor }}
                    >
                      {selected.priority >= 75
                        ? 'CRITICAL'
                        : selected.priority >= 55
                          ? 'ELEVATED'
                          : 'NORMAL'}
                    </span>

                  </div>


                  {/* Explanation */}

                  <p className="mt-2.5 flex items-start gap-1.5 font-mono text-[10px] leading-relaxed text-muted-foreground">

                    <Info className="mt-0.5 size-3 shrink-0 text-primary" />

                    <span>
                      Deterministic heuristic decomposition:
                      evidence recency, location reliability and
                      corroborating evidence points.
                    </span>

                  </p>


                  {/* Factors */}

                  <div className="mt-3 space-y-2.5">

                    <FactorBar
                      label="Evidence Recency"
                      value={selected.factors.recency}
                    />

                    <FactorBar
                      label="Location Reliability"
                      value={selected.factors.reliability}
                    />

                    <FactorBar
                      label="Corroborating Evidence Points"
                      value={selected.factors.points * 20}
                      display={`${selected.factors.points} pts`}
                    />

                  </div>


                  {/* Coordinates */}

                  <div className="mt-3 grid grid-cols-2 gap-2">

                    <div className="rounded-lg border border-border/50 bg-background/25 px-2.5 py-2">

                      <div className="font-mono text-[7px] uppercase tracking-wider text-muted-foreground">
                        X POSITION
                      </div>

                      <div className="mt-0.5 font-mono text-[10px] font-bold text-primary">
                        {selected.x.toFixed(1)}%
                      </div>

                    </div>


                    <div className="rounded-lg border border-border/50 bg-background/25 px-2.5 py-2">

                      <div className="font-mono text-[7px] uppercase tracking-wider text-muted-foreground">
                        Y POSITION
                      </div>

                      <div className="mt-0.5 font-mono text-[10px] font-bold text-primary">
                        {selected.y.toFixed(1)}%
                      </div>

                    </div>

                  </div>


                  {/* Target footer */}

                  <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2.5">

                    <span className="flex items-center gap-1.5 font-mono text-[7px] uppercase tracking-wider text-muted-foreground">

                      <Crosshair className="size-2.5 text-primary" />

                      TARGET LOCKED

                    </span>

                    <span className="font-mono text-[7px] text-muted-foreground/50">
                      GEO-{selected.id}
                    </span>

                  </div>

                </div>

              </div>

            </div>

          </CardContent>
        </Card>
      </div>
    </>
  )
}


/* ========================================================= */
/* FACTOR BAR */
/* ========================================================= */

function FactorBar({
  label,
  value,
  display,
}: {
  label: string
  value: number
  display?: string
}) {
  const safeValue = Math.min(value, 100)

  return (
    <div>

      <div className="flex items-center justify-between text-[10px]">

        <span className="font-medium text-muted-foreground">
          {label}
        </span>

        <span className="font-mono text-[9px] font-bold text-foreground">
          {display ?? `${value}%`}
        </span>

      </div>

      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full border border-border/40 bg-secondary">

        <div
          className="relative h-full rounded-full bg-primary/80 transition-all duration-700 ease-out"
          style={{
            width: `${safeValue}%`,
          }}
        >

          <div className="absolute inset-y-0 right-0 w-8 bg-white/30 blur-[2px]" />

        </div>

      </div>

    </div>
  )
}


/* ========================================================= */
/* TELEMETRY */
/* ========================================================= */

function Telemetry({
  icon: Icon,
  label,
  value,
  live,
  success,
}: {
  icon: React.ElementType
  label: string
  value: string
  live?: boolean
  success?: boolean
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-background/25 px-2 py-2">

      <div className="flex items-center gap-1.5">

        <Icon
          className={cn(
            'size-2.5',
            success
              ? 'text-success'
              : live
                ? 'text-primary'
                : 'text-muted-foreground',
          )}
        />

        <span className="font-mono text-[6.5px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>

        {live && (
          <span className="telemetry-blink ml-auto size-1 rounded-full bg-success" />
        )}

      </div>

      <p className="mt-0.5 font-mono text-[9px] font-black text-foreground">
        {value}
      </p>

    </div>
  )
}