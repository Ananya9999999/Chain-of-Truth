import {
  LayoutDashboard,
  FolderLock,
  GitBranch,
  Flag,
  Map,
  ScrollText,
  Settings,
} from 'lucide-react'

export type PageKey =
  | 'overview'
  | 'evidence'
  | 'timeline'
  | 'ai-flags'
  | 'location'
  | 'audit'
  | 'settings'

export type NavItem = {
  key: PageKey
  label: string
  icon: React.ElementType
  badge: string | null
}

export const navItems: NavItem[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard, badge: null },
  { key: 'evidence', label: 'Evidence', icon: FolderLock, badge: '18' },
  { key: 'timeline', label: 'Case Timeline', icon: GitBranch, badge: null },
  { key: 'ai-flags', label: 'AI Flags', icon: Flag, badge: '6' },
  { key: 'location', label: 'Location Analysis', icon: Map, badge: null },
  { key: 'audit', label: 'Audit Trail', icon: ScrollText, badge: null },
  { key: 'settings', label: 'Settings', icon: Settings, badge: null },
]
