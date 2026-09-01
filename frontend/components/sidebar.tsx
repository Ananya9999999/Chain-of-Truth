'use client'

/**
 * Navigation rail.
 *
 * Nineteen destinations is a lot, so they are grouped by what the officer is
 * doing — working the case, reading AI analysis, reviewing, or checking
 * integrity — rather than listed flat. The active item is marked by an
 * animated rail indicator that slides between entries, so the eye tracks the
 * move instead of re-scanning the list.
 */

import { ShieldCheck } from 'lucide-react'
import { motion } from 'motion/react'

import { navGroups, navItems, type PageKey } from '@/lib/nav'
import { cn } from '@/lib/utils'

export function Sidebar({
  active,
  onNavigate,
}: {
  active: PageKey
  onNavigate: (key: PageKey) => void
}) {
  return (
    <aside className="animate-slide-in-left hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-5">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary/15">
          <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight text-sidebar-foreground">
            Chain of Truth
          </p>
          <p className="font-mono text-[9px] tracking-wider text-muted-foreground uppercase">
            Evidence Integrity
          </p>
        </div>
      </div>

      <nav
        aria-label="Case sections"
        className="flex-1 space-y-4 overflow-y-auto px-3 py-3"
      >
        {navGroups.map((group) => {
          const items = navItems.filter((i) => i.group === group)
          if (items.length === 0) return null
          return (
            <div key={group} className="space-y-1">
              <p className="px-3 pb-1 font-mono text-[9px] tracking-[0.12em] text-muted-foreground/70 uppercase">
                {group}
              </p>
              {items.map((item) => {
                const Icon = item.icon
                const isActive = item.key === active
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onNavigate(item.key)}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'btn-press group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-all duration-200',
                      isActive
                        ? 'text-primary'
                        : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
                    )}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-0 -z-10 rounded-lg border border-primary/30 bg-primary/10"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <span className="shrink-0 rounded-full bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                        {item.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )
        })}
      </nav>

      <div className="shrink-0 border-t border-sidebar-border px-4 py-3">
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          <span className="font-mono font-bold text-primary">AI assists.</span>{' '}
          <span className="font-mono font-bold text-emerald-400">Humans decide.</span>
          <br />
          No AI output enters the case record without an officer confirming it.
        </p>
      </div>
    </aside>
  )
}
