'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/pages/page-header'
import { Button } from '@/components/ui/button'
import { Scale, BookOpen, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { endpoints } from '@/lib/api'
import { guidanceMock } from '@/lib/mock-agents'

type GuidanceItem = {
  category: string
  title: string
  description: string
  legal_reference?: string | null
  priority: string
}

export function GuidancePage() {
  const [items, setItems] = useState<GuidanceItem[]>(guidanceMock)
  const [loading, setLoading] = useState(false)
  const [source, setSource] = useState<'mock' | 'api'>('mock')
  const [acked, setAcked] = useState<Record<number, boolean>>({})

  async function load() {
    setLoading(true)
    const data = await endpoints.guidance(1)
    setLoading(false)
    if (data && typeof data === 'object' && 'guidance' in data) {
      setItems((data as { guidance: GuidanceItem[] }).guidance)
      setSource('api')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const priorityColor: Record<string, string> = {
    critical: 'text-danger border-danger/30 bg-danger/10',
    high: 'text-warning border-warning/30 bg-warning/10',
    medium: 'text-primary border-primary/30 bg-primary/10',
  }

  return (
    <div className="page-enter space-y-5">
      <PageHeader
        title="Investigation Guidance"
        description="Checklist assistant grounded in BNS / CrPC — not a legal authority. Officer must confirm every item."
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/50 p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Scale className="size-4 text-primary" />
          <span>
            Source: {source === 'api' ? 'Live agent' : 'Demo data'} · AI assists,
            humans decide
          </span>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading} className="btn-press">
          {loading ? <Loader2 className="size-4 animate-spin" /> : 'Refresh from API'}
        </Button>
      </div>

      <div className="space-y-3">
        {items.map((g, i) => (
          <div
            key={`${g.title}-${i}`}
            className={cn(
              'stagger-item hover-lift rounded-xl border border-border bg-card/60 p-4',
              acked[i] && 'opacity-70',
            )}
            style={{ ['--stagger-i' as string]: i }}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/12 text-primary">
                  {g.priority === 'critical' || g.priority === 'high' ? (
                    <AlertTriangle className="size-4" />
                  ) : (
                    <BookOpen className="size-4" />
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase',
                        priorityColor[g.priority] || priorityColor.medium,
                      )}
                    >
                      {g.priority}
                    </span>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {g.category}
                    </span>
                  </div>
                  <h3 className="mt-1.5 text-sm font-semibold text-foreground">{g.title}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                    {g.description}
                  </p>
                  {g.legal_reference && (
                    <p className="mt-2 font-mono text-[11px] text-primary">
                      {g.legal_reference}
                    </p>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant={acked[i] ? 'secondary' : 'outline'}
                className="btn-press shrink-0"
                onClick={() => setAcked((s) => ({ ...s, [i]: true }))}
              >
                {acked[i] ? (
                  <>
                    <CheckCircle2 className="size-3.5" /> Acknowledged
                  </>
                ) : (
                  'Acknowledge'
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
