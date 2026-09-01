'use client'

import { useEffect, useState } from 'react'
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

const pages: Record<PageKey, React.ComponentType> = {
  overview: OverviewPage,
  evidence: EvidencePage,
  timeline: TimelinePage,
  'ai-flags': AiFlagsPage,
  location: LocationPage,
  audit: AuditPage,
  settings: SettingsPage,
}

export function DashboardShell() {
  const [active, setActive] = useState<PageKey>('overview')
  const [pageVisible, setPageVisible] = useState(true)
  const [cursor, setCursor] = useState({ x: 50, y: 30 })

  const ActivePage = pages[active]

  // Smooth page transition whenever sidebar navigation changes
  useEffect(() => {
    setPageVisible(false)

    const timer = setTimeout(() => {
      setPageVisible(true)
    }, 80)

    return () => clearTimeout(timer)
  }, [active])

  // Subtle mouse-follow ambient light
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setCursor({
        x: (event.clientX / window.innerWidth) * 100,
        y: (event.clientY / window.innerHeight) * 100,
      })
    }

    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <>
      <style jsx global>{`
        @keyframes dashboardFade {
          from {
            opacity: 0;
            transform: translateY(12px);
            filter: blur(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        @keyframes scanLine {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }
          15% {
            opacity: 0.25;
          }
          50% {
            opacity: 0.08;
          }
          85% {
            opacity: 0.25;
          }
          100% {
            transform: translateY(100vh);
            opacity: 0;
          }
        }

        @keyframes pulseDot {
          0%,
          100% {
            opacity: 0.35;
            transform: scale(0.85);
          }
          50% {
            opacity: 1;
            transform: scale(1.15);
          }
        }

        @keyframes borderGlow {
          0%,
          100% {
            opacity: 0.25;
          }
          50% {
            opacity: 0.7;
          }
        }

        @keyframes gridMove {
          from {
            background-position: 0 0;
          }
          to {
            background-position: 40px 40px;
          }
        }

        .dashboard-page-enter {
          animation: dashboardFade 0.55s cubic-bezier(0.22, 1, 0.36, 1)
            forwards;
        }

        .dashboard-scanline {
          position: fixed;
          inset: 0;
          height: 1px;
          pointer-events: none;
          z-index: 40;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(34, 211, 238, 0.25),
            transparent
          );
          animation: scanLine 8s linear infinite;
        }

        .dashboard-grid {
          background-image:
            linear-gradient(
              rgba(255, 255, 255, 0.025) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.025) 1px,
              transparent 1px
            );
          background-size: 40px 40px;
          animation: gridMove 18s linear infinite;
        }

        .status-dot {
          animation: pulseDot 2s ease-in-out infinite;
        }

        .glow-border {
          animation: borderGlow 3s ease-in-out infinite;
        }

        .dashboard-content {
          position: relative;
          z-index: 2;
        }

        ::selection {
          background: rgba(34, 211, 238, 0.25);
        }
      `}</style>

      {/* Cinematic scan line */}
      <div className="dashboard-scanline" />

      <div className="relative flex min-h-screen overflow-hidden bg-background font-sans antialiased text-foreground">
        {/* Animated forensic grid */}
        <div
          className="dashboard-grid pointer-events-none fixed inset-0 opacity-60"
          aria-hidden="true"
        />

        {/* Mouse-follow ambient light */}
        <div
          className="pointer-events-none fixed z-0 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-3xl transition-all duration-700"
          style={{
            left: `${cursor.x}%`,
            top: `${cursor.y}%`,
            background:
              'radial-gradient(circle, rgba(34,211,238,0.16) 0%, rgba(34,211,238,0.04) 35%, transparent 70%)',
          }}
          aria-hidden="true"
        />

        {/* Subtle top glow */}
        <div
          className="pointer-events-none fixed left-1/2 top-0 z-0 h-px w-[60%] -translate-x-1/2 bg-cyan-400/40 blur-sm"
          aria-hidden="true"
        />

        {/* Sidebar */}
        <div className="relative z-10">
          <Sidebar
            active={active}
            onNavigate={(page) => setActive(page)}
          />
        </div>

        <div className="relative z-10 flex min-w-0 flex-1 flex-col">
          {/* Header */}
          <Header />

          {/* Mobile / tablet navigation */}
          <div className="border-b border-border/80 bg-background/90 px-4 py-2 backdrop-blur-xl lg:hidden">
            <label htmlFor="page-nav" className="sr-only">
              Select page
            </label>

            <select
              id="page-nav"
              value={active}
              onChange={(e) =>
                setActive(e.target.value as PageKey)
              }
              className="h-9 w-full rounded-lg border border-border/80 bg-card/80 px-3 text-xs font-medium text-foreground outline-none transition-all duration-300 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
            >
              {navItems.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <main className="dashboard-content mx-auto w-full max-w-[1440px] flex-1 p-4.5 lg:p-6">
            {/* Top system status strip */}
            <div className="mb-5 flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                <span className="status-dot size-1.5 rounded-full bg-emerald-400" />
                <span>Forensic System Online</span>
              </div>

              <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60">
                SECURE SESSION · ENCRYPTED
              </div>
            </div>

            {/* Animated active page */}
            <div
              key={active}
              className={
                pageVisible
                  ? 'dashboard-page-enter'
                  : 'opacity-0'
              }
            >
              <ActivePage />
            </div>

            {/* Footer */}
            <footer className="relative mt-10 overflow-hidden border-t border-border/60 pt-4">
              {/* animated footer line */}
              <div className="glow-border absolute left-0 top-0 h-px w-full bg-cyan-400/20" />

              <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-muted-foreground select-none">
                <div className="flex items-center gap-2">
                  <span className="status-dot size-1.5 rounded-full bg-emerald-400" />

                  <p>
                    <span className="font-semibold text-foreground/80">
                      Chain of Truth
                    </span>{' '}
                    · Evidence Integrity System · Forensic Workstation
                  </p>
                </div>

                <p className="font-mono text-[10px] text-muted-foreground/80">
                  VERIFIED RECORD // AI ANALYSIS LAYER SEPARATED
                </p>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </>
  )
}
