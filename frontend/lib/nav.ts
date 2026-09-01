import {
  LayoutDashboard,
  FolderLock,
  GitBranch,
  Flag,
  Map,
  ScrollText,
  Settings,
  Scale,
  Stethoscope,
  FileCheck2,
  Link2,
} from 'lucide-react'

export type PageKey =
  | 'overview'
  | 'evidence'
  | 'timeline'
  | 'ai-flags'
  | 'guidance'
  | 'autopsy'
  | 'chargesheet'
  | 'chain'
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
  { key: 'evidence', label: 'Evidence', icon: FolderLock, badge: '3' },
  { key: 'timeline', label: 'Case Timeline', icon: GitBranch, badge: null },
  { key: 'ai-flags', label: 'AI Flags', icon: Flag, badge: '2' },
  { key: 'guidance', label: 'Investigation Guidance', icon: Scale, badge: null },
  { key: 'autopsy', label: 'Autopsy Agent', icon: Stethoscope, badge: null },
  { key: 'chargesheet', label: 'Chargesheet QA', icon: FileCheck2, badge: null },
  { key: 'chain', label: 'Hash Chain', icon: Link2, badge: null },
  { key: 'location', label: 'Location Analysis', icon: Map, badge: null },
  { key: 'audit', label: 'Audit Trail', icon: ScrollText, badge: null },
  { key: 'settings', label: 'Settings', icon: Settings, badge: null },
]
