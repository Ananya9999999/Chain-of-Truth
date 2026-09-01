'use client'

import { cn } from '@/lib/utils'
import { ShieldCheck } from 'lucide-react'
import { navItems, type PageKey } from '@/lib/nav'

export function Sidebar({
  active,
  onNavigate,
}: {
  active: PageKey
  onNavigate: (key: PageKey) => void
}) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/30">
          <ShieldCheck className="size-5 text-primary" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight text-sidebar-foreground">
            Chain of Truth
          </p>
          <p className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
            Evidence Integrity
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {navItems.map((item) => {
          const isActive = active === item.key
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
              )}
            >
              {isActive && (
                <span className="absolute top-1/2 left-0 h-6 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
              )}
              <item.icon
                className={cn(
                  'size-4 shrink-0 transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground group-hover:text-sidebar-foreground',
                )}
              />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span
                  className={cn(
                    'rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold',
                    item.key === 'ai-flags'
                      ? 'bg-warning/15 text-warning'
                      : 'bg-secondary text-muted-foreground',
                  )}
                >
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="m-3 rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <ShieldCheck className="size-3.5 text-success" />
          Chain of custody intact
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          All 18 evidence items carry a verified cryptographic hash.
        </p>
      </div>
    </aside>
  )
}
