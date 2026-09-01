import {
  LayoutDashboard,
  FolderLock,
  GitBranch,
  Flag,
  Map,
  ScrollText,
  Settings,
<<<<<<< HEAD
=======
  Scale,
  Stethoscope,
  FileCheck2,
  Link2,
>>>>>>> origin/main
} from 'lucide-react'

export type PageKey =
  | 'overview'
  | 'evidence'
  | 'timeline'
  | 'ai-flags'
<<<<<<< HEAD
=======
  | 'guidance'
  | 'autopsy'
  | 'chargesheet'
  | 'chain'
>>>>>>> origin/main
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
<<<<<<< HEAD
  { key: 'evidence', label: 'Evidence', icon: FolderLock, badge: '18' },
  { key: 'timeline', label: 'Case Timeline', icon: GitBranch, badge: null },
  { key: 'ai-flags', label: 'AI Flags', icon: Flag, badge: '6' },
=======
  { key: 'evidence', label: 'Evidence', icon: FolderLock, badge: '3' },
  { key: 'timeline', label: 'Case Timeline', icon: GitBranch, badge: null },
  { key: 'ai-flags', label: 'AI Flags', icon: Flag, badge: '2' },
  { key: 'guidance', label: 'Investigation Guidance', icon: Scale, badge: null },
  { key: 'autopsy', label: 'Autopsy Agent', icon: Stethoscope, badge: null },
  { key: 'chargesheet', label: 'Chargesheet QA', icon: FileCheck2, badge: null },
  { key: 'chain', label: 'Hash Chain', icon: Link2, badge: null },
>>>>>>> origin/main
  { key: 'location', label: 'Location Analysis', icon: Map, badge: null },
  { key: 'audit', label: 'Audit Trail', icon: ScrollText, badge: null },
  { key: 'settings', label: 'Settings', icon: Settings, badge: null },
]
