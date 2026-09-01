import { CaseHeader } from '@/components/case-header'
import { CaseTimeline } from '@/components/case-timeline'
import { ContradictionAlert } from '@/components/contradiction-alert'
import { EvidencePanel } from '@/components/evidence-panel'
import { LocationAnalysis } from '@/components/location-analysis'
import { AiTransparency } from '@/components/ai-transparency'
import { AuditTrail } from '@/components/audit-trail'

export function OverviewPage() {
  return (
    <>
      <style jsx>{`
        @keyframes overviewReveal {
          0% {
            opacity: 0;
            transform: translateY(24px) scale(0.985);
            filter: blur(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes alertGlow {
          0%,
          100% {
            box-shadow: 0 0 0 rgba(245, 158, 11, 0);
          }

          50% {
            box-shadow:
              0 0 25px rgba(245, 158, 11, 0.08),
              inset 0 0 25px rgba(245, 158, 11, 0.025);
          }
        }

        @keyframes scan {
          0% {
            transform: translateX(-120%);
            opacity: 0;
          }

          20% {
            opacity: 0.6;
          }

          80% {
            opacity: 0.15;
          }

          100% {
            transform: translateX(120%);
            opacity: 0;
          }
        }

        @keyframes verifiedPulse {
          0%,
          100% {
            opacity: 0.5;
            transform: scale(0.9);
          }

          50% {
            opacity: 1;
            transform: scale(1.15);
          }
        }

        .overview-section {
          opacity: 0;
          animation: overviewReveal 0.7s
            cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .overview-section:nth-child(1) {
          animation-delay: 0.05s;
        }

        .overview-section:nth-child(2) {
          animation-delay: 0.15s;
        }

        .overview-section:nth-child(3) {
          animation-delay: 0.25s;
        }

        .overview-section:nth-child(4) {
          animation-delay: 0.35s;
        }

        .overview-section:nth-child(5) {
          animation-delay: 0.45s;
        }

        .overview-section:nth-child(6) {
          animation-delay: 0.55s;
        }

        .overview-alert {
          animation:
            overviewReveal 0.7s
              cubic-bezier(0.22, 1, 0.36, 1) forwards,
            alertGlow 3s ease-in-out 1s infinite;
        }

        .overview-card {
          position: relative;
          overflow: hidden;
          transition:
            transform 350ms cubic-bezier(0.22, 1, 0.36, 1),
            border-color 350ms ease,
            box-shadow 350ms ease;
        }

        .overview-card::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 35%;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(34, 211, 238, 0.7),
            transparent
          );
          opacity: 0;
          pointer-events: none;
        }

        .overview-card:hover {
          transform: translateY(-3px);
          box-shadow:
            0 12px 40px rgba(0, 0, 0, 0.25),
            0 0 25px rgba(34, 211, 238, 0.035);
        }

        .overview-card:hover::after {
          opacity: 1;
          animation: scan 1.3s ease-in-out;
        }

        .verified-dot {
          animation: verifiedPulse 2.2s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .overview-section,
          .overview-alert {
            animation: none;
            opacity: 1;
          }

          .overview-card {
            transition: none;
          }
        }
      `}</style>

      <div className="space-y-5">
        {/* CASE HEADER */}
        <section className="overview-section">
          <div className="overview-card">
            <CaseHeader />
          </div>
        </section>

        {/* CONTRADICTION ALERT */}
        <section className="overview-alert">
          <div className="relative">
            <div className="pointer-events-none absolute left-0 top-0 z-10 h-px w-full overflow-hidden">
              <div className="h-full w-1/3 bg-amber-400/60 blur-[1px] animate-[scan_3s_ease-in-out_infinite]" />
            </div>

            <ContradictionAlert />
          </div>
        </section>

        {/* MAIN GRID */}
        <div className="grid gap-5 xl:grid-cols-3">
          {/* LEFT COLUMN */}
          <div className="space-y-5 xl:col-span-2">
            <section className="overview-section">
              <div className="overview-card">
                <CaseTimeline />
              </div>
            </section>

            <section className="overview-section">
              <div className="overview-card">
                <LocationAnalysis />
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-5">
            <section className="overview-section">
              <div className="overview-card">
                <EvidencePanel />
              </div>
            </section>

            <section className="overview-section">
              <div className="overview-card">
                <AiTransparency />
              </div>
            </section>

            <section className="overview-section">
              <div className="overview-card">
                <AuditTrail />
              </div>
            </section>
          </div>
        </div>

        {/* LIVE SYSTEM STATUS */}
        <div className="overview-section flex items-center justify-between border-t border-border/40 pt-4">
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            <span className="verified-dot size-1.5 rounded-full bg-emerald-400" />
            Investigation engine active
          </div>

          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/50">
            AI WORKING LAYER // HUMAN REVIEW REQUIRED
          </div>
        </div>
      </div>
    </>
  )
}