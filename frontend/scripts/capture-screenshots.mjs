/**
 * Capture a screenshot of every workspace page into docs/screenshots/.
 *
 *   node scripts/capture-screenshots.mjs
 *
 * The dev server must already be running on :3000. Requires `playwright` and a
 * downloaded Chromium (`npx playwright install chromium`), both dev-only —
 * nothing here ships in the app bundle.
 *
 * The workspace is a single route with client-side tabs, not separate URLs, so
 * this seeds a session into localStorage to clear the auth guard, then clicks
 * each nav item and waits for the page transition to settle before shooting.
 * Canvas and WebGL views (map, graph, 3D anatomy) get extra settle time,
 * because a screenshot taken mid-animation is worse than no screenshot.
 */

import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const OUT = path.join(ROOT, 'docs', 'screenshots')
const BASE = process.env.BASE_URL || 'http://localhost:3000'

/** Filenames match the image tags in README.md exactly. */
const PAGES = [
  { key: 'overview',       file: '02-command-center.png' },
  { key: 'evidence',       file: '03-evidence-vault.png' },
  { key: 'timeline',       file: '04-case-timeline.png' },
  { key: 'graph',          file: '05-evidence-graph.png',        settle: 4000 },
  { key: 'location',       file: '06-forensic-map.png',          settle: 6000 },
  { key: 'autopsy',        file: '07-autopsy-3d.png',            settle: 5000 },
  { key: 'guidance',       file: '08-investigation-guidance.png' },
  { key: 'gaps',           file: '09-evidence-gaps.png' },
  { key: 'statements',     file: '10-statement-reliability.png' },
  { key: 'correlation',    file: '11-digital-correlation.png' },
  { key: 'similarity',     file: '12-case-similarity.png' },
  { key: 'verification',   file: '13-review-queue.png' },
  { key: 'readiness',      file: '14-closure-readiness.png' },
  { key: 'chargesheet',    file: '15-chargesheet-qa.png' },
  { key: 'audit',          file: '16-audit-trail.png' },
  { key: 'settings',       file: '17-system-integrity.png' },
  { key: 'contradictions', file: '18-contradictions.png' },
  { key: 'ai-flags',       file: '19-ai-extractions.png' },
]

const SESSION = {
  officerId: '1',
  badgeNumber: 'KA-1001',
  fullName: 'Insp. Anita Rao',
  role: 'Investigating Officer',
  initials: 'AR',
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  await mkdir(OUT, { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1600, height: 950 },
    deviceScaleFactor: 2, // retina-crisp for a README
    reducedMotion: 'no-preference',
  })
  const page = await context.newPage()

  const failures = []

  // ── landing ──────────────────────────────────────────────────────────────
  console.log('capturing landing…')
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await sleep(4500) // let the reveal sequence finish and the 3D network settle
  await page.screenshot({ path: path.join(OUT, '01-landing.png') })
  console.log('  01-landing.png')

  // ── seed a session so the workspace guard passes ─────────────────────────
  await page.evaluate((s) => {
    localStorage.setItem('cot_session', JSON.stringify(s))
    localStorage.setItem('cot_officer_id', s.officerId)
    localStorage.setItem('cot_badge_number', s.badgeNumber)
  }, SESSION)

  await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' })
  await sleep(2500)

  // ── each workspace page ──────────────────────────────────────────────────
  for (const { key, file, settle } of PAGES) {
    try {
      // The rail is hidden below lg; at 1600px wide it is present.
      const label = await page.evaluate((k) => {
        const btn = document.querySelector(`[data-nav="${k}"]`)
        return btn ? btn.textContent : null
      }, key)

      // Nav buttons have no test id, so match on the visible label text.
      const nav = page.locator('aside nav button').filter({
        hasText: new RegExp(labelFor(key), 'i'),
      })
      await nav.first().click({ timeout: 10_000 })

      await page.waitForTimeout(settle ?? 1600)
      // Scroll to top: the sticky header otherwise overlaps the page title.
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.waitForTimeout(400)

      await page.screenshot({ path: path.join(OUT, file) })
      console.log(`  ${file}${label ? '' : ''}`)
    } catch (err) {
      failures.push({ key, file, message: String(err).split('\n')[0] })
      console.log(`  FAILED ${file} — ${String(err).split('\n')[0]}`)
    }
  }

  await browser.close()

  console.log(`\ncaptured ${PAGES.length + 1 - failures.length}/${PAGES.length + 1}`)
  if (failures.length) {
    console.log('failures:')
    for (const f of failures) console.log(`  ${f.file}: ${f.message}`)
    process.exitCode = 1
  }
}

/** Nav label text, mirroring lib/nav.ts. */
function labelFor(key) {
  return {
    overview: 'Command Center',
    evidence: '^Evidence$',
    timeline: 'Case Timeline',
    graph: 'Evidence Graph',
    location: 'Forensic Map',
    contradictions: 'Contradictions',
    'ai-flags': 'AI Extractions',
    guidance: 'Investigation Guidance',
    gaps: 'Evidence Gaps',
    autopsy: 'Autopsy Cross-Check',
    statements: 'Statement Reliability',
    correlation: 'Digital Correlation',
    similarity: 'Case Similarity',
    verification: 'Review Queue',
    readiness: 'Closure Readiness',
    chargesheet: 'Chargesheet QA',
    audit: 'Audit Trail',
    settings: 'System Integrity',
  }[key]
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
