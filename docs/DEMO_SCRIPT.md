# Chain of Truth — Live Demo Script (Part 5)

**Target length: 3–4 minutes.** Practice until smooth.

---

## Opening (20 sec)

> “When a crime happens, evidence arrives piecemeal — a photo from one officer, a statement from another, a forensic report weeks later. Piecing it together is slow, manual, and a documented cause of cases collapsing on technicalities.
>
> India already has CCTNS and ICJS — excellent **record-keeping**. They store what’s entered. They don’t read it or catch contradictions as the case develops.
>
> Chain of Truth is the **active reasoning layer** on top. Principle: **AI assists, humans decide.**”

---

## Live flow (2–2.5 min)

1. **Dashboard / case open**  
   Show seeded case (e.g. Green Park death). Point at evidence locker + **hash chain: Intact**.

2. **Contradiction detector**  
   Open the time conflict (witness ~9 PM vs CCTV ~8:40).  
   Say: “AI flagged this with confidence and an explanation. It is **not** in the official record yet.”

3. **Officer action**  
   Confirm or Dismiss as the officer. Show status change + note.  
   “That decision is logged. The log itself is evidence of due diligence.”

4. **Live upload (optional if time)**  
   Log one short new statement on stage → hash written → timeline / flag update.

5. **Guidance agent**  
   Show checklist items linked to real BNS/CrPC sections.  
   “Checklist assistant — not a legal authority. Every suggestion cites the rule.”

6. **Autopsy agent (30 sec)**  
   Run analysis. Read the label out loud:  
   *“AI-generated investigative hypothesis — requires forensic medical officer review.”*  
   “We flag gaps. We never diagnose cause of death.”

7. **Chargesheet QA (20 sec)**  
   Run QA. Show risk level + checklist.  
   “Pre-filing QA for a human legal reviewer — not a verdict on case strength.”

---

## Close (20 sec)

> “Courts only ever see the **verified** record, plus a transparent log of what the AI flagged and how officers responded. That log is a strength, not a liability.
>
> We complement CCTNS/ICJS. We don’t replace them.”

---

## Judge objections — short answers

| Objection | Answer |
|-----------|--------|
| What if the AI is wrong? | It cannot enter the official record until a human confirms or dismisses it. The AI layer stays labeled unverified. The log of flags + officer decisions is due diligence. |
| Replacing CCTNS/ICJS? | No. Those are systems of record. We are an optional reasoning layer that surfaces contradictions while the case is still live. |
| Hash chain faked before upload? | Two-person confirmation at collection + locked device metadata + shift location cross-check. Chain proves post-upload integrity; process protects pre-upload. |
| Hallucination? | Every extracted fact is shown next to its source. Nothing is ground truth without human confirmation. Legal guidance uses a curated BNS/CrPC KB, not model memory. |
| Location prediction “AI”? | Deliberately rule-based and explainable. We chose honesty over hype. |
| Autopsy agent deciding cause of death? | Never. Explicit label on every output: hypothesis requiring forensic medical officer review. Exists only to flag investigation gaps. |

---

## Demo checklist (before stage)

- [ ] Backend up, demo case seeded, chain shows Intact  
- [ ] At least one open contradiction visible  
- [ ] Guidance items populated  
- [ ] Autopsy + Chargesheet buttons respond in < 2s  
- [ ] Officer identity header / login works  
- [ ] Backup screenshots if network dies  
