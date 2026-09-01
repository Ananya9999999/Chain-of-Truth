export type VerificationStatus = 'verified' | 'unverified' | 'ai-extracted'

export type TimelineEvent = {
  id: string
  time: string
  date: string
  title: string
  description: string
  type: 'evidence' | 'witness' | 'cctv' | 'location' | 'ai'
  status: VerificationStatus
  source: string
  confidence?: number
}

export const caseMeta = {
  id: 'CT-2026-014',
  title: 'Vehicle Theft Investigation',
  status: 'Investigation Active',
  lastUpdated: 'Aug 31, 2026 · 14:32',
  officer: 'Det. A. Mreyen',
  role: 'Investigating Officer',
  evidenceCount: 18,
  verifiedCount: 11,
  unverifiedFindings: 6,
}

export const timelineEvents: TimelineEvent[] = [
  {
    id: 'ev-1',
    date: 'Aug 29',
    time: '20:41',
    title: 'Vehicle reported stolen',
    description:
      'Owner filed report for a 2023 grey sedan, plate KX-8842, parked at Riverside Lot B.',
    type: 'evidence',
    status: 'verified',
    source: 'Incident Report #IR-4471 · Officer intake',
  },
  {
    id: 'ev-2',
    date: 'Aug 29',
    time: '21:05',
    title: 'Witness statement recorded',
    description:
      'Witness states the suspect left the location at 9:00 PM heading north on Mill Street.',
    type: 'witness',
    status: 'verified',
    source: 'Statement #WS-201 · Witness: J. Halloran',
  },
  {
    id: 'ev-3',
    date: 'Aug 29',
    time: '21:25',
    title: 'Subject appears on CCTV',
    description:
      'CCTV frame shows a subject matching the description at Riverside Lot B entrance.',
    type: 'cctv',
    status: 'verified',
    source: 'Camera RVS-04 · Municipal CCTV feed',
  },
  {
    id: 'ev-4',
    date: 'Aug 29',
    time: '21:26',
    title: 'Departure time inconsistency',
    description:
      'Extracted departure time (9:00 PM) does not align with CCTV presence (9:25 PM).',
    type: 'ai',
    status: 'ai-extracted',
    source: 'Derived from WS-201 + Camera RVS-04',
    confidence: 91,
  },
  {
    id: 'ev-5',
    date: 'Aug 30',
    time: '08:12',
    title: 'Plate recognition ping',
    description:
      'Automated plate reader flagged KX-8842 travelling east on Route 9 corridor.',
    type: 'location',
    status: 'verified',
    source: 'ANPR Gateway G-12',
  },
  {
    id: 'ev-6',
    date: 'Aug 30',
    time: '08:20',
    title: 'Possible route hypothesis',
    description:
      'Model suggests the vehicle may be heading toward the eastern industrial district.',
    type: 'ai',
    status: 'ai-extracted',
    source: 'Route heuristic · ANPR G-12 + G-15',
    confidence: 64,
  },
]

export type Evidence = {
  id: string
  type: string
  filename: string
  timestamp: string
  location: string
  uploadedBy: string
  status: VerificationStatus
  hash: string
  twoPersonConfirmed: boolean
}

export const evidenceItems: Evidence[] = [
  {
    id: 'EVD-0091',
    type: 'CCTV Footage',
    filename: 'rvs04_2029-0841.mp4',
    timestamp: 'Aug 29 · 21:25',
    location: 'Riverside Lot B',
    uploadedBy: 'Ofc. D. Nkusi',
    status: 'verified',
    hash: '9f2c…a71e',
    twoPersonConfirmed: true,
  },
  {
    id: 'EVD-0092',
    type: 'Witness Statement',
    filename: 'statement_ws201.pdf',
    timestamp: 'Aug 29 · 21:05',
    location: 'Central Precinct',
    uploadedBy: 'Det. A. Mreyen',
    status: 'verified',
    hash: '3b8d…c204',
    twoPersonConfirmed: true,
  },
  {
    id: 'EVD-0093',
    type: 'ANPR Record',
    filename: 'anpr_g12_export.csv',
    timestamp: 'Aug 30 · 08:12',
    location: 'Route 9 Gateway',
    uploadedBy: 'System · ANPR',
    status: 'unverified',
    hash: 'e14a…9f00',
    twoPersonConfirmed: false,
  },
  {
    id: 'EVD-0094',
    type: 'Photograph',
    filename: 'scene_lotB_003.jpg',
    timestamp: 'Aug 29 · 22:10',
    location: 'Riverside Lot B',
    uploadedBy: 'Ofc. D. Nkusi',
    status: 'unverified',
    hash: '77c1…be3d',
    twoPersonConfirmed: false,
  },
  {
    id: 'EVD-0095',
    type: 'CCTV Footage',
    filename: 'route9_g15_0820.mp4',
    timestamp: 'Aug 30 · 08:20',
    location: 'Route 9 Gateway',
    uploadedBy: 'System · ANPR',
    status: 'unverified',
    hash: 'a90f…12cd',
    twoPersonConfirmed: false,
  },
  {
    id: 'EVD-0096',
    type: 'Witness Statement',
    filename: 'statement_ws202.pdf',
    timestamp: 'Aug 30 · 09:45',
    location: 'Central Precinct',
    uploadedBy: 'Det. A. Mreyen',
    status: 'verified',
    hash: 'c3e7…5b18',
    twoPersonConfirmed: true,
  },
  {
    id: 'EVD-0097',
    type: 'Forensic Report',
    filename: 'prints_lotB_lab.pdf',
    timestamp: 'Aug 31 · 11:02',
    location: 'Forensics Lab',
    uploadedBy: 'Lab Tech M. Sato',
    status: 'verified',
    hash: 'd51b…88af',
    twoPersonConfirmed: true,
  },
  {
    id: 'EVD-0098',
    type: 'Photograph',
    filename: 'plate_kx8842_close.jpg',
    timestamp: 'Aug 30 · 08:14',
    location: 'Route 9 Gateway',
    uploadedBy: 'System · ANPR',
    status: 'unverified',
    hash: '2f6a…7c30',
    twoPersonConfirmed: false,
  },
]

export type AiFlag = {
  id: string
  title: string
  severity: 'high' | 'medium' | 'low'
  confidence: number
  explanation: string
  sources: string[]
  response: 'pending' | 'confirmed' | 'dismissed'
}

export const aiFlags: AiFlag[] = [
  {
    id: 'CF-07',
    title: 'Departure time contradicts CCTV presence',
    severity: 'high',
    confidence: 91,
    explanation:
      'Witness statement WS-201 reports the subject left at 9:00 PM, but Camera RVS-04 places the subject at the scene at 9:25 PM — a 25-minute discrepancy.',
    sources: ['Statement WS-201', 'Camera RVS-04'],
    response: 'pending',
  },
  {
    id: 'CF-08',
    title: 'Vehicle route hypothesis toward industrial district',
    severity: 'medium',
    confidence: 64,
    explanation:
      'Sequential ANPR pings at gateways G-12 and G-15 suggest an eastbound trajectory consistent with the eastern industrial district. Not yet corroborated by physical evidence.',
    sources: ['ANPR G-12', 'ANPR G-15'],
    response: 'pending',
  },
  {
    id: 'CF-09',
    title: 'Possible duplicate witness identity',
    severity: 'low',
    confidence: 48,
    explanation:
      'Contact details in statements WS-201 and WS-202 share a partial phone match. May indicate the same individual under two records, or a transcription error.',
    sources: ['Statement WS-201', 'Statement WS-202'],
    response: 'pending',
  },
  {
    id: 'CF-10',
    title: 'Plate reader confidence below threshold',
    severity: 'medium',
    confidence: 72,
    explanation:
      'ANPR read for plate KX-8842 at G-15 returned an optical confidence of 72%, under the 80% verification threshold. Manual frame review recommended before use.',
    sources: ['ANPR G-15', 'plate_kx8842_close.jpg'],
    response: 'pending',
  },
]

export type SearchLocation = {
  id: string
  name: string
  priority: number
  factors: { recency: number; reliability: number; points: number }
  // grid position 0-100
  x: number
  y: number
}

export const searchLocations: SearchLocation[] = [
  {
    id: 'loc-1',
    name: 'Eastern Industrial District',
    priority: 88,
    factors: { recency: 92, reliability: 74, points: 3 },
    x: 72,
    y: 34,
  },
  {
    id: 'loc-2',
    name: 'Route 9 Corridor',
    priority: 71,
    factors: { recency: 80, reliability: 82, points: 2 },
    x: 54,
    y: 58,
  },
  {
    id: 'loc-3',
    name: 'Riverside Lot B',
    priority: 46,
    factors: { recency: 40, reliability: 95, points: 4 },
    x: 26,
    y: 44,
  },
  {
    id: 'loc-4',
    name: 'Mill Street North',
    priority: 33,
    factors: { recency: 35, reliability: 60, points: 1 },
    x: 38,
    y: 22,
  },
]

export type AuditEntry = {
  id: string
  actor: string
  role: string
  action: string
  item: string
  time: string
  date: string
  result: 'success' | 'denied' | 'info'
}

export const auditTrail: AuditEntry[] = [
  {
    id: 'a1',
    actor: 'Det. A. Mreyen',
    role: 'Investigating Officer',
    action: 'Viewed witness statement',
    item: 'WS-201',
    time: '14:31',
    date: 'Aug 31',
    result: 'success',
  },
  {
    id: 'a2',
    actor: 'Supt. L. Owens',
    role: 'Supervisor',
    action: 'Reviewed contradiction flag',
    item: 'CF-07',
    time: '13:58',
    date: 'Aug 31',
    result: 'success',
  },
  {
    id: 'a3',
    actor: 'Ofc. D. Nkusi',
    role: 'Field Officer',
    action: 'Uploaded evidence',
    item: 'EVD-0094',
    time: '13:20',
    date: 'Aug 31',
    result: 'success',
  },
  {
    id: 'a4',
    actor: 'System',
    role: 'AI Analysis Layer',
    action: 'Generated hypothesis: route to industrial district',
    item: 'CF-08',
    time: '08:20',
    date: 'Aug 30',
    result: 'info',
  },
  {
    id: 'a5',
    actor: 'J. Reyes',
    role: 'Records Clerk',
    action: 'Attempted access to sealed evidence',
    item: 'EVD-0097',
    time: '10:14',
    date: 'Aug 31',
    result: 'denied',
  },
  {
    id: 'a6',
    actor: 'Lab Tech M. Sato',
    role: 'Forensics',
    action: 'Uploaded forensic report',
    item: 'EVD-0097',
    time: '11:02',
    date: 'Aug 31',
    result: 'success',
  },
  {
    id: 'a7',
    actor: 'Det. A. Mreyen',
    role: 'Investigating Officer',
    action: 'Confirmed two-person verification',
    item: 'EVD-0096',
    time: '09:47',
    date: 'Aug 30',
    result: 'success',
  },
  {
    id: 'a8',
    actor: 'System',
    role: 'Integrity Monitor',
    action: 'Recomputed SHA-256 hash · match',
    item: 'EVD-0091',
    time: '00:00',
    date: 'Aug 31',
    result: 'info',
  },
]
