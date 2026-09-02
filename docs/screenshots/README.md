# Screenshots

These are **generated from the running application**, not collected by hand.

## Regenerating

Start the dev server, then from `frontend/`:

```powershell
npm run dev                              # in one terminal
node scripts/capture-screenshots.mjs     # in another
```

The script seeds a demo session into `localStorage` to clear the auth guard,
clicks through every nav item, waits for each page to settle (longer for the
canvas and WebGL views) and writes a PNG per page.

Captures are taken at 1600×950 with a 2× device pixel ratio, then downscaled to
1600px wide and quantised to a 256-colour palette. These are flat dark-UI
screenshots — large areas of near-identical colour — so palette PNG is close to
lossless here while cutting the set from ~49 MB to ~8 MB.

## Files

`README.md` references every one of these by name. Renaming a file breaks an
image tag there.

| File | Page |
| --- | --- |
| `01-landing.png` | Landing |
| `02-command-center.png` | Command Center |
| `03-evidence-vault.png` | Evidence Vault |
| `04-case-timeline.png` | Case Timeline |
| `05-evidence-graph.png` | Evidence Graph |
| `06-forensic-map.png` | Forensic Map |
| `07-autopsy-3d.png` | Autopsy Cross-Check (3D) |
| `08-investigation-guidance.png` | Investigation Guidance |
| `09-evidence-gaps.png` | Evidence Gaps |
| `10-statement-reliability.png` | Statement Reliability |
| `11-digital-correlation.png` | Digital Evidence Correlation |
| `12-case-similarity.png` | Case Similarity |
| `13-review-queue.png` | Human Verification |
| `14-closure-readiness.png` | Case Closure Readiness |
| `15-chargesheet-qa.png` | Chargesheet QA |
| `16-audit-trail.png` | Audit Trail |
| `17-system-integrity.png` | System Integrity |
| `18-contradictions.png` | Contradictions |
| `19-ai-extractions.png` | AI Extractions |
