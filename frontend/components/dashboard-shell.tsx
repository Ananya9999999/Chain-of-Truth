'use client'

/**
 * The investigation workspace shell.
 *
 * Provides the store, the forensic backdrop, the toast viewport and the custom
 * cursor, then routes between pages with a blur-to-sharp transition.
 *
 * Heavy pages (3D scenes, the map, the graph) are lazily imported so the
 * initial workspace load never pays for a WebGL context the officer has not
 * asked for.
 */

import dynamic from 'next/dynamic'
import { useCallback, useMemo, useState } from 'react'

import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { ForensicBackground } from '@/components/forensic-background'
import { ForensicCursor, ToastViewport } from '@/components/system'
import { navItems, type PageKey } from '@/lib/nav'
import { RefreshContext } from '@/lib/hooks/use-api'
import { StoreProvider } from '@/lib/store'
import { NavigationProvider } from '@/lib/navigation'
import { PageTransition } from '@/components/motion'
import { LoadingState } from '@/components/states'
import { DEMO_DATA_NOTICE } from '@/lib/case'

import { OverviewPage } from '@/components/pages/overview-page'
import { EvidencePage } from '@/components/pages/evidence-page'
import { TimelinePage } from '@/components/pages/timeline-page'
import { AiFlagsPage } from '@/components/pages/ai-flags-page'
import { AuditPage } from '@/components/pages/audit-page'
import { SettingsPage } from '@/components/pages/settings-page'
import { GuidancePage } from '@/components/pages/guidance-page'
import { ChargesheetPage } from '@/components/pages/chargesheet-page'
import { ContradictionsPage } from '@/components/pages/contradictions-page'
import { VerificationPage } from '@/components/pages/verification-page'
import { ReadinessPage } from '@/components/pages/readiness-page'
import { GapsPage } from '@/components/pages/gaps-page'
import { SimilarityPage } from '@/components/pages/similarity-page'
import { StatementsPage } from '@/components/pages/statements-page'
import { CorrelationPage } from '@/components/pages/correlation-page'

const heavyFallback = () => <LoadingState label="Loading visualisation…" rows={4} />

const GraphPage = dynamic(
  () => import('@/components/pages/graph-page').then((m) => m.GraphPage),
  { ssr: false, loading: heavyFallback },
)
const LocationPage = dynamic(
  () => import('@/components/pages/location-page').then((m) => m.LocationPage),
  { ssr: false, loading: heavyFallback },
)
const AutopsyPage = dynamic(
  () => import('@/components/pages/autopsy-page').then((m) => m.AutopsyPage),
  { ssr: false, loading: heavyFallback },
)

const pages: Record<PageKey, React.ComponentType> = {
  overview: OverviewPage,
  evidence: EvidencePage,
  timeline: TimelinePage,
  graph: GraphPage,
  location: LocationPage,
  contradictions: ContradictionsPage,
  'ai-flags': AiFlagsPage,
  guidance: GuidancePage,
  gaps: GapsPage,
  autopsy: AutopsyPage,
  statements: StatementsPage,
  correlation: CorrelationPage,
  similarity: SimilarityPage,
  verification: VerificationPage,
  readiness: ReadinessPage,
  chargesheet: ChargesheetPage,
  audit: AuditPage,
  settings: SettingsPage,
}

export function DashboardShell() {
  return (
    <StoreProvider>
      <WorkspaceInner />
    </StoreProvider>
  )
}

function WorkspaceInner() {
  const [active, setActive] = useState<PageKey>('overview')
  const [token, setToken] = useState(0)

  // Incrementing this propagates a verification decision to every subscribed
  // panel at once, rather than only the list the officer clicked in.
  const refresh = useCallback(() => setToken((n) => n + 1), [])
  const refreshValue = useMemo(() => ({ token, refresh }), [token, refresh])

  const ActivePage = pages[active]
  const activeItem = navItems.find((i) => i.key === active)

  return (
    <RefreshContext.Provider value={refreshValue}>
      <NavigationProvider value={setActive}>
      <ForensicBackground variant="app" />
      <ForensicCursor />
      <ToastViewport />

      <div className="relative z-10 flex min-h-screen">
        <Sidebar active={active} onNavigate={setActive} />

        <div className="flex min-w-0 flex-1 flex-col">
          <Header onNavigate={setActive} />

          {/* Mobile / tablet navigation — the rail is hidden below lg */}
          <div className="border-b border-border bg-background/70 px-4 py-2 backdrop-blur lg:hidden">
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
                  {item.group} · {item.label}
                </option>
              ))}
            </select>
          </div>

          <main className="mx-auto w-full max-w-[1500px] flex-1 p-4 sm:p-5 lg:p-6">
            <PageTransition motionKey={active}>
              <ActivePage />
            </PageTransition>

            <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-4 text-[11px] text-muted-foreground">
              <p>Chain of Truth · {activeItem?.label} · AI assists, humans decide</p>
              <p className="font-mono">{DEMO_DATA_NOTICE}</p>
            </footer>
          </main>
        </div>
      </div>
      </NavigationProvider>
    </RefreshContext.Provider>
  )
}
