'use client'

/**
 * Workspace header: case selector, global search, notifications, session.
 *
 * Every control here does something. The search indexes evidence, statements,
 * AI flags, timeline events, audit entries and case IDs from the live store —
 * including SHA-256 prefixes, because "find the item with this hash" is a real
 * forensic task and a search box that cannot do it is decoration.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import {
  Bell,
  Bot,
  Check,
  ChevronDown,
  FileText,
  FolderLock,
  LogOut,
  MapPin,
  Plus,
  Search,
  ScrollText,
  ShieldCheck,
  Moon,
  Sun,
  X,
} from 'lucide-react'

import { AddCaseModal } from '@/components/modals'
import { useStore } from '@/lib/store'
import { clearSession, getSession, type OfficerSession } from '@/lib/auth'
import { useTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'
import type { PageKey } from '@/lib/nav'

interface SearchHit {
  id: string
  label: string
  detail: string
  kind: 'Evidence' | 'Statement' | 'AI flag' | 'Timeline' | 'Audit' | 'Case'
  page: PageKey
}

const KIND_ICON = {
  Evidence: FolderLock,
  Statement: FileText,
  'AI flag': Bot,
  Timeline: MapPin,
  Audit: ScrollText,
  Case: ShieldCheck,
} as const

export function Header({ onNavigate }: { onNavigate?: (key: PageKey) => void }) {
  const router = useRouter()
  const store = useStore()
  const [session, setSession] = useState<OfficerSession | null>(null)
  const [openPanel, setOpenPanel] = useState<'search' | 'bell' | 'case' | null>(null)
  const [query, setQuery] = useState('')
  const [addCase, setAddCase] = useState(false)
  const searchInput = useRef<HTMLInputElement>(null)
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => setSession(getSession()), [])

  // Cmd/Ctrl+K opens search; Escape closes whatever is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpenPanel('search')
        window.setTimeout(() => searchInput.current?.focus(), 40)
      }
      if (e.key === 'Escape') setOpenPanel(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Click-away closes any open panel.
  useEffect(() => {
    if (!openPanel) return
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpenPanel(null)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [openPanel])

  const results = useMemo<SearchHit[]>(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    const hits: SearchHit[] = []
    const match = (...fields: (string | undefined)[]) =>
      fields.some((f) => f?.toLowerCase().includes(q))

    for (const e of store.evidence) {
      if (match(e.id, e.filename, e.type, e.location, e.uploadedBy, e.hash))
        hits.push({ id: e.id, label: e.id, detail: `${e.type} · ${e.filename}`, kind: 'Evidence', page: 'evidence' })
    }
    for (const s of store.statements) {
      if (match(s.id, s.witness, s.text, s.location))
        hits.push({ id: s.id, label: `${s.id} — ${s.witness}`, detail: s.text.slice(0, 64), kind: 'Statement', page: 'statements' })
    }
    for (const f of store.flags) {
      if (match(f.id, f.title, f.explanation))
        hits.push({ id: f.id, label: f.title, detail: `${f.id} · ${Math.round(f.confidence * 100)}% confidence`, kind: 'AI flag', page: 'ai-flags' })
    }
    for (const t of store.timeline) {
      if (match(t.id, t.title, t.description, t.source))
        hits.push({ id: t.id, label: t.title, detail: `${t.date} ${t.time}`, kind: 'Timeline', page: 'timeline' })
    }
    for (const a of store.audit) {
      if (match(a.id, a.actor, a.action, a.item))
        hits.push({ id: a.id, label: `${a.action} — ${a.item}`, detail: `${a.actor} · ${a.date}`, kind: 'Audit', page: 'audit' })
    }
    for (const c of store.cases) {
      if (match(c.id, c.title, c.description))
        hits.push({ id: c.id, label: `${c.id} — ${c.title}`, detail: c.status, kind: 'Case', page: 'overview' })
    }
    return hits.slice(0, 12)
  }, [query, store])

  function logout() {
    clearSession()
    router.replace('/login')
  }

  function goTo(page: PageKey) {
    onNavigate?.(page)
    setOpenPanel(null)
    setQuery('')
  }

  const name = session?.fullName || store.activeCase.officer
  const role = session?.role || 'Investigating Officer'
  const initials = session?.initials || 'AM'

  return (
    <header
      ref={rootRef}
      className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/85 px-3 backdrop-blur-md sm:px-5"
    >
      {/* ── case selector ── */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenPanel(openPanel === 'case' ? null : 'case')}
          aria-expanded={openPanel === 'case'}
          className="btn-press flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5 text-sm transition-colors hover:bg-secondary"
        >
          <span className="hidden font-mono text-[10px] tracking-wider text-muted-foreground uppercase sm:inline">
            Case
          </span>
          <span className="font-mono text-xs font-semibold text-foreground">
            {store.activeCase.id}
          </span>
          <ChevronDown className="size-3 text-muted-foreground" aria-hidden="true" />
        </button>

        <AnimatePresence>
          {openPanel === 'case' && (
            <Dropdown className="w-80">
              <p className="px-3 pt-2 pb-1 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                Active case
              </p>
              {store.cases.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { store.setActiveCase(c.id); setOpenPanel(null) }}
                  className={cn(
                    'flex w-full items-start gap-2.5 px-3 py-2 text-left transition-colors hover:bg-secondary/60',
                    c.id === store.activeCaseId && 'bg-primary/10',
                  )}
                >
                  <ShieldCheck
                    className={cn('mt-0.5 size-3.5 shrink-0',
                      c.id === store.activeCaseId ? 'text-primary' : 'text-muted-foreground')}
                    aria-hidden="true"
                  />
                  <span className="min-w-0">
                    <span className="block font-mono text-[11px] text-foreground">{c.id}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">{c.title}</span>
                  </span>
                  {c.id === store.activeCaseId && (
                    <Check className="ml-auto size-3.5 shrink-0 text-primary" aria-hidden="true" />
                  )}
                </button>
              ))}
              <div className="border-t border-border p-2">
                <button
                  type="button"
                  onClick={() => { setAddCase(true); setOpenPanel(null) }}
                  className="btn-press flex w-full items-center justify-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/20"
                >
                  <Plus className="size-3.5" aria-hidden="true" /> Add case
                </button>
              </div>
            </Dropdown>
          )}
        </AnimatePresence>
      </div>

      {/* ── search ── */}
      <div className="relative ml-auto flex-1 sm:ml-2 sm:max-w-md">
        <button
          type="button"
          onClick={() => {
            setOpenPanel('search')
            window.setTimeout(() => searchInput.current?.focus(), 40)
          }}
          className="btn-press flex w-full items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-secondary"
        >
          <Search className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="hidden truncate sm:inline">Search evidence, hashes, flags…</span>
          <span className="sm:hidden">Search</span>
          <kbd className="ml-auto hidden rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[9px] sm:inline">
            ⌘K
          </kbd>
        </button>

        <AnimatePresence>
          {openPanel === 'search' && (
            <Dropdown className="left-0 w-[min(560px,calc(100vw-1.5rem))]">
              <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                <Search className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <input
                  ref={searchInput}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Evidence ID, filename, hash, witness, flag…"
                  aria-label="Search the case"
                  className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
                />
                <button type="button" onClick={() => setOpenPanel(null)} aria-label="Close search"
                  className="rounded p-0.5 text-muted-foreground hover:text-foreground">
                  <X className="size-3.5" />
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {query.trim().length < 2 ? (
                  <p className="px-3 py-6 text-center text-[11px] text-muted-foreground">
                    Type at least two characters. Hash prefixes work too.
                  </p>
                ) : results.length === 0 ? (
                  <p className="px-3 py-6 text-center text-[11px] text-muted-foreground">
                    No match for “{query}” in this case.
                  </p>
                ) : (
                  results.map((r, i) => {
                    const Icon = KIND_ICON[r.kind]
                    return (
                      <motion.button
                        key={`${r.kind}-${r.id}-${i}`}
                        type="button"
                        onClick={() => goTo(r.page)}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02, duration: 0.18 }}
                        className="flex w-full items-start gap-2.5 px-3 py-2 text-left transition-colors hover:bg-secondary/60"
                      >
                        <Icon className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs text-foreground">{r.label}</span>
                          <span className="block truncate text-[11px] text-muted-foreground">{r.detail}</span>
                        </span>
                        <span className="shrink-0 rounded border border-border px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
                          {r.kind}
                        </span>
                      </motion.button>
                    )
                  })
                )}
              </div>
            </Dropdown>
          )}
        </AnimatePresence>
      </div>

      {/* ── theme ── */}
      <ThemeToggle />

      {/* ── notifications ── */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenPanel(openPanel === 'bell' ? null : 'bell')}
          aria-label={`Notifications${store.stats.unread ? `, ${store.stats.unread} unread` : ''}`}
          aria-expanded={openPanel === 'bell'}
          className="btn-press relative flex size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Bell className="size-4" aria-hidden="true" />
          {store.stats.unread > 0 && (
            <motion.span
              key={store.stats.unread}
              initial={{ scale: 0.4 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary font-mono text-[9px] font-bold text-black"
            >
              {store.stats.unread}
            </motion.span>
          )}
        </button>

        <AnimatePresence>
          {openPanel === 'bell' && (
            <Dropdown className="right-0 w-[min(380px,calc(100vw-1.5rem))]">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <p className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                  Notifications
                </p>
                <MarkAllRead />
              </div>
              <div className="max-h-80 overflow-y-auto">
                {store.notifications.length === 0 ? (
                  <p className="px-3 py-6 text-center text-[11px] text-muted-foreground">
                    Nothing new.
                  </p>
                ) : (
                  store.notifications.map((n, i) => (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.2 }}
                      className={cn(
                        'flex items-start gap-2.5 border-b border-border/50 px-3 py-2.5 last:border-0',
                        !n.read && 'bg-primary/[0.06]',
                      )}
                    >
                      <span
                        className={cn('mt-1.5 size-1.5 shrink-0 rounded-full',
                          n.read ? 'bg-muted-foreground/40' : 'bg-primary')}
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground">{n.title}</p>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                          {n.detail}
                        </p>
                        <p className="mt-1 font-mono text-[10px] text-muted-foreground/70">{n.time}</p>
                      </div>
                      {!n.read && <ReadButton id={n.id} />}
                    </motion.div>
                  ))
                )}
              </div>
            </Dropdown>
          )}
        </AnimatePresence>
      </div>

      {/* ── session ── */}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card py-1 pr-2 pl-1.5">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary/15 font-mono text-xs font-semibold text-primary">
          {initials}
        </div>
        <div className="hidden leading-tight sm:block">
          <p className="text-xs font-semibold text-foreground">{name}</p>
          <p className="text-[10px] text-muted-foreground">{role}</p>
        </div>
        <button
          type="button"
          onClick={logout}
          aria-label="Sign out"
          title="Sign out"
          className="btn-press ml-1 flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <LogOut className="size-3.5" aria-hidden="true" />
        </button>
      </div>

      <AddCaseModal open={addCase} onClose={() => setAddCase(false)} />
    </header>
  )
}

function Dropdown({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'absolute top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-xl border border-border bg-card shadow-2xl backdrop-blur-md',
        className,
      )}
    >
      {children}
    </motion.div>
  )
}

function MarkAllRead() {
  const { stats, markAllNotificationsRead } = useStore()
  return (
    <button
      type="button"
      disabled={stats.unread === 0}
      onClick={markAllNotificationsRead}
      className="text-[10px] text-primary transition-opacity hover:underline disabled:opacity-40"
    >
      Mark all read
    </button>
  )
}

function ReadButton({ id }: { id: string }) {
  const { markNotificationRead } = useStore()
  return (
    <button
      type="button"
      onClick={() => markNotificationRead(id)}
      aria-label="Mark as read"
      title="Mark as read"
      className="btn-press shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      <Check className="size-3" />
    </button>
  )
}

function ThemeToggle() {
  const { resolved, toggle } = useTheme()
  const light = resolved === 'light'
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${light ? 'dark' : 'light'} theme`}
      title={`Switch to ${light ? 'dark' : 'light'} theme`}
      className="btn-press flex size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      {light ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </button>
  )
}
