'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { navItems, type PageKey } from '@/lib/nav'
import { OverviewPage } from '@/components/pages/overview-page'
import { EvidencePage } from '@/components/pages/evidence-page'
import { TimelinePage } from '@/components/pages/timeline-page'
import { AiFlagsPage } from '@/components/pages/ai-flags-page'
import { LocationPage } from '@/components/pages/location-page'
import { AuditPage } from '@/components/pages/audit-page'
import { SettingsPage } from '@/components/pages/settings-page'
import { GuidancePage } from '@/components/pages/guidance-page'
import { AutopsyPage } from '@/components/pages/autopsy-page'
import { ChargesheetPage } from '@/components/pages/chargesheet-page'
import { ChainPage } from '@/components/pages/chain-page'

const pages: Record<PageKey, React.ComponentType> = {
  overview: OverviewPage,
  evidence: EvidencePage,
  timeline: TimelinePage,
  'ai-flags': AiFlagsPage,
  guidance: GuidancePage,
  autopsy: AutopsyPage,
  chargesheet: ChargesheetPage,
  chain: ChainPage,
  location: LocationPage,
  audit: AuditPage,
  settings: SettingsPage,
}

export function DashboardShell() {
  const [active, setActive] = useState<PageKey>('overview')
  const ActivePage = pages[active]

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar active={active} onNavigate={setActive} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />

        <div className="border-b border-border bg-background px-5 py-2 lg:hidden">
          <label htmlFor="page-nav" className="sr-only">
            Select page
          </label>
          <select
            id="page-nav"
            value={active}
            onChange={(e) => setActive(e.target.value as PageKey)}
            className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-ring/60 focus:ring-2 focus:ring-ring/20"
          >
            {navItems.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <main className="mx-auto w-full max-w-[1400px] flex-1 p-5 lg:p-6">
          <div key={active} className="page-enter">
            <ActivePage />
          </div>

          <footer className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-4 text-[11px] text-muted-foreground">
            <p>
              Chain of Truth · Evidence Integrity System · AI assists, humans
              decide
            </p>
            <p className="font-mono">
              Verified record and AI working-analysis layer are kept distinct at
              all times.
            </p>
          </footer>
        </main>
      </div>
    </div>
  )
}
