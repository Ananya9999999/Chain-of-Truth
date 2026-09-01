'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/pages/page-header'
import { Button } from '@/components/ui/button'
import { Stethoscope, Loader2, AlertTriangle, FlaskConical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { endpoints } from '@/lib/api'
import { autopsyMock } from '@/lib/mock-agents'

export function AutopsyPage() {
  const [data, setData] = useState(autopsyMock)
  const [loading, setLoading] = useState(false)
  const [source, setSource] = useState<'mock' | 'api'>('mock')

  async function run() {
    setLoading(true)
    const res = await endpoints.autopsy(1)
    setLoading(false)
    if (res && typeof res === 'object' && 'hypotheses' in res) {
      setData(res as typeof autopsyMock)
      setSource('api')
    }
  }

  return (
    <div className="page-enter space-y-5">
      <PageHeader
        title="Autopsy / Post-Mortem Agent"
        description="Cross-references post-mortem findings with the case timeline. Never diagnoses cause of death."
      />

      <div className="animate-pop rounded-xl border border-warning/40 bg-warning/[0.07] p-4">
        <p className="text-sm font-medium text-warning">
          AI-generated investigative hypothesis — requires forensic medical officer review
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Outputs exist only to flag investigation gaps. A medical officer must confirm or dismiss every item.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          Source: {source === 'api' ? 'Live agent' : 'Demo data'}
        </span>
        <Button onClick={run} disabled={loading} className="btn-press">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Stethoscope className="size-4" />}
          Run analysis
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Hypotheses</h3>
          {(data.hypotheses || []).map((h, i) => (
            <div
              key={i}
              className="stagger-item hover-lift rounded-xl border border-border bg-card/60 p-4"
              style={{ ['--stagger-i' as string]: i }}
            >
              <div className="flex items-center gap-2">
                <FlaskConical className="size-4 text-primary" />
                <span className="font-mono text-[10px] uppercase text-muted-foreground">
                  {h.type}
                </span>
                <span className="ml-auto font-mono text-[11px] text-primary">
                  {Math.round((h.confidence || 0) * 100)}%
                </span>
              </div>
              <p className="mt-2 text-sm text-foreground">{h.text}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Warnings & checks</h3>
          {(data.warnings || []).map((w, i) => (
            <div
              key={i}
              className="stagger-item flex gap-2 rounded-xl border border-warning/30 bg-warning/[0.06] p-3 text-sm text-foreground"
              style={{ ['--stagger-i' as string]: i }}
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
              <p>{w}</p>
            </div>
          ))}
          {(data.consistency_checks || []).map((c, i) => (
            <div
              key={`c-${i}`}
              className="stagger-item rounded-xl border border-border bg-card/40 p-3 text-xs"
              style={{ ['--stagger-i' as string]: i + 3 }}
            >
              <p className="font-mono text-muted-foreground">{c.check}</p>
              <p className="mt-1 text-foreground">
                <span className={cn(
                  'font-semibold',
                  c.result.includes('mismatch') ? 'text-warning' : 'text-primary',
                )}>
                  {c.result}
                </span>
                {' · '}
                {c.detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      {data.disclaimer && (
        <p className="text-[11px] italic text-muted-foreground">{data.disclaimer}</p>
      )}
    </div>
  )
}
