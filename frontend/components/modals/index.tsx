'use client'

/**
 * The workspace dialogs: add evidence, add statement, add case, add officer,
 * and preview an evidence item.
 *
 * Every one of these writes into the shared store, so submitting genuinely
 * changes counters, lists, the timeline, the audit trail and the notification
 * bell. None of them fakes a network call.
 *
 * Validation runs on submit and reports per field. Required fields are marked
 * in the label as well as enforced in code, so the requirement is visible
 * before the error rather than only after it.
 */

import { useEffect, useMemo, useState } from 'react'
import {
  Camera,
  FileText,
  Image as ImageIcon,
  Loader2,
  Play,
  ShieldCheck,
  Upload,
  Video,
} from 'lucide-react'
import { motion } from 'motion/react'

import { Field, Modal, inputClass } from '@/components/system'
import { StatusBadge } from '@/components/status-badge'
import { EVIDENCE_TYPES, useStore, type EvidenceType } from '@/lib/store'
import type { Evidence } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

type Errors = Record<string, string>

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}
function nowHM() {
  return new Date().toTimeString().slice(0, 5)
}

/* ------------------------------------------------------------ add evidence */

export function AddEvidenceModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { addEvidence, evidence, officers } = useStore()
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Errors>({})

  const nextId = useMemo(() => {
    const numbers = evidence
      .map((e) => Number.parseInt(e.id.replace(/\D/g, ''), 10))
      .filter((n) => !Number.isNaN(n))
    return `EVD-${String(Math.max(0, ...numbers) + 1).padStart(4, '0')}`
  }, [evidence])

  const [form, setForm] = useState({
    id: nextId,
    type: EVIDENCE_TYPES[0] as EvidenceType,
    fileName: '',
    description: '',
    location: '',
    date: todayISO(),
    time: nowHM(),
    uploadedBy: officers[0]?.name ?? '',
  })

  useEffect(() => {
    if (open) {
      setForm((f) => ({ ...f, id: nextId, date: todayISO(), time: nowHM() }))
      setErrors({})
    }
  }, [open, nextId])

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }))

  function validate(): boolean {
    const e: Errors = {}
    if (!form.id.trim()) e.id = 'Evidence ID is required'
    else if (evidence.some((x) => x.id === form.id.trim()))
      e.id = 'That evidence ID already exists in this case'
    if (!form.fileName.trim()) e.fileName = 'Select or name the file'
    if (!form.location.trim()) e.location = 'Location is required'
    if (!form.date) e.date = 'Date is required'
    if (!form.time) e.time = 'Time is required'
    if (!form.uploadedBy.trim()) e.uploadedBy = 'Uploading officer is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!validate()) return
    setSaving(true)
    // Brief pause so the loading state is perceptible; no request is made.
    await new Promise((r) => setTimeout(r, 550))
    const d = new Date(`${form.date}T${form.time}`)
    addEvidence({
      id: form.id.trim(),
      type: form.type,
      filename: form.fileName.trim(),
      timestamp: `${d.toLocaleString('en', { month: 'short' })} ${d.getDate()} · ${form.time}`,
      location: form.location.trim(),
      uploadedBy: form.uploadedBy.trim(),
    })
    setSaving(false)
    setForm((f) => ({ ...f, fileName: '', description: '', location: '' }))
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add evidence"
      description="Logged as UNVERIFIED. A second officer must confirm it before it enters the verified record."
      size="lg"
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Evidence ID" htmlFor="ev-id" required error={errors.id}>
            <input
              id="ev-id"
              className={cn(inputClass, 'font-mono')}
              value={form.id}
              onChange={(e) => set('id', e.target.value)}
            />
          </Field>

          <Field label="Evidence type" htmlFor="ev-type" required>
            <div className="grid grid-cols-2 gap-2">
              {EVIDENCE_TYPES.map((t) => {
                const Icon = t === 'CCTV Footage' ? Video : Camera
                const selected = form.type === t
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set('type', t)}
                    aria-pressed={selected}
                    className={cn(
                      'btn-press flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors',
                      selected
                        ? 'border-primary/60 bg-primary/12 text-primary'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <Icon className="size-3.5" aria-hidden="true" />
                    {t}
                  </button>
                )
              })}
            </div>
          </Field>
        </div>

        <Field
          label="File"
          htmlFor="ev-file"
          required
          error={errors.fileName}
          hint="Held in the browser for this demo — nothing is uploaded to a server."
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <label
              htmlFor="ev-file"
              className="btn-press flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              <Upload className="size-3.5" aria-hidden="true" />
              Choose file
              <input
                id="ev-file"
                type="file"
                className="sr-only"
                accept={form.type === 'CCTV Footage' ? 'video/*' : 'image/*'}
                onChange={(e) => set('fileName', e.target.files?.[0]?.name ?? '')}
              />
            </label>
            <input
              aria-label="File name"
              className={cn(inputClass, 'font-mono flex-1')}
              placeholder={
                form.type === 'CCTV Footage' ? 'cam04_2026-0829.mp4' : 'scene_001.jpg'
              }
              value={form.fileName}
              onChange={(e) => set('fileName', e.target.value)}
            />
          </div>
        </Field>

        <Field label="Description" htmlFor="ev-desc">
          <textarea
            id="ev-desc"
            rows={2}
            className={cn(inputClass, 'resize-none')}
            placeholder="What this item shows and how it was obtained."
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Location" htmlFor="ev-loc" required error={errors.location}>
            <input
              id="ev-loc"
              className={inputClass}
              placeholder="Riverside Lot B"
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
            />
          </Field>
          <Field label="Date" htmlFor="ev-date" required error={errors.date}>
            <input
              id="ev-date"
              type="date"
              className={cn(inputClass, 'font-mono')}
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
            />
          </Field>
          <Field label="Time" htmlFor="ev-time" required error={errors.time}>
            <input
              id="ev-time"
              type="time"
              className={cn(inputClass, 'font-mono')}
              value={form.time}
              onChange={(e) => set('time', e.target.value)}
            />
          </Field>
        </div>

        <Field
          label="Uploaded by"
          htmlFor="ev-by"
          required
          error={errors.uploadedBy}
        >
          <select
            id="ev-by"
            className={inputClass}
            value={form.uploadedBy}
            onChange={(e) => set('uploadedBy', e.target.value)}
          >
            {officers.map((o) => (
              <option key={o.id} value={o.name}>
                {o.name} — {o.role}
              </option>
            ))}
          </select>
        </Field>

        <FormActions saving={saving} onClose={onClose} submitLabel="Log evidence" />
      </form>
    </Modal>
  )
}

/* ----------------------------------------------------------- add statement */

export function AddStatementModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { addStatement, statements, officers } = useStore()
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Errors>({})

  const nextId = useMemo(() => {
    const nums = statements
      .map((s) => Number.parseInt(s.id.replace(/\D/g, ''), 10))
      .filter((n) => !Number.isNaN(n))
    return `STM-${String(Math.max(0, ...nums) + 1).padStart(4, '0')}`
  }, [statements])

  const [form, setForm] = useState({
    id: nextId,
    witness: '',
    text: '',
    date: todayISO(),
    time: nowHM(),
    location: '',
    officer: officers[0]?.name ?? '',
  })

  useEffect(() => {
    if (open) {
      setForm((f) => ({ ...f, id: nextId }))
      setErrors({})
    }
  }, [open, nextId])

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const err: Errors = {}
    if (!form.id.trim()) err.id = 'Statement ID is required'
    if (!form.witness.trim()) err.witness = 'Witness name is required'
    if (form.text.trim().length < 12)
      err.text = 'Record the statement in the witness’s own words (min 12 characters)'
    if (!form.location.trim()) err.location = 'Location is required'
    setErrors(err)
    if (Object.keys(err).length) return

    setSaving(true)
    await new Promise((r) => setTimeout(r, 500))
    addStatement({
      id: form.id.trim(),
      witness: form.witness.trim(),
      text: form.text.trim(),
      date: form.date,
      time: form.time,
      location: form.location.trim(),
      officer: form.officer,
    })
    setSaving(false)
    setForm((f) => ({ ...f, witness: '', text: '', location: '' }))
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record a statement"
      description="Added as UNVERIFIED and placed on the case timeline for review."
      size="lg"
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Statement ID" htmlFor="st-id" required error={errors.id}>
            <input
              id="st-id"
              className={cn(inputClass, 'font-mono')}
              value={form.id}
              onChange={(e) => set('id', e.target.value)}
            />
          </Field>
          <Field label="Witness name" htmlFor="st-w" required error={errors.witness}>
            <input
              id="st-w"
              className={inputClass}
              placeholder="R. Kumar"
              value={form.witness}
              onChange={(e) => set('witness', e.target.value)}
            />
          </Field>
        </div>

        <Field
          label="Statement"
          htmlFor="st-text"
          required
          error={errors.text}
          hint="Record what the witness said, not a summary of it."
        >
          <textarea
            id="st-text"
            rows={5}
            className={cn(inputClass, 'resize-none leading-relaxed')}
            value={form.text}
            onChange={(e) => set('text', e.target.value)}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Date" htmlFor="st-date" required>
            <input id="st-date" type="date" className={cn(inputClass, 'font-mono')}
              value={form.date} onChange={(e) => set('date', e.target.value)} />
          </Field>
          <Field label="Time" htmlFor="st-time" required>
            <input id="st-time" type="time" className={cn(inputClass, 'font-mono')}
              value={form.time} onChange={(e) => set('time', e.target.value)} />
          </Field>
          <Field label="Location" htmlFor="st-loc" required error={errors.location}>
            <input id="st-loc" className={inputClass} placeholder="Central Precinct"
              value={form.location} onChange={(e) => set('location', e.target.value)} />
          </Field>
        </div>

        <Field label="Recording officer" htmlFor="st-off" required>
          <select id="st-off" className={inputClass} value={form.officer}
            onChange={(e) => set('officer', e.target.value)}>
            {officers.map((o) => (
              <option key={o.id} value={o.name}>{o.name} — {o.role}</option>
            ))}
          </select>
        </Field>

        <FormActions saving={saving} onClose={onClose} submitLabel="Record statement" />
      </form>
    </Modal>
  )
}

/* ---------------------------------------------------------------- add case */

export function AddCaseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addCase, cases, officers } = useStore()
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [form, setForm] = useState({
    id: '',
    title: '',
    description: '',
    officer: officers[0]?.name ?? '',
    status: 'Investigation Active',
    date: todayISO(),
  })

  useEffect(() => {
    if (open) {
      setForm((f) => ({ ...f, id: `CT-${new Date().getFullYear()}-${String(cases.length + 15).padStart(3, '0')}` }))
      setErrors({})
    }
  }, [open, cases.length])

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const err: Errors = {}
    if (!form.id.trim()) err.id = 'Case ID is required'
    else if (cases.some((c) => c.id === form.id.trim())) err.id = 'That case ID already exists'
    if (!form.title.trim()) err.title = 'Title is required'
    setErrors(err)
    if (Object.keys(err).length) return

    setSaving(true)
    await new Promise((r) => setTimeout(r, 480))
    addCase({ ...form, id: form.id.trim(), title: form.title.trim() })
    setSaving(false)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Open a case"
      description="Creates a new case file in this workspace." size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Case ID" htmlFor="c-id" required error={errors.id}>
            <input id="c-id" className={cn(inputClass, 'font-mono')} value={form.id}
              onChange={(e) => set('id', e.target.value)} />
          </Field>
          <Field label="Date opened" htmlFor="c-date" required>
            <input id="c-date" type="date" className={cn(inputClass, 'font-mono')}
              value={form.date} onChange={(e) => set('date', e.target.value)} />
          </Field>
        </div>
        <Field label="Title" htmlFor="c-title" required error={errors.title}>
          <input id="c-title" className={inputClass} placeholder="Vehicle Theft Investigation"
            value={form.title} onChange={(e) => set('title', e.target.value)} />
        </Field>
        <Field label="Description" htmlFor="c-desc">
          <textarea id="c-desc" rows={3} className={cn(inputClass, 'resize-none')}
            value={form.description} onChange={(e) => set('description', e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Lead officer" htmlFor="c-off" required>
            <select id="c-off" className={inputClass} value={form.officer}
              onChange={(e) => set('officer', e.target.value)}>
              {officers.map((o) => <option key={o.id} value={o.name}>{o.name}</option>)}
            </select>
          </Field>
          <Field label="Status" htmlFor="c-status" required>
            <select id="c-status" className={inputClass} value={form.status}
              onChange={(e) => set('status', e.target.value)}>
              {['Investigation Active', 'Pending Review', 'Awaiting Forensics', 'Closed'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
        </div>
        <FormActions saving={saving} onClose={onClose} submitLabel="Create case" />
      </form>
    </Modal>
  )
}

/* --------------------------------------------------------------- add user */

export function AddUserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addOfficer, officers } = useStore()
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [form, setForm] = useState({
    name: '', officerId: '', role: 'Investigating Officer',
    email: '', permission: 'read' as 'read' | 'write' | 'admin',
  })

  useEffect(() => { if (open) setErrors({}) }, [open])
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const err: Errors = {}
    if (!form.name.trim()) err.name = 'Name is required'
    if (!form.officerId.trim()) err.officerId = 'Officer ID is required'
    else if (officers.some((o) => o.officerId === form.officerId.trim()))
      err.officerId = 'That officer ID is already registered'
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email))
      err.email = 'Enter a valid email address'
    setErrors(err)
    if (Object.keys(err).length) return

    setSaving(true)
    await new Promise((r) => setTimeout(r, 450))
    addOfficer({
      name: form.name.trim(), officerId: form.officerId.trim(),
      role: form.role, email: form.email.trim(), permission: form.permission,
    })
    setSaving(false)
    setForm({ name: '', officerId: '', role: 'Investigating Officer', email: '', permission: 'read' })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Add officer"
      description="Grants access to this workspace at the permission level you select.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name" htmlFor="u-name" required error={errors.name}>
          <input id="u-name" className={inputClass} placeholder="Det. A. Mreyen"
            value={form.name} onChange={(e) => set('name', e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Officer ID" htmlFor="u-id" required error={errors.officerId}>
            <input id="u-id" className={cn(inputClass, 'font-mono')} placeholder="KA-1004"
              value={form.officerId} onChange={(e) => set('officerId', e.target.value)} />
          </Field>
          <Field label="Role" htmlFor="u-role" required>
            <select id="u-role" className={inputClass} value={form.role}
              onChange={(e) => set('role', e.target.value)}>
              {['Investigating Officer', 'Supervisor', 'Forensic Reviewer', 'Legal Reviewer'].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Email" htmlFor="u-email" required error={errors.email}>
          <input id="u-email" type="email" className={inputClass} placeholder="name@example.gov"
            value={form.email} onChange={(e) => set('email', e.target.value)} />
        </Field>
        <Field label="Permission level" htmlFor="u-perm" required
          hint="Read grants case visibility only. Admin can manage officers and cases.">
          <div className="grid grid-cols-3 gap-2">
            {(['read', 'write', 'admin'] as const).map((p) => (
              <button key={p} type="button" onClick={() => set('permission', p)}
                aria-pressed={form.permission === p}
                className={cn(
                  'btn-press rounded-lg border px-3 py-2 font-mono text-[11px] uppercase transition-colors',
                  form.permission === p
                    ? 'border-primary/60 bg-primary/12 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:text-foreground',
                )}>
                {p}
              </button>
            ))}
          </div>
        </Field>
        <FormActions saving={saving} onClose={onClose} submitLabel="Add officer" />
      </form>
    </Modal>
  )
}

/* --------------------------------------------------------- evidence preview */

/**
 * Preview for one evidence item.
 *
 * The CCTV panel is a styled representation, not a video player, and it says so
 * on screen. Presenting a mock as real footage in a forensic tool would be
 * exactly the kind of overclaiming this product argues against.
 */
export function EvidencePreviewModal({
  item,
  onClose,
}: {
  item: Evidence | null
  onClose: () => void
}) {
  const { verifyEvidence } = useStore()
  const isVideo = item?.type === 'CCTV Footage'

  return (
    <Modal
      open={!!item}
      onClose={onClose}
      title={item ? `${item.id} — ${item.type}` : ''}
      description={item?.filename}
      size="xl"
    >
      {item && (
        <div className="space-y-4">
          <div className="relative aspect-video overflow-hidden rounded-xl border border-border surface-deep">
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  'linear-gradient(to right, rgba(120,200,220,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(120,200,220,0.08) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              {isVideo ? (
                <>
                  <motion.div
                    className="flex size-14 items-center justify-center rounded-full border border-primary/50 bg-primary/10"
                    animate={{ scale: [1, 1.06, 1] }}
                    transition={{ duration: 2.4, repeat: Infinity }}
                  >
                    <Play className="size-5 translate-x-0.5 text-primary" aria-hidden="true" />
                  </motion.div>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {item.filename}
                  </p>
                </>
              ) : (
                <>
                  <ImageIcon className="size-10 text-muted-foreground" aria-hidden="true" />
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {item.filename}
                  </p>
                </>
              )}
              <p className="max-w-sm px-6 text-center text-[11px] leading-relaxed text-amber-300/90">
                Demo placeholder — no media file is attached to this record. This
                panel represents the viewer; it is not the evidence itself.
              </p>
            </div>

            <div className="absolute top-3 left-3 flex items-center gap-2 rounded-md border border-border bg-background/80 px-2 py-1 font-mono text-[10px] text-muted-foreground backdrop-blur">
              {isVideo ? <Video className="size-3" /> : <Camera className="size-3" />}
              {item.type}
            </div>
            <div className="absolute right-3 bottom-3 font-mono text-[10px] text-muted-foreground">
              {item.timestamp}
            </div>
          </div>

          <dl className="grid gap-3 sm:grid-cols-2">
            {[
              ['Evidence ID', item.id, true],
              ['Location', item.location, false],
              ['Uploaded by', item.uploadedBy, false],
              ['Captured', item.timestamp, true],
              ['SHA-256', item.hash, true],
              ['Two-person', item.twoPersonConfirmed ? 'Confirmed' : 'Pending', false],
            ].map(([label, value, mono]) => (
              <div key={label as string} className="rounded-lg border border-border bg-background/50 px-3 py-2">
                <dt className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                  {label as string}
                </dt>
                <dd className={cn('mt-0.5 text-xs text-foreground', mono && 'font-mono')}>
                  {value as string}
                </dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <StatusBadge status={item.status} />
            <div className="flex gap-2">
              <button type="button" onClick={onClose}
                className="btn-press rounded-lg border border-border bg-secondary/60 px-3 py-2 text-xs transition-colors hover:bg-secondary">
                Close
              </button>
              {item.status !== 'verified' && (
                <button
                  type="button"
                  onClick={() => { verifyEvidence(item.id); onClose() }}
                  className="btn-press inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/12 px-3 py-2 text-xs text-emerald-300 transition-colors hover:bg-emerald-500/20"
                >
                  <ShieldCheck className="size-3.5" aria-hidden="true" />
                  Confirm as second officer
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}

/* ------------------------------------------------------------------ shared */

function FormActions({
  saving,
  onClose,
  submitLabel,
}: {
  saving: boolean
  onClose: () => void
  submitLabel: string
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
      <button
        type="button"
        onClick={onClose}
        disabled={saving}
        className="btn-press rounded-lg border border-border bg-secondary/60 px-4 py-2 text-xs transition-colors hover:bg-secondary disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={saving}
        className="btn-press inline-flex items-center gap-2 rounded-lg border border-primary/50 bg-primary/15 px-4 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/25 disabled:opacity-50"
      >
        {saving ? (
          <>
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            Saving…
          </>
        ) : (
          <>
            <FileText className="size-3.5" aria-hidden="true" />
            {submitLabel}
          </>
        )}
      </button>
    </div>
  )
}
