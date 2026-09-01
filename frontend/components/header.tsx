'use client'

import { Search, Bell, ChevronDown } from 'lucide-react'
import { caseMeta } from '@/lib/mock-data'

export function Header() {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-5 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm transition-colors hover:bg-secondary">
          <span className="font-mono text-xs text-muted-foreground">Case</span>
          <span className="font-mono text-sm font-semibold text-foreground">
            #{caseMeta.id}
          </span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="relative ml-2 hidden max-w-md flex-1 md:block">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search evidence, statements, or case IDs…"
          aria-label="Search"
          className="h-9 w-full rounded-lg border border-border bg-card pr-3 pl-9 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring/60 focus:ring-2 focus:ring-ring/20"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          aria-label="Notifications"
          className="relative flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Bell className="size-4" />
          <span className="absolute top-2 right-2 size-1.5 rounded-full bg-warning" />
        </button>

        <div className="flex items-center gap-2.5 rounded-lg border border-border bg-card py-1 pr-3 pl-1.5">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary/15 font-mono text-xs font-semibold text-primary">
            AM
          </div>
          <div className="hidden leading-tight sm:block">
            <p className="text-xs font-semibold text-foreground">
              {caseMeta.officer}
            </p>
            <p className="text-[10px] text-muted-foreground">{caseMeta.role}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
