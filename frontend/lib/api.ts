/**
 * API client for Chain of Truth backend (/api/v1).
 * Falls back gracefully when backend is offline (UI still works on mock data).
 */

const API_BASE =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) ||
  'http://localhost:8000'

export function getOfficerHeaders(): HeadersInit {
  if (typeof window === 'undefined') {
    return { 'X-Officer-Id': '1' }
  }
  try {
    const raw = localStorage.getItem('cot_session')
    if (raw) {
      const s = JSON.parse(raw) as {
        officerId?: string
        badgeNumber?: string
      }
      if (s.badgeNumber) return { 'X-Badge-Number': s.badgeNumber }
      if (s.officerId) return { 'X-Officer-Id': s.officerId }
    }
  } catch {
    /* ignore */
  }
  const id = localStorage.getItem('cot_officer_id') || '1'
  const badge = localStorage.getItem('cot_badge_number')
  if (badge) return { 'X-Badge-Number': badge }
  return { 'X-Officer-Id': id }
}

export async function apiGet<T = unknown>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { ...getOfficerHeaders(), Accept: 'application/json' },
      cache: 'no-store',
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export async function apiPost<T = unknown>(
  path: string,
  body?: unknown,
): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: {
        ...getOfficerHeaders(),
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export const endpoints = {
  health: () => apiGet<{ status: string }>('/health'),
  guidance: (caseId: number) => apiGet(`/api/v1/cases/${caseId}/guidance`),
  autopsy: (caseId: number) =>
    apiGet(`/api/v1/cases/${caseId}/autopsy-analysis`),
  chargesheetQa: (caseId: number, text?: string) =>
    apiPost(`/api/v1/cases/${caseId}/chargesheet-qa`, {
      chargesheet_text: text ?? null,
    }),
  analysis: (caseId: number) => apiGet(`/api/v1/cases/${caseId}/analysis`),
  legalKb: () => apiGet('/api/v1/legal-kb'),
}
