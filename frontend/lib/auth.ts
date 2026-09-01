export type OfficerSession = {
  officerId: string
  badgeNumber: string
  fullName: string
  role: string
  initials: string
}

const KEY = 'cot_session'

export const DEMO_OFFICERS: OfficerSession[] = [
  {
    officerId: '1',
    badgeNumber: 'KA-1001',
    fullName: 'Insp. Anita Rao',
    role: 'Investigating Officer',
    initials: 'AR',
  },
  {
    officerId: '2',
    badgeNumber: 'KA-1002',
    fullName: 'SI Bhaskar Nair',
    role: 'Supervisor',
    initials: 'BN',
  },
  {
    officerId: '3',
    badgeNumber: 'KA-2007',
    fullName: 'Dr. Meera Iyer',
    role: 'Forensic Reviewer',
    initials: 'MI',
  },
  {
    officerId: '4',
    badgeNumber: 'KA-3011',
    fullName: 'APP Ravi Shankar',
    role: 'Legal Reviewer',
    initials: 'RS',
  },
]

export function getSession(): OfficerSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as OfficerSession
  } catch {
    return null
  }
}

export function setSession(session: OfficerSession) {
  localStorage.setItem(KEY, JSON.stringify(session))
  localStorage.setItem('cot_officer_id', session.officerId)
  localStorage.setItem('cot_badge_number', session.badgeNumber)
}

export function clearSession() {
  localStorage.removeItem(KEY)
  localStorage.removeItem('cot_officer_id')
  localStorage.removeItem('cot_badge_number')
}

export function isAuthenticated(): boolean {
  return getSession() !== null
}
