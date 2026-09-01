/**
 * Typed API client for the Chain of Truth backend.
 *
 * Distinguishes three outcomes rather than two, because "the backend is not
 * running" and "the backend refused you" need different words on screen:
 *
 *   ok        -> data
 *   error     -> the server answered with a failure (status + message)
 *   offline   -> the server could not be reached at all
 *
 * The existing lib/api.ts swallowed every failure into `null`, which makes a
 * 403 permission denial indistinguishable from a dead server. On a forensic
 * tool that difference matters: one is "you may not see this", the other is
 * "nobody can see anything".
 */

import type {
  AiProviderInfo,
  AnalysisJob,
  Contradiction,
  Decision,
  DecisionResult,
  EvidenceGap,
  ExtractedFact,
  GraphEdge,
  GraphNode,
  GuidanceItem,
  ReadinessReport,
  ReviewQueueItem,
  TimelineEvent,
  VerificationRecord,
} from '@/lib/types'

export const API_BASE =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) ||
  'http://localhost:8000'

const PREFIX = '/api/v1'

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly detail?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }

  /** True when the officer is authenticated but not permitted. */
  get isPermissionDenied() {
    return this.status === 403
  }

  get isNotFound() {
    return this.status === 404
  }
}

/** The server was unreachable — distinct from the server saying no. */
export class OfflineError extends Error {
  constructor(readonly cause?: unknown) {
    super('Backend unreachable')
    this.name = 'OfflineError'
  }
}

function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return { 'X-Officer-Id': '1' }
  try {
    const raw = window.localStorage.getItem('cot_session')
    if (raw) {
      const s = JSON.parse(raw) as { officerId?: string; badgeNumber?: string }
      if (s.badgeNumber) return { 'X-Badge-Number': s.badgeNumber }
      if (s.officerId) return { 'X-Officer-Id': s.officerId }
    }
  } catch {
    /* corrupted session -> fall through to the demo default */
  }
  return { 'X-Officer-Id': window.localStorage.getItem('cot_officer_id') || '1' }
}

async function request<T>(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const { json, ...rest } = init ?? {}
  let response: Response

  try {
    response = await fetch(`${API_BASE}${PREFIX}${path}`, {
      ...rest,
      headers: {
        Accept: 'application/json',
        ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...authHeaders(),
        ...(rest.headers as Record<string, string> | undefined),
      },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
      cache: 'no-store',
    })
  } catch (cause) {
    throw new OfflineError(cause)
  }

  if (!response.ok) {
    let detail: unknown
    let message = `Request failed (${response.status})`
    try {
      detail = await response.json()
      const d = (detail as { detail?: unknown })?.detail
      if (typeof d === 'string') message = d
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(message, response.status, detail)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

/* ---------------------------------------------------------------- endpoints */

export const api = {
  health: () =>
    fetch(`${API_BASE}/health`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new ApiError('unhealthy', r.status))))
      .catch((e) => {
        throw e instanceof ApiError ? e : new OfflineError(e)
      }),

  cases: () => request<unknown[]>('/cases'),
  case: (ref: string) => request<Record<string, unknown>>(`/cases/${ref}`),

  evidence: (caseRef: string) =>
    request<unknown[]>(`/cases/${caseRef}/evidence`),

  logTextEvidence: (
    caseRef: string,
    body: {
      evidence_type: string
      title: string
      text_content: string
      occurred_at?: string
      description?: string
    },
  ) => request<{ uid: string }>(`/cases/${caseRef}/evidence/text`, {
    method: 'POST',
    json: body,
  }),

  analyze: (caseRef: string, evidenceRef: string) =>
    request<{
      job: AnalysisJob
      ai_provider: AiProviderInfo
      retrieval: { backend: string; embedding: { provider: string } }
    }>(`/cases/${caseRef}/evidence/${evidenceRef}/analyze`, { method: 'POST' }),

  job: (uid: string) => request<AnalysisJob>(`/jobs/${uid}`),

  facts: (caseRef: string, status?: string) =>
    request<{ facts: ExtractedFact[]; count: number; ai_provider: AiProviderInfo }>(
      `/cases/${caseRef}/facts${status ? `?status=${encodeURIComponent(status)}` : ''}`,
    ),

  contradictions: (caseRef: string) =>
    request<{
      contradictions: Contradiction[]
      count: number
      ai_provider: AiProviderInfo
    }>(`/cases/${caseRef}/contradictions`),

  timeline: (caseRef: string, status?: string) =>
    request<{
      events: TimelineEvent[]
      count: number
      verified_count: number
      unverified_count: number
    }>(`/cases/${caseRef}/timeline${status ? `?status=${encodeURIComponent(status)}` : ''}`),

  graph: (caseRef: string, nodeTypes?: string) =>
    request<{ nodes: GraphNode[]; edges: GraphEdge[] }>(
      `/cases/${caseRef}/graph${nodeTypes ? `?node_types=${encodeURIComponent(nodeTypes)}` : ''}`,
    ),

  guidance: (caseRef: string) =>
    request<{
      items: GuidanceItem[]
      count: number
      framing: string
      ai_provider: AiProviderInfo
    }>(`/cases/${caseRef}/guidance-items`),

  gaps: (caseRef: string) =>
    request<{ gaps: EvidenceGap[]; count: number }>(`/cases/${caseRef}/gaps`),

  reviewQueue: (caseRef: string) =>
    request<{ items: ReviewQueueItem[]; count: number; ai_provider: AiProviderInfo }>(
      `/cases/${caseRef}/review-queue`,
    ),

  verificationHistory: (caseRef: string) =>
    request<{ history: VerificationRecord[]; count: number }>(
      `/cases/${caseRef}/verification-history`,
    ),

  readiness: (caseRef: string) =>
    request<ReadinessReport>(`/cases/${caseRef}/readiness`),

  /** The human gate. The only way anything becomes verified. */
  verify: (
    caseRef: string,
    targetType: string,
    targetRef: string,
    decision: Decision,
    reason?: string,
  ) =>
    request<DecisionResult>(
      `/cases/${caseRef}/verify/${targetType}/${targetRef}`,
      { method: 'POST', json: { decision, reason } },
    ),

  ledger: (caseRef: string) => request<unknown[]>(`/cases/${caseRef}/ledger`),
  ledgerVerify: (caseRef: string) =>
    request<Record<string, unknown>>(`/cases/${caseRef}/ledger/verify`),

  audit: (params?: { case_id?: number; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.case_id) q.set('case_id', String(params.case_id))
    if (params?.limit) q.set('limit', String(params.limit))
    const qs = q.toString()
    return request<unknown[]>(`/audit${qs ? `?${qs}` : ''}`)
  },

  legalKb: () =>
    fetch(`${API_BASE}${PREFIX}/legal-kb`, { cache: 'no-store' }).then((r) => r.json()),

  /**
   * Escape hatch for endpoints whose response shape is page-local.
   *
   * Still goes through `request`, so auth, offline detection and error typing
   * are identical to the named methods — it only skips defining a shared type
   * for a shape used by exactly one page.
   */
  raw: <T>(path: string) => request<T>(path),
}

/** Human-readable message for any thrown error, safe to render. */
export function describeError(error: unknown): {
  kind: 'offline' | 'denied' | 'notfound' | 'error'
  message: string
} {
  if (error instanceof OfflineError) {
    return {
      kind: 'offline',
      message:
        'Cannot reach the backend. Start it with: uvicorn app.main:app --reload --port 8000',
    }
  }
  if (error instanceof ApiError) {
    if (error.isPermissionDenied) return { kind: 'denied', message: error.message }
    if (error.isNotFound) return { kind: 'notfound', message: error.message }
    return { kind: 'error', message: error.message }
  }
  return { kind: 'error', message: error instanceof Error ? error.message : String(error) }
}
