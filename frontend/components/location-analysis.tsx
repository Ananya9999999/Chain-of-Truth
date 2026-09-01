'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { searchLocations, type SearchLocation } from '@/lib/mock-data'
import { Info, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

function priorityColor(p: number) {
  if (p >= 75) return 'var(--danger)'
  if (p >= 55) return 'var(--warning)'
  return 'var(--primary)'
}

export function LocationAnalysis() {
  const [selected, setSelected] = useState<SearchLocation>(searchLocations[0])

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Location Analysis</CardTitle>
          <p className="mt-0.5 font-mono text-[11px] tracking-wide text-primary uppercase">
            Search Priority — Explainable Heuristic
          </p>
        </div>
        <span className="rounded-md border border-border bg-secondary px-2 py-1 text-[10px] font-medium text-muted-foreground">
          Rule-based · not ML
        </span>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 lg:grid-cols-5">
          {/* Map */}
          <div className="lg:col-span-3">
            <div
              className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-border"
              style={{
                background:
                  'radial-gradient(circle at 30% 20%, oklch(0.26 0.02 240 / 0.6), transparent 55%), radial-gradient(circle at 70% 80%, oklch(0.24 0.02 200 / 0.5), transparent 50%), var(--card)',
              }}
            >
              {/* grid lines */}
              <svg
                className="absolute inset-0 h-full w-full opacity-40"
                aria-hidden="true"
              >
                <defs>
                  <pattern
                    id="grid"
                    width="36"
                    height="36"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 36 0 L 0 0 0 36"
                      fill="none"
                      stroke="oklch(0.4 0.01 256 / 0.35)"
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>

              {searchLocations.map((loc) => {
                const color = priorityColor(loc.priority)
                const isSel = selected.id === loc.id
                const size = 18 + (loc.priority / 100) * 44
                return (
                  <button
                    key={loc.id}
                    onClick={() => setSelected(loc)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none"
                    style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
                    aria-label={`${loc.name}, priority ${loc.priority}`}
                  >
                    {/* heat glow */}
                    <span
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-md"
                      style={{
                        width: size * 2,
                        height: size * 2,
                        background: color,
                        opacity: 0.22,
                      }}
                    />
                    <span
                      className={cn(
                        'relative flex items-center justify-center rounded-full border transition-transform duration-300 hover:scale-110',
                        isSel && 'scale-110',
                      )}
                      style={{
                        width: size,
                        height: size,
                        borderColor: color,
                        background: `color-mix(in oklch, ${color} 22%, transparent)`,
                        boxShadow: isSel
                          ? `0 0 0 3px color-mix(in oklch, ${color} 35%, transparent)`
                          : 'none',
                      }}
                    >
                      <MapPin
                        className="size-3.5"
                        style={{ color }}
                        strokeWidth={2.5}
                      />
                    </span>
                  </button>
                )
              })}

              <div className="absolute bottom-2 left-2 rounded-md bg-background/70 px-2 py-1 font-mono text-[10px] text-muted-foreground backdrop-blur-sm">
                Sector grid · marker size = search priority
              </div>
            </div>

            {/* legend */}
            <div className="mt-2 flex items-center gap-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span
                  className="size-2 rounded-full"
                  style={{ background: 'var(--danger)' }}
                />
                High (75+)
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="size-2 rounded-full"
                  style={{ background: 'var(--warning)' }}
                />
                Medium (55–74)
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="size-2 rounded-full"
                  style={{ background: 'var(--primary)' }}
                />
                Low (&lt;55)
              </span>
            </div>
          </div>

          {/* Detail / ranking */}
          <div className="lg:col-span-2">
            <div className="space-y-1.5">
              {searchLocations.map((loc) => {
                const isSel = selected.id === loc.id
                return (
                  <button
                    key={loc.id}
                    onClick={() => setSelected(loc)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors',
                      isSel
                        ? 'border-primary/40 bg-primary/[0.06]'
                        : 'border-border bg-card/40 hover:border-border/80',
                    )}
                  >
                    <span
                      className="font-mono text-sm font-semibold"
                      style={{ color: priorityColor(loc.priority) }}
                    >
                      {loc.priority}
                    </span>
                    <span className="flex-1 truncate text-xs text-foreground">
                      {loc.name}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="mt-3 rounded-lg border border-border bg-secondary/40 p-3">
              <p className="text-xs font-semibold text-foreground">
                {selected.name}
              </p>
              <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
                <Info className="mt-0.5 size-3 shrink-0 text-primary" />
                Priority derived from three explainable factors:
              </p>
              <FactorBar label="Evidence recency" value={selected.factors.recency} />
              <FactorBar
                label="Location reliability"
                value={selected.factors.reliability}
              />
              <FactorBar
                label="Evidence points"
                value={selected.factors.points * 20}
                display={`${selected.factors.points}`}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function FactorBar({
  label,
  value,
  display,
}: {
  label: string
  value: number
  display?: string
}) {
  return (
    <div className="mt-2.5">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-foreground">{display ?? `${value}`}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary/70 transition-all"
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  )
}
