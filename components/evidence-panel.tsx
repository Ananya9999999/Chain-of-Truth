'use client'

import { useState } from 'react'
import { evidenceItems } from '@/lib/mock-data'
import {
  Hash,
  MapPin,
  User,
  Video,
  FileText,
  ShieldCheck,
  Lock,
  Fingerprint,
  Activity,
  CheckCircle2,
  Clock3,
  ChevronRight,
  Database,
  ScanLine,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const typeIcon: Record<string, React.ElementType> = {
  'CCTV Footage': Video,
  'Witness Statement': FileText,
  'ANPR Record': Hash,
  Photograph: FileText,
  'Forensic Report': FileText,
}

export function EvidencePanel() {
  const [selected, setSelected] = useState<string | null>(null)

  const verified = evidenceItems.filter(
    (e) => e.status === 'verified',
  ).length

  const signed = evidenceItems.filter(
    (e) => e.twoPersonConfirmed,
  ).length

  const integrity =
    evidenceItems.length > 0
      ? Math.round((verified / evidenceItems.length) * 100)
      : 0

  return (
    <>
      <style jsx>{`
        @keyframes vaultReveal {
          from {
            opacity: 0;
            transform: translateY(12px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes vaultScan {
          0% {
            transform: translateX(-140%);
            opacity: 0;
          }

          20% {
            opacity: 0.7;
          }

          80% {
            opacity: 0.25;
          }

          100% {
            transform: translateX(420%);
            opacity: 0;
          }
        }

        @keyframes vaultPulse {
          0%,
          100% {
            opacity: 0.35;
          }

          50% {
            opacity: 1;
          }
        }

        @keyframes integrityGlow {
          0%,
          100% {
            box-shadow: 0 0 0 rgba(34, 197, 94, 0);
          }

          50% {
            box-shadow: 0 0 25px rgba(34, 197, 94, 0.08);
          }
        }

        @keyframes progressLoad {
          from {
            width: 0%;
          }
        }

        @keyframes nodePulse {
          0%,
          100% {
            transform: scale(0.9);
            opacity: 0.4;
          }

          50% {
            transform: scale(1.15);
            opacity: 1;
          }
        }

        .vault-reveal {
          animation: vaultReveal 0.65s
            cubic-bezier(0.22, 1, 0.36, 1);
        }

        .vault-scan {
          animation: vaultScan 3.5s ease-in-out infinite;
        }

        .vault-pulse {
          animation: vaultPulse 2s ease-in-out infinite;
        }

        .integrity-glow {
          animation: integrityGlow 3s ease-in-out infinite;
        }

        .progress-load {
          animation: progressLoad 1.2s
            cubic-bezier(0.22, 1, 0.36, 1);
        }

        .node-pulse {
          animation: nodePulse 2.5s ease-in-out infinite;
        }

        .evidence-row {
          transition:
            transform 250ms cubic-bezier(0.22, 1, 0.36, 1),
            border-color 250ms ease,
            background-color 250ms ease,
            box-shadow 250ms ease;
        }

        .evidence-row:hover {
          transform: translateX(2px);
        }

        @media (prefers-reduced-motion: reduce) {
          .vault-reveal,
          .vault-scan,
          .vault-pulse,
          .integrity-glow,
          .progress-load,
          .node-pulse {
            animation: none;
          }
        }
      `}</style>

      <div className="vault-reveal relative overflow-hidden rounded-2xl border border-border/70 bg-card/45 shadow-lg backdrop-blur-xl">

        {/* =============================================== */}
        {/* AMBIENT GRID */}
        {/* =============================================== */}

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(120,190,210,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(120,190,210,0.015)_1px,transparent_1px)] bg-[size:24px_24px]" />

        <div className="pointer-events-none absolute -right-20 -top-20 size-60 rounded-full bg-primary/[0.035] blur-3xl" />


        {/* =============================================== */}
        {/* TOP SCANNER */}
        {/* =============================================== */}

        <div className="relative h-0.5 overflow-hidden bg-secondary/40">

          <div className="vault-scan absolute h-full w-1/4 bg-primary/60 shadow-[0_0_12px_rgba(34,211,238,0.5)]" />

        </div>


        {/* =============================================== */}
        {/* HEADER */}
        {/* =============================================== */}

        <div className="relative border-b border-border/60 p-4">

          <div className="flex items-start justify-between gap-3">

            <div className="flex items-start gap-2.5">

              <div className="relative flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/[0.07] text-primary">

                <Database className="size-4" />

                <span className="vault-pulse absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-success" />

              </div>


              <div>

                <div className="flex items-center gap-2">

                  <h2 className="text-sm font-bold tracking-tight text-foreground">
                    Live Evidence Vault
                  </h2>

                  <span className="hidden rounded border border-primary/20 bg-primary/10 px-1.5 py-0.5 font-mono text-[7px] font-bold text-primary sm:inline-block">
                    SECURED
                  </span>

                </div>

                <p className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  Cryptographically sealed forensic artifacts
                </p>

              </div>

            </div>


            {/* sealed counter */}

            <div className="rounded-lg border border-success/20 bg-success/[0.035] px-2.5 py-1.5 text-right">

              <p className="font-mono text-[7px] uppercase tracking-wider text-muted-foreground">
                Vault Status
              </p>

              <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[9px] font-bold text-success">

                <span className="vault-pulse size-1.5 rounded-full bg-success" />

                {evidenceItems.length}/{evidenceItems.length} SEALED

              </p>

            </div>

          </div>


          {/* =============================================== */}
          {/* INTEGRITY OVERVIEW */}
          {/* =============================================== */}

          <div className="integrity-glow mt-4 rounded-xl border border-border/50 bg-background/20 p-3">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-2">

                <ShieldCheck className="size-3.5 text-success" />

                <span className="font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  Chain Integrity
                </span>

              </div>

              <span className="font-mono text-xs font-black text-success">
                {integrity}%
              </span>

            </div>


            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">

              <div
                className="progress-load h-full rounded-full bg-success shadow-[0_0_10px_rgba(34,197,94,0.35)]"
                style={{ width: `${integrity}%` }}
              />

            </div>


            <div className="mt-2 flex items-center justify-between font-mono text-[7.5px] uppercase tracking-wider text-muted-foreground">

              <span>
                {verified} Verified
              </span>

              <span>
                {signed} Two-Officer Signed
              </span>

            </div>

          </div>

        </div>


        {/* =============================================== */}
        {/* EVIDENCE LIST */}
        {/* =============================================== */}

        <div className="relative space-y-2.5 p-3.5">

          {evidenceItems.slice(0, 4).map((ev, index) => {

            const Icon = typeIcon[ev.type] ?? FileText
            const isSelected = selected === ev.id
            const isVerified = ev.status === 'verified'

            return (

              <button
                key={ev.id}
                type="button"
                onClick={() =>
                  setSelected(isSelected ? null : ev.id)
                }
                className={cn(
                  'evidence-row relative w-full cursor-pointer overflow-hidden rounded-xl border p-3 text-left',
                  isSelected
                    ? 'border-primary/35 bg-primary/[0.045] shadow-md'
                    : 'border-border/60 bg-background/15 hover:border-primary/20 hover:bg-card/60',
                )}
              >

                {/* node */}

                <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary/20" />

                {/* scanner */}

                {isSelected && (
                  <span className="vault-scan pointer-events-none absolute left-0 top-0 h-px w-1/3 bg-primary/50" />
                )}


                {/* TOP */}

                <div className="flex items-start gap-2.5">

                  <div
                    className={cn(
                      'relative flex size-8 shrink-0 items-center justify-center rounded-lg border',
                      isVerified
                        ? 'border-success/20 bg-success/[0.06] text-success'
                        : 'border-warning/25 bg-warning/[0.06] text-warning',
                    )}
                  >

                    <Icon className="size-3.5" />

                    <span
                      className={cn(
                        'node-pulse absolute -right-0.5 -top-0.5 size-1.5 rounded-full',
                        isVerified ? 'bg-success' : 'bg-warning',
                      )}
                    />

                  </div>


                  <div className="min-w-0 flex-1">

                    <div className="flex items-center justify-between gap-2">

                      <p className="truncate text-[11px] font-bold text-foreground">
                        {ev.type}
                      </p>

                      <ChevronRight
                        className={cn(
                          'size-3 shrink-0 text-muted-foreground transition-transform duration-200',
                          isSelected && 'rotate-90 text-primary',
                        )}
                      />

                    </div>


                    <div className="mt-0.5 flex items-center gap-1.5">

                      <span className="rounded border border-border/50 bg-secondary/50 px-1 py-0.5 font-mono text-[7.5px] font-bold text-muted-foreground">
                        {ev.id}
                      </span>

                      <span className="truncate font-mono text-[8.5px] text-muted-foreground">
                        {ev.filename}
                      </span>

                    </div>

                  </div>

                </div>


                {/* METADATA */}

                <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-border/40 pt-2.5">

                  <span className="flex min-w-0 items-center gap-1.5 font-mono text-[8px] text-muted-foreground">

                    <MapPin className="size-2.5 shrink-0 text-primary/60" />

                    <span className="truncate">
                      {ev.location}
                    </span>

                  </span>


                  <span className="flex min-w-0 items-center gap-1.5 font-mono text-[8px] text-muted-foreground">

                    <User className="size-2.5 shrink-0 text-muted-foreground/60" />

                    <span className="truncate">
                      {ev.uploadedBy}
                    </span>

                  </span>


                  <span className="flex min-w-0 items-center gap-1.5 font-mono text-[8px] font-semibold text-success/90">

                    <Hash className="size-2.5 shrink-0" />

                    <span className="truncate">
                      SHA-256 {ev.hash}
                    </span>

                  </span>


                  <span className="flex items-center gap-1.5 font-mono text-[8px]">

                    {ev.twoPersonConfirmed ? (
                      <>
                        <CheckCircle2 className="size-2.5 shrink-0 text-success" />

                        <span className="text-success">
                          2-OFFICER SIGNED
                        </span>
                      </>
                    ) : (
                      <>
                        <Clock3 className="size-2.5 shrink-0 text-warning" />

                        <span className="text-warning">
                          1/2 SIGNATURES
                        </span>
                      </>
                    )}

                  </span>

                </div>


                {/* EXPANDED DETAILS */}

                {isSelected && (

                  <div className="mt-3 rounded-lg border border-primary/15 bg-primary/[0.025] p-2.5">

                    <div className="flex items-center justify-between">

                      <span className="flex items-center gap-1.5 font-mono text-[7.5px] uppercase tracking-wider text-primary">

                        <ScanLine className="size-3" />

                        Integrity Verification

                      </span>

                      <span className="font-mono text-[7px] text-success">
                        MATCH
                      </span>

                    </div>


                    <div className="mt-2 grid grid-cols-2 gap-2">

                      <div className="rounded border border-border/40 bg-background/20 p-2">

                        <p className="font-mono text-[6.5px] uppercase text-muted-foreground">
                          Custodian
                        </p>

                        <p className="mt-0.5 truncate font-mono text-[8px] font-semibold text-foreground">
                          {ev.uploadedBy}
                        </p>

                      </div>


                      <div className="rounded border border-border/40 bg-background/20 p-2">

                        <p className="font-mono text-[6.5px] uppercase text-muted-foreground">
                          Timestamp
                        </p>

                        <p className="mt-0.5 truncate font-mono text-[8px] font-semibold text-foreground">
                          {ev.timestamp}
                        </p>

                      </div>

                    </div>

                  </div>

                )}

              </button>

            )
          })}

        </div>


        {/* =============================================== */}
        {/* BOTTOM SECURITY STRIP */}
        {/* =============================================== */}

        <div className="relative border-t border-border/50 bg-secondary/[0.15] px-3.5 py-2.5">

          <div className="flex items-center justify-between gap-2">

            <div className="flex min-w-0 items-center gap-1.5">

              <Lock className="size-3 shrink-0 text-primary" />

              <span className="truncate font-mono text-[7.5px] uppercase tracking-wider text-muted-foreground">
                SHA-256 integrity monitor active
              </span>

            </div>


            <div className="flex shrink-0 items-center gap-1.5 font-mono text-[7px] font-bold text-success">

              <span className="vault-pulse size-1.5 rounded-full bg-success" />

              LIVE

            </div>

          </div>

        </div>

      </div>
    </>
  )
}