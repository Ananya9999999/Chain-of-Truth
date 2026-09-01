/**
 * Domain types mirroring the backend contract.
 *
 * VerificationStatus is the single vocabulary shared by the API, the database
 * and the UI. It is a union rather than a loose string so a typo in a status
 * check fails at compile time instead of silently rendering an evidence item as
 * unverified when it is not (or, far worse, the reverse).
 */

export type VerificationStatus =
  | 'VERIFIED'
  | 'AI_EXTRACTED_UNVERIFIED'
  | 'AI_HYPOTHESIS'
  | 'HUMAN_CONFIRMED'
  | 'DISMISSED'
  | 'REQUIRES_REVIEW'

export type Severity = 'MINOR' | 'MAJOR' | 'CRITICAL' | 'REVIEW'

export type Decision = 'CONFIRM' | 'DISMISS' | 'REQUEST_REVIEW'

export type OfficerRole =
  | 'INVESTIGATING_OFFICER'
  | 'SUPERVISOR'
  | 'FORENSIC_REVIEWER'
  | 'LEGAL_REVIEWER'

/** Which engine produced a finding. Never render AI output without this. */
export interface AiProviderInfo {
  provider: string
  model: string | null
  is_live_inference: boolean
  disclaimer: string
}

export interface ExtractedFact {
  uid: string
  evidence_id: number
  fact_type: string
  value: string
  source_excerpt: string
  source_offset_start: number | null
  source_offset_end: number | null
  confidence: number
  explanation: string
  status: VerificationStatus
  language: string
  created_at: string
}

export interface ContradictionSource {
  side: 'A' | 'B'
  evidence_id: number
  excerpt: string
  claimed_value: string | null
  claimed_at: string | null
}

export interface Contradiction {
  uid: string
  title: string
  description: string
  contradiction_type: string
  severity: Severity
  confidence: number
  explanation: string
  status: VerificationStatus
  resolved_by_id: number | null
  resolved_at: string | null
  resolution_note: string | null
  created_at: string
  sources: ContradictionSource[]
}

export interface TimelineEvent {
  uid: string
  title: string
  description: string | null
  event_type: string
  occurred_at: string | null
  occurred_at_precision: string
  recorded_at: string
  evidence_id: number | null
  verification_status: VerificationStatus
  confidence: number | null
  lat: number | null
  lon: number | null
}

export interface GraphNode {
  id: number
  key: string
  type: string
  subtype: string | null
  label: string
  evidence_id: number | null
  verification_status: VerificationStatus
  attributes: Record<string, unknown> | null
}

export interface GraphEdge {
  id: number
  source: number
  target: number
  type: string
  weight: number
  evidence_id: number | null
  verification_status: VerificationStatus
  explanation: string | null
}

export interface GuidanceItem {
  uid: string
  title: string
  recommendation: string
  rationale: string
  category: string
  priority: string
  legal_ref: string | null
  legal_title: string | null
  legal_text: string | null
  confidence: number
  status: string
}

export interface EvidenceGap {
  uid: string
  title: string
  description: string
  gap_type: string
  severity: Severity
  suggested_action: string | null
  legal_ref: string | null
  status: string
}

export interface ReviewQueueItem {
  target_type: string
  uid: string
  title: string
  summary: string
  severity: Severity
  confidence: number
  explanation: string
  status: VerificationStatus
  disclaimer?: string
  requires_role?: string[]
  created_at: string
}

export interface ReadinessFactor {
  key: string
  label: string
  weight: number
  value: number
  detail: string
  outstanding: number
  blocking: boolean
}

export interface ReadinessReport {
  score: number
  percent: number
  band: string
  factors: ReadinessFactor[]
  blockers: string[]
  counts: Record<string, number>
  disclaimer: string
  method: string
}

export interface VerificationRecord {
  target_type: string
  target_uid: string | null
  decision: Decision
  reason: string | null
  decided_by_id: number
  decided_by_role: string
  decided_at: string
  ai_state_snapshot: Record<string, unknown> | null
}

export interface DecisionResult {
  target_type: string
  target_uid: string | null
  previous_status: VerificationStatus
  new_status: VerificationStatus
  decision: Decision
  decided_by: string
  decided_at: string
  note: string
}

export interface AnalysisJob {
  uid: string
  status: 'QUEUED' | 'RUNNING' | 'COMPLETE' | 'FAILED'
  stage: string | null
  progress: number
  provider: string
  model: string | null
  error: string | null
  started_at?: string
  finished_at?: string | null
}
