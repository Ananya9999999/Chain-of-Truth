'use client'

/**
 * Case workspace state.
 *
 * Every "Add …" button, filter, toast and notification in the app reads and
 * writes here, so nothing on screen is decorative: adding evidence really does
 * bump the counters on the Command Center, really does appear in the Evidence
 * Vault, and really does raise a notification.
 *
 * State is in-memory and seeded from `lib/mock-data`. That is deliberate and
 * declared in the UI: this is a demo workspace, not a fabricated backend. No
 * component here pretends to call a server — the real API client lives in
 * `lib/api/client.ts` and is used by the pages that talk to FastAPI.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react'

import {
  aiFlags as seedFlags,
  auditTrail as seedAudit,
  caseMeta as seedCase,
  evidenceItems as seedEvidence,
  timelineEvents as seedTimeline,
  type AiFlag,
  type AuditEntry,
  type Evidence,
  type TimelineEvent,
} from '@/lib/mock-data'

/* ------------------------------------------------------------------ types */

/** The spec restricts new evidence capture to these two types. */
export const EVIDENCE_TYPES = ['CCTV Footage', 'Photograph'] as const
export type EvidenceType = (typeof EVIDENCE_TYPES)[number]

export interface Statement {
  id: string
  witness: string
  text: string
  date: string
  time: string
  location: string
  officer: string
  status: 'verified' | 'unverified' | 'ai-extracted'
  /** Character ranges flagged as conflicting with other evidence. */
  conflicts?: { start: number; end: number; note: string; evidenceRef: string }[]
}

export interface CaseRecord {
  id: string
  title: string
  description: string
  officer: string
  status: string
  date: string
}

export interface Officer {
  id: string
  name: string
  officerId: string
  role: string
  email: string
  permission: 'read' | 'write' | 'admin'
}

export interface Notification {
  id: string
  kind: 'evidence' | 'ai' | 'review' | 'verified' | 'statement'
  title: string
  detail: string
  time: string
  read: boolean
}

export interface Toast {
  id: string
  message: string
  tone: 'success' | 'error' | 'info'
}

/** A finding on the forensic body diagram. Observation, never diagnosis. */
export interface BodyObservation {
  region: string
  label: string
  observation: string
  timestamp: string
  evidenceRef: string
  confidence: number
  status: 'AI_HYPOTHESIS' | 'REQUIRES_REVIEW' | 'HUMAN_CONFIRMED'
}

/* ------------------------------------------------------------------ seeds */

const SEED_STATEMENTS: Statement[] = [
  {
    id: 'STM-0041',
    witness: 'R. Kumar',
    text:
      'I was closing my shop for the night. I saw the man leave at about 9:00 PM. ' +
      'He walked normally towards the main road. I did not see anyone with him.',
    date: '2026-08-30',
    time: '09:15',
    location: 'Riverside Lot B',
    officer: 'Det. A. Mreyen',
    status: 'verified',
    conflicts: [
      {
        start: 44,
        end: 62,
        note: 'CCTV metadata records the subject exiting at 21:47 — a 47-minute discrepancy.',
        evidenceRef: 'EVD-0091',
      },
    ],
  },
  {
    id: 'STM-0042',
    witness: 'R. Kumar',
    text:
      'I was closing my shop for the night. I saw the man leave at around 9:45 PM, maybe later. ' +
      'He was walking quickly towards the main road. There was another person with him.',
    date: '2026-09-01',
    time: '11:40',
    location: 'Central Precinct',
    officer: 'Det. A. Mreyen',
    status: 'unverified',
    conflicts: [
      {
        start: 148,
        end: 182,
        note: 'A companion is mentioned here but was absent from the first account.',
        evidenceRef: 'STM-0041',
      },
    ],
  },
]

const SEED_CASES: CaseRecord[] = [
  {
    id: seedCase.id,
    title: seedCase.title,
    description:
      'Vehicle reported stolen from Riverside Lot B on 29 Aug 2026. CCTV and witness accounts disagree on the departure time.',
    officer: seedCase.officer,
    status: seedCase.status,
    date: '2026-08-29',
  },
  {
    id: 'CT-2026-009',
    title: 'Warehouse Break-In',
    description: 'Forced entry reported at an industrial unit on Route 9.',
    officer: 'Ofc. D. Nkusi',
    status: 'Pending Review',
    date: '2026-07-14',
  },
]

const SEED_OFFICERS: Officer[] = [
  { id: 'u1', name: 'Det. A. Mreyen', officerId: 'KA-1001', role: 'Investigating Officer', email: 'a.mreyen@example.gov', permission: 'write' },
  { id: 'u2', name: 'SI B. Nair', officerId: 'KA-1002', role: 'Supervisor', email: 'b.nair@example.gov', permission: 'admin' },
  { id: 'u3', name: 'Dr. M. Iyer', officerId: 'KA-2007', role: 'Forensic Reviewer', email: 'm.iyer@example.gov', permission: 'read' },
]

const SEED_NOTIFICATIONS: Notification[] = [
  { id: 'n1', kind: 'ai', title: 'Contradiction detected', detail: 'Witness time conflicts with CCTV metadata by 47 minutes.', time: '2 min ago', read: false },
  { id: 'n2', kind: 'review', title: 'Officer review required', detail: 'EVD-0094 awaits two-person confirmation.', time: '18 min ago', read: false },
  { id: 'n3', kind: 'verified', title: 'Evidence verified', detail: 'EVD-0091 passed integrity re-check.', time: '1 hr ago', read: true },
]

/**
 * Observations are bound to named body regions. A region only lights up when an
 * observation references it — the diagram cannot invent anatomy that is not in
 * the case data.
 */
const SEED_BODY: BodyObservation[] = [
  { region: 'head', label: 'Head', observation: 'No external observation recorded in the case file.', timestamp: '—', evidenceRef: '—', confidence: 0, status: 'REQUIRES_REVIEW' },
  { region: 'chest', label: 'Chest', observation: 'Examiner recorded a single penetrating injury to the left thorax.', timestamp: '2026-08-30 11:00', evidenceRef: 'EVD-0096', confidence: 0.91, status: 'HUMAN_CONFIRMED' },
  { region: 'left-arm', label: 'Left arm', observation: 'No observation recorded.', timestamp: '—', evidenceRef: '—', confidence: 0, status: 'REQUIRES_REVIEW' },
  { region: 'right-arm', label: 'Right arm', observation: 'Two superficial incised wounds on the forearm, consistent with a defensive posture.', timestamp: '2026-08-30 11:00', evidenceRef: 'EVD-0096', confidence: 0.66, status: 'AI_HYPOTHESIS' },
  { region: 'abdomen', label: 'Abdomen', observation: 'No observation recorded.', timestamp: '—', evidenceRef: '—', confidence: 0, status: 'REQUIRES_REVIEW' },
  { region: 'left-leg', label: 'Left leg', observation: 'No observation recorded.', timestamp: '—', evidenceRef: '—', confidence: 0, status: 'REQUIRES_REVIEW' },
  { region: 'right-leg', label: 'Right leg', observation: 'Minor abrasion noted; comparison against scene surfaces not yet performed.', timestamp: '2026-08-30 11:20', evidenceRef: 'EVD-0093', confidence: 0.41, status: 'AI_HYPOTHESIS' },
]

/* ------------------------------------------------------------------ store */

interface State {
  evidence: Evidence[]
  statements: Statement[]
  cases: CaseRecord[]
  activeCaseId: string
  officers: Officer[]
  flags: AiFlag[]
  audit: AuditEntry[]
  timeline: TimelineEvent[]
  notifications: Notification[]
  body: BodyObservation[]
  /** Flag id -> the state before the last action, so UNDO is real. */
  flagHistory: Record<string, AiFlag['response']>
}

type Action =
  | { type: 'ADD_EVIDENCE'; payload: Evidence }
  | { type: 'VERIFY_EVIDENCE'; id: string }
  | { type: 'ADD_STATEMENT'; payload: Statement; event: TimelineEvent }
  | { type: 'ADD_CASE'; payload: CaseRecord }
  | { type: 'SET_ACTIVE_CASE'; id: string }
  | { type: 'ADD_OFFICER'; payload: Officer }
  | { type: 'SET_FLAG'; id: string; response: AiFlag['response'] }
  | { type: 'UNDO_FLAG'; id: string }
  | { type: 'ADD_AUDIT'; payload: AuditEntry }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'READ_NOTIFICATION'; id: string }
  | { type: 'READ_ALL_NOTIFICATIONS' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_EVIDENCE':
      return { ...state, evidence: [action.payload, ...state.evidence] }

    case 'VERIFY_EVIDENCE':
      return {
        ...state,
        evidence: state.evidence.map((e) =>
          e.id === action.id
            ? { ...e, status: 'verified', twoPersonConfirmed: true }
            : e,
        ),
      }

    case 'ADD_STATEMENT':
      return {
        ...state,
        statements: [...state.statements, action.payload],
        timeline: [...state.timeline, action.event],
      }

    case 'ADD_CASE':
      return { ...state, cases: [action.payload, ...state.cases] }

    case 'SET_ACTIVE_CASE':
      return { ...state, activeCaseId: action.id }

    case 'ADD_OFFICER':
      return { ...state, officers: [...state.officers, action.payload] }

    case 'SET_FLAG': {
      const previous = state.flags.find((f) => f.id === action.id)?.response
      return {
        ...state,
        flags: state.flags.map((f) =>
          f.id === action.id ? { ...f, response: action.response } : f,
        ),
        // Remember the prior value so UNDO restores rather than guesses.
        flagHistory: { ...state.flagHistory, [action.id]: previous ?? 'pending' },
      }
    }

    case 'UNDO_FLAG': {
      const previous = state.flagHistory[action.id]
      if (previous === undefined) return state
      const { [action.id]: _dropped, ...rest } = state.flagHistory
      return {
        ...state,
        flags: state.flags.map((f) =>
          f.id === action.id ? { ...f, response: previous } : f,
        ),
        flagHistory: rest,
      }
    }

    case 'ADD_AUDIT':
      return { ...state, audit: [action.payload, ...state.audit] }

    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [action.payload, ...state.notifications] }

    case 'READ_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.id ? { ...n, read: true } : n,
        ),
      }

    case 'READ_ALL_NOTIFICATIONS':
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      }

    default:
      return state
  }
}

const initialState: State = {
  evidence: seedEvidence,
  statements: SEED_STATEMENTS,
  cases: SEED_CASES,
  activeCaseId: seedCase.id,
  officers: SEED_OFFICERS,
  flags: seedFlags,
  audit: seedAudit,
  timeline: seedTimeline,
  notifications: SEED_NOTIFICATIONS,
  body: SEED_BODY,
  flagHistory: {},
}

interface StoreValue extends State {
  activeCase: CaseRecord
  stats: {
    total: number
    verified: number
    unverified: number
    twoPerson: number
    openFlags: number
    unread: number
  }
  toasts: Toast[]
  toast: (message: string, tone?: Toast['tone']) => void
  dismissToast: (id: string) => void
  addEvidence: (input: Omit<Evidence, 'hash' | 'status' | 'twoPersonConfirmed'>) => void
  verifyEvidence: (id: string) => void
  addStatement: (input: Omit<Statement, 'status'>) => void
  addCase: (input: CaseRecord) => void
  setActiveCase: (id: string) => void
  addOfficer: (input: Omit<Officer, 'id'>) => void
  respondToFlag: (id: string, response: AiFlag['response']) => void
  undoFlag: (id: string) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
}

const StoreContext = createContext<StoreValue | null>(null)

/** Deterministic pseudo-hash for demo records. Not a real SHA-256. */
function demoHash(seed: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  const hex = h.toString(16).padStart(8, '0')
  return `${hex.slice(0, 4)}…${hex.slice(4, 8)}`
}

function nowStamp() {
  const d = new Date()
  const mon = d.toLocaleString('en', { month: 'short' })
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${mon} ${d.getDate()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, tone: Toast['tone'] = 'success') => {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setToasts((prev) => [...prev, { id, message, tone }])
    window.setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      4000,
    )
  }, [])

  const dismissToast = useCallback(
    (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id)),
    [],
  )

  const pushAudit = useCallback((action: string, item: string, actor = 'Det. A. Mreyen') => {
    const d = new Date()
    dispatch({
      type: 'ADD_AUDIT',
      payload: {
        id: `aud-${Date.now()}`,
        actor,
        role: 'Investigating Officer',
        action,
        item,
        time: d.toTimeString().slice(0, 5),
        date: d.toISOString().slice(0, 10),
        result: 'success',
      },
    })
  }, [])

  const notify = useCallback(
    (kind: Notification['kind'], title: string, detail: string) => {
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: `n-${Date.now()}`,
          kind,
          title,
          detail,
          time: 'just now',
          read: false,
        },
      })
    },
    [],
  )

  const addEvidence = useCallback<StoreValue['addEvidence']>(
    (input) => {
      const record: Evidence = {
        ...input,
        hash: demoHash(input.id + input.filename),
        status: 'unverified',
        twoPersonConfirmed: false,
      }
      dispatch({ type: 'ADD_EVIDENCE', payload: record })
      pushAudit('EVIDENCE_UPLOAD', record.id)
      notify('evidence', 'New evidence added', `${record.id} · ${record.type}`)
      toast(`Evidence ${record.id} added successfully`)
    },
    [notify, pushAudit, toast],
  )

  const verifyEvidence = useCallback(
    (id: string) => {
      dispatch({ type: 'VERIFY_EVIDENCE', id })
      pushAudit('EVIDENCE_VERIFIED', id)
      notify('verified', 'Evidence verified', `${id} confirmed by a second officer.`)
      toast(`${id} verified`)
    },
    [notify, pushAudit, toast],
  )

  const addStatement = useCallback<StoreValue['addStatement']>(
    (input) => {
      const statement: Statement = { ...input, status: 'unverified' }
      dispatch({
        type: 'ADD_STATEMENT',
        payload: statement,
        event: {
          id: `tl-${Date.now()}`,
          time: input.time,
          date: input.date,
          title: `Statement recorded — ${input.witness}`,
          description: input.text.slice(0, 120),
          type: 'witness',
          status: 'unverified',
          source: input.id,
        },
      })
      pushAudit('STATEMENT_RECORDED', statement.id)
      notify('statement', 'Statement updated', `${statement.id} from ${statement.witness}`)
      toast('Statement added successfully')
    },
    [notify, pushAudit, toast],
  )

  const addCase = useCallback<StoreValue['addCase']>(
    (input) => {
      dispatch({ type: 'ADD_CASE', payload: input })
      pushAudit('CASE_CREATED', input.id)
      toast(`Case ${input.id} created`)
    },
    [pushAudit, toast],
  )

  const setActiveCase = useCallback(
    (id: string) => {
      dispatch({ type: 'SET_ACTIVE_CASE', id })
      toast(`Switched to ${id}`, 'info')
    },
    [toast],
  )

  const addOfficer = useCallback<StoreValue['addOfficer']>(
    (input) => {
      dispatch({ type: 'ADD_OFFICER', payload: { ...input, id: `u-${Date.now()}` } })
      pushAudit('USER_ADDED', input.officerId)
      toast(`${input.name} added`)
    },
    [pushAudit, toast],
  )

  const respondToFlag = useCallback(
    (id: string, response: AiFlag['response']) => {
      dispatch({ type: 'SET_FLAG', id, response })
      pushAudit(response === 'confirmed' ? 'AI_FLAG_CONFIRMED' : 'AI_FLAG_DISMISSED', id)
      toast(response === 'confirmed' ? 'Contradiction confirmed' : 'Finding dismissed')
    },
    [pushAudit, toast],
  )

  const undoFlag = useCallback(
    (id: string) => {
      dispatch({ type: 'UNDO_FLAG', id })
      pushAudit('AI_FLAG_UNDO', id)
      toast('Decision reverted', 'info')
    },
    [pushAudit, toast],
  )

  const markNotificationRead = useCallback(
    (id: string) => dispatch({ type: 'READ_NOTIFICATION', id }),
    [],
  )

  const markAllNotificationsRead = useCallback(
    () => dispatch({ type: 'READ_ALL_NOTIFICATIONS' }),
    [],
  )

  const value = useMemo<StoreValue>(() => {
    const activeCase =
      state.cases.find((c) => c.id === state.activeCaseId) ?? state.cases[0]
    return {
      ...state,
      activeCase,
      stats: {
        total: state.evidence.length,
        verified: state.evidence.filter((e) => e.status === 'verified').length,
        unverified: state.evidence.filter((e) => e.status !== 'verified').length,
        twoPerson: state.evidence.filter((e) => e.twoPersonConfirmed).length,
        openFlags: state.flags.filter((f) => f.response === 'pending').length,
        unread: state.notifications.filter((n) => !n.read).length,
      },
      toasts,
      toast,
      dismissToast,
      addEvidence,
      verifyEvidence,
      addStatement,
      addCase,
      setActiveCase,
      addOfficer,
      respondToFlag,
      undoFlag,
      markNotificationRead,
      markAllNotificationsRead,
    }
  }, [
    state, toasts, toast, dismissToast, addEvidence, verifyEvidence,
    addStatement, addCase, setActiveCase, addOfficer, respondToFlag, undoFlag,
    markNotificationRead, markAllNotificationsRead,
  ])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}

export { nowStamp, demoHash }
