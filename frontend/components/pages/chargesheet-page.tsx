'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/pages/page-header'
import { Button } from '@/components/ui/button'
import { FileCheck2, Loader2, ShieldAlert, ListChecks } from 'lucide-react'
import { cn } from '@/lib/utils'
import { endpoints } from '@/lib/api'
import { chargesheetMock } from '@/lib/mock-agents'

export function ChargesheetPage() {
  const [data, setData] = useState(chargesheetMock)
  const [loading, setLoading] = useState(false)
  const [source, setSource] = useState<'mock' | 'api'>('mock')

  async function run() {
    setLoading(true)
    const res = await endpoints.chargesheetQa(1)
    setLoading(false)
    if (res && typeof res === 'object' && 'checklist' in res) {
      setData(res as typeof chargesheetMock)
      setSource('api')
    }
  }

  const risk = data.overall_risk_level || 'medium'
  const riskClass =
    risk === 'high' || risk === 'critical'
      ? 'text-danger border-danger/40 bg-danger/10'
      : risk === 'medium'
        ? 'text-warning border-warning/40 bg-warning/10'
        : 'text-success border-success/40 bg-success/10'

  return (
    <div className="page-enter space-y-5">
      <PageHeader
        title="Chargesheet QA"
        description="Pre-filing consistency checklist for a human legal reviewer — not a verdict on case strength."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className={cn('rounded-lg border px-3 py-1.5 font-mono text-xs font-semibold uppercase', riskClass)}>
          Overall risk · {risk}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            Source: {source === 'api' ? 'Live agent' : 'Demo data'}
          </span>
          <Button onClick={run} disabled={loading} className="btn-press">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <FileCheck2 className="size-4" />}
            Run QA
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <ShieldAlert className="size-4 text-warning" /> Risks
          </h3>
          {(data.risks || []).map((r, i) => (
            <div
              key={i}
              className="stagger-item hover-lift rounded-xl border border-border bg-card/60 p-4"
              style={{ ['--stagger-i' as string]: i }}
            >
              <span className="font-mono text-[10px] font-semibold uppercase text-warning">
                {r.severity}
              </span>
              <p className="mt-1 text-sm font-medium text-foreground">{r.issue}</p>
              <p className="mt-1 text-xs text-muted-foreground">{r.recommendation}</p>
            </div>
          ))}
          {(data.findings || []).map((f, i) => (
            <div
              key={`f-${i}`}
              className="stagger-item rounded-lg border border-success/20 bg-success/[0.05] px-3 py-2 text-xs text-foreground"
              style={{ ['--stagger-i' as string]: i + 5 }}
            >
              ✓ {f}
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <ListChecks className="size-4 text-primary" /> Checklist
          </h3>
          <ul className="space-y-2">
            {(data.checklist || []).map((item, i) => (
              <li
                key={i}
                className="stagger-item flex gap-2 rounded-lg border border-border/80 bg-card/40 px-3 py-2 text-sm text-foreground"
                style={{ ['--stagger-i' as string]: i }}
              >
                <span className="mt-0.5 size-4 shrink-0 rounded border border-border" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {data.disclaimer && (
        <p className="text-[11px] italic text-muted-foreground">{data.disclaimer}</p>
      )}
    </div>
  )
}
