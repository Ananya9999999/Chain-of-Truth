import type { LucideIcon } from 'lucide-react'
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
  Share2,
  ClipboardCheck,
  Gauge,
  SearchCode,
  MessagesSquare,
  Smartphone,
  AlertTriangle,
} from 'lucide-react'

export type PageKey =
  | 'overview'
  | 'evidence'
  | 'timeline'
  | 'contradictions'
  | 'verification'
  | 'graph'
  | 'ai-flags'
  | 'guidance'
  | 'gaps'
  | 'readiness'
  | 'autopsy'
  | 'chargesheet'
  | 'similarity'
  | 'statements'
  | 'correlation'
  | 'location'
  | 'audit'
  | 'settings'

export type NavItem = {
  key: PageKey
  label: string
  icon: LucideIcon
  badge: string | null
  /** Groups the rail so nineteen entries stay navigable. */
  group: 'Case' | 'AI analysis' | 'Review' | 'Integrity'
}

export const navItems: NavItem[] = [
  // Case
  { key: 'overview', label: 'Command Center', icon: LayoutDashboard, badge: null, group: 'Case' },
  { key: 'evidence', label: 'Evidence', icon: FolderLock, badge: null, group: 'Case' },
  { key: 'timeline', label: 'Case Timeline', icon: GitBranch, badge: null, group: 'Case' },
  { key: 'graph', label: 'Evidence Graph', icon: Share2, badge: null, group: 'Case' },
  { key: 'location', label: 'Forensic Map', icon: Map, badge: null, group: 'Case' },

  // AI analysis
  { key: 'contradictions', label: 'Contradictions', icon: AlertTriangle, badge: null, group: 'AI analysis' },
  { key: 'ai-flags', label: 'AI Extractions', icon: Flag, badge: null, group: 'AI analysis' },
  { key: 'guidance', label: 'Investigation Guidance', icon: Scale, badge: null, group: 'AI analysis' },
  { key: 'gaps', label: 'Evidence Gaps', icon: SearchCode, badge: null, group: 'AI analysis' },
  { key: 'autopsy', label: 'Autopsy Cross-Check', icon: Stethoscope, badge: null, group: 'AI analysis' },
  { key: 'statements', label: 'Statement Reliability', icon: MessagesSquare, badge: null, group: 'AI analysis' },
  { key: 'correlation', label: 'Digital Correlation', icon: Smartphone, badge: null, group: 'AI analysis' },
  { key: 'similarity', label: 'Case Similarity', icon: SearchCode, badge: null, group: 'AI analysis' },

  // Review
  { key: 'verification', label: 'Review Queue', icon: ClipboardCheck, badge: null, group: 'Review' },
  { key: 'readiness', label: 'Closure Readiness', icon: Gauge, badge: null, group: 'Review' },
  { key: 'chargesheet', label: 'Chargesheet QA', icon: FileCheck2, badge: null, group: 'Review' },

  // Integrity
  { key: 'audit', label: 'Audit Trail', icon: ScrollText, badge: null, group: 'Integrity' },
  { key: 'settings', label: 'System Integrity', icon: Settings, badge: null, group: 'Integrity' },
]

export const navGroups = ['Case', 'AI analysis', 'Review', 'Integrity'] as const
