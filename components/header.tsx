'use client'

import { useEffect, useState } from 'react'
import {
  Bell,
  ChevronDown,
  Command,
  LockKeyhole,
  Search,
  ShieldCheck,
  Wifi,
  Zap,
} from 'lucide-react'
import { caseMeta } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

export function Header() {
  const [time, setTime] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)

  useEffect(() => {
    const update = () => {
      setTime(
        new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      )
    }

    update()

    const timer = setInterval(update, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <>
      <style jsx>{`
        @keyframes headerPulse {
          0%,
          100% {
            opacity: 0.4;
          }

          50% {
            opacity: 1;
          }
        }

        @keyframes headerScan {
          0% {
            transform: translateX(-150%);
          }

          100% {
            transform: translateX(500%);
          }
        }

        @keyframes headerDrop {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .header-pulse {
          animation: headerPulse 2s ease-in-out infinite;
        }

        .header-scan {
          animation: headerScan 4s linear infinite;
        }

        .header-drop {
          animation: headerDrop 0.2s ease-out;
        }

        @media (prefers-reduced-motion: reduce) {
          .header-pulse,
          .header-scan {
            animation: none;
          }
        }
      `}</style>

      <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border/70 bg-background/75 px-4 backdrop-blur-xl select-none sm:px-5">

        {/* TOP SCANNER */}

        <div className="pointer-events-none absolute left-0 right-0 top-0 h-px overflow-hidden bg-border/20">
          <div className="header-scan h-full w-1/5 bg-primary/70 shadow-[0_0_12px_var(--primary)]" />
        </div>


        {/* ================================================= */}
        {/* CASE SELECTOR */}
        {/* ================================================= */}

        <button className="group relative flex shrink-0 items-center gap-2.5 rounded-xl border border-border/70 bg-card/50 px-2.5 py-1.5 shadow-sm backdrop-blur-md transition-all hover:border-primary/25 hover:bg-card/80">

          <div className="relative flex size-7 items-center justify-center rounded-lg border border-primary/20 bg-primary/[0.07]">

            <ShieldCheck className="size-3.5 text-primary transition-transform group-hover:scale-110" />

            <span className="header-pulse absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-success" />

          </div>

          <div className="hidden text-left sm:block">

            <div className="flex items-center gap-1.5">

              <span className="font-mono text-[7px] font-bold tracking-wider text-muted-foreground uppercase">
                Active Case
              </span>

              <span className="rounded bg-success/10 px-1 py-0.5 font-mono text-[6px] font-bold text-success">
                OPEN
              </span>

            </div>

            <p className="font-mono text-[11px] font-black tracking-tight text-foreground">
              #{caseMeta.id}
            </p>

          </div>

          <ChevronDown className="size-3 text-muted-foreground transition-transform group-hover:translate-y-0.5" />

        </button>


        {/* ================================================= */}
        {/* SEARCH */}
        {/* ================================================= */}

        <div className="relative ml-1 hidden max-w-xl flex-1 md:block">

          <div
            className={`relative overflow-hidden rounded-xl border transition-all duration-200 ${
              searchFocused
                ? 'border-primary/40 bg-card/80 shadow-lg shadow-primary/[0.04]'
                : 'border-border/60 bg-card/35'
            }`}
          >

            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/70" />

            <input
              type="text"
              placeholder="Search evidence, statements, hashes, timestamps..."
              aria-label="Search case records"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="h-9 w-full bg-transparent pr-20 pl-9 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/50"
            />

            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">

              <kbd className="flex items-center gap-0.5 rounded-md border border-border/60 bg-secondary/70 px-1.5 py-1 font-mono text-[8px] font-bold text-muted-foreground">
                <Command className="size-2.5" />
                K
              </kbd>

            </div>

          </div>

          {/* SEARCH STATUS */}

          {searchFocused && (
            <div className="absolute left-0 right-0 top-11 rounded-xl border border-border/70 bg-card/95 p-3 shadow-2xl backdrop-blur-xl">

              <div className="flex items-center gap-2 font-mono text-[8px] text-muted-foreground">

                <Zap className="size-3 text-primary" />

                <span>
                  Search across verified records and AI working layer
                </span>

              </div>

              <div className="mt-2 grid grid-cols-3 gap-1.5">

                <SearchHint label="Evidence" value="18" />

                <SearchHint label="Timeline" value="12" />

                <SearchHint label="Flags" value="03" />

              </div>

            </div>
          )}

        </div>


        {/* ================================================= */}
        {/* RIGHT SYSTEM BAR */}
        {/* ================================================= */}

        <div className="ml-auto flex items-center gap-2">

          {/* LIVE CLOCK */}

          <div className="hidden items-center gap-2 rounded-lg border border-border/50 bg-secondary/30 px-2.5 py-1.5 lg:flex">

            <span className="header-pulse size-1.5 rounded-full bg-success" />

            <div className="text-right">

              <p className="font-mono text-[7px] font-bold tracking-wider text-muted-foreground">
                SYSTEM TIME
              </p>

              <p className="font-mono text-[9px] font-bold text-foreground">
                {time || '--:--:--'}
              </p>

            </div>

          </div>


          {/* ENCRYPTION */}

          <div className="hidden items-center gap-1.5 rounded-lg border border-success/20 bg-success/[0.04] px-2.5 py-1.5 xl:flex">

            <LockKeyhole className="size-3 text-success" />

            <span className="font-mono text-[7px] font-bold tracking-wider text-success">
              AES-256
            </span>

          </div>


          {/* NETWORK */}

          <div className="hidden items-center gap-1.5 rounded-lg border border-border/50 bg-secondary/30 px-2.5 py-1.5 lg:flex">

            <Wifi className="size-3 text-primary" />

            <span className="font-mono text-[7px] font-bold tracking-wider text-muted-foreground">
              SECURE
            </span>

          </div>


          {/* ================================================= */}
          {/* NOTIFICATIONS */}
          {/* ================================================= */}

          <div className="relative">

            <button
              aria-label="Notifications"
              onClick={() => setNotificationOpen((v) => !v)}
              className={`relative flex size-9 cursor-pointer items-center justify-center rounded-xl border transition-all ${
                notificationOpen
                  ? 'border-primary/35 bg-primary/10 text-primary'
                  : 'border-border/70 bg-secondary/40 text-muted-foreground hover:border-border hover:bg-secondary hover:text-foreground'
              }`}
            >

              <Bell className="size-3.5" />

              <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-warning ring-2 ring-background" />

            </button>


            {/* NOTIFICATION PANEL */}

            {notificationOpen && (
              <div className="header-drop absolute right-0 top-11 w-72 overflow-hidden rounded-xl border border-border/70 bg-card/95 shadow-2xl backdrop-blur-xl">

                <div className="border-b border-border/60 p-3">

                  <div className="flex items-center justify-between">

                    <div>

                      <p className="text-xs font-bold text-foreground">
                        System Alerts
                      </p>

                      <p className="mt-0.5 font-mono text-[7px] text-muted-foreground">
                        LIVE CASE NOTIFICATIONS
                      </p>

                    </div>

                    <span className="rounded border border-warning/25 bg-warning/10 px-1.5 py-0.5 font-mono text-[7px] font-bold text-warning">
                      03 NEW
                    </span>

                  </div>

                </div>


                <div className="space-y-1 p-2">

                  <Notification
                    title="High-severity contradiction"
                    body="CF-07 requires officer review"
                    danger
                  />

                  <Notification
                    title="Evidence integrity verified"
                    body="18/18 artifacts remain sealed"
                  />

                  <Notification
                    title="AI analysis updated"
                    body="New location hypothesis generated"
                    primary
                  />

                </div>


                <div className="border-t border-border/50 px-3 py-2">

                  <p className="font-mono text-[7px] text-muted-foreground">
                    Notifications are non-admissible working-layer events.
                  </p>

                </div>

              </div>
            )}

          </div>


          {/* ================================================= */}
          {/* OFFICER */}
          {/* ================================================= */}

          <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-card/50 py-1 pl-1.5 pr-2.5 shadow-sm backdrop-blur-md">

            <div className="relative flex size-7 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 font-mono text-[9px] font-black text-primary">

              AM

              <span className="absolute -bottom-0.5 -right-0.5 size-1.5 rounded-full border border-background bg-success" />

            </div>

            <div className="hidden leading-tight sm:block">

              <p className="text-[10px] font-bold tracking-tight text-foreground">
                {caseMeta.officer}
              </p>

              <p className="font-mono text-[7px] tracking-wider text-muted-foreground uppercase">
                {caseMeta.role}
              </p>

            </div>

          </div>

        </div>

      </header>
    </>
  )
}


/* ========================================================= */
/* SEARCH HINT */
/* ========================================================= */

function SearchHint({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-md border border-border/50 bg-secondary/30 px-2 py-1.5">

      <p className="font-mono text-[6px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>

      <p className="mt-0.5 font-mono text-[9px] font-bold text-foreground">
        {value}
      </p>

    </div>
  )
}


/* ========================================================= */
/* NOTIFICATION */
/* ========================================================= */

function Notification({
  title,
  body,
  danger,
  primary,
}: {
  title: string
  body: string
  danger?: boolean
  primary?: boolean
}) {
  return (
    <div className="flex gap-2.5 rounded-lg border border-border/50 bg-background/20 p-2.5">

      <span
        className={cn(
          'mt-1.5 size-1.5 shrink-0 rounded-full',
          danger
            ? 'bg-danger'
            : primary
              ? 'bg-primary'
              : 'bg-success',
        )}
      />

      <div className="min-w-0">

        <p className="truncate text-[10px] font-semibold text-foreground">
          {title}
        </p>

        <p className="mt-0.5 text-[8px] leading-relaxed text-muted-foreground">
          {body}
        </p>

      </div>

    </div>
  )
}