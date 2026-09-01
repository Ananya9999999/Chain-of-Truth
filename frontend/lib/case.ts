/**
 * The case the workspace is currently scoped to.
 *
 * A single constant for now because the demo runs one seeded case. It lives
 * here rather than being inlined in a dozen pages so that introducing a real
 * case switcher later is one edit, not a search-and-replace.
 */
export const DEMO_CASE_REF = process.env.NEXT_PUBLIC_DEMO_CASE || 'CR-2026-0042'

export const DEMO_DATA_NOTICE =
  'Demo environment — all case data is fictional. No real personal information is present.'
