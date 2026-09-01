"""
Chain of Truth — AI Engine (Part 2 + Part 3)

Part 2: Extraction, Timeline, Contradiction detection
Part 3: Investigation Guidance Agent, Autopsy Agent, Chargesheet QA Agent

Design rules:
- Every AI output is labeled "AI-extracted / unverified" or "hypothesis — requires human review"
- Legal knowledge is curated (BNS / CrPC), not hallucinated from model memory
- Guidance is a checklist assistant, never a legal authority
- Autopsy agent never diagnoses cause of death
"""
from datetime import datetime
from typing import List, Dict, Any, Optional
import re
import json


# ─────────────────────────────────────────────────────────────
# CURATED LEGAL KNOWLEDGE BASE (BNS 2023 + CrPC + Evidence Act)
# This is the "RAG" source for the Guidance Agent.
# ─────────────────────────────────────────────────────────────
LEGAL_KB: List[Dict[str, Any]] = [
    # ── Substantive offences (Bharatiya Nyaya Sanhita) ──
    {
        "id": "bns_103",
        "section": "BNS Section 103",
        "title": "Murder",
        "category": "offence",
        "text": "Whoever commits murder shall be punished with death or imprisonment for life, and shall also be liable to fine.",
        "triggers": ["murder", "homicide", "killing", "killed", "culpable homicide amounting to murder"],
        "checklist": [
            "Establish intention or knowledge under Section 100/101 definitions",
            "Document motive if available (not essential but strengthens case)",
            "Secure weapon and link via forensic matching",
            "Record dying declaration if applicable (Section 32 Evidence Act)",
        ],
    },
    {
        "id": "bns_105",
        "section": "BNS Section 105",
        "title": "Culpable homicide not amounting to murder",
        "category": "offence",
        "text": "Whoever commits culpable homicide not amounting to murder shall be punished with imprisonment for life, or imprisonment of either description for a term which may extend to ten years, and shall also be liable to fine.",
        "triggers": ["culpable homicide", "not amounting to murder", "exception"],
        "checklist": [
            "Examine if any of the five exceptions to murder apply",
            "Record exact sequence of events leading to the act",
        ],
    },
    {
        "id": "bns_106",
        "section": "BNS Section 106",
        "title": "Causing death by negligence",
        "category": "offence",
        "text": "Whoever causes death of any person by doing any rash or negligent act not amounting to culpable homicide shall be punished with imprisonment of either description for a term which may extend to two years, or with fine, or with both.",
        "triggers": ["negligence", "rash", "accident", "road accident", "medical negligence"],
        "checklist": [
            "Collect mechanical inspection report (vehicle cases)",
            "Obtain expert opinion on standard of care (medical cases)",
        ],
    },
    {
        "id": "bns_109",
        "section": "BNS Section 109",
        "title": "Attempt to murder",
        "category": "offence",
        "text": "Whoever does any act with such intention or knowledge, and under such circumstances that, if he by that act caused death, he would be guilty of murder, shall be punished...",
        "triggers": ["attempt to murder", "attempted murder", "intent to kill"],
        "checklist": ["Document nature of injuries and weapon used", "Record medical opinion on danger to life"],
    },
    {
        "id": "bns_115",
        "section": "BNS Section 115 / 117",
        "title": "Voluntarily causing hurt / grievous hurt",
        "category": "offence",
        "text": "Provisions relating to voluntarily causing hurt and grievous hurt. Grievous hurt includes emasculation, permanent privation of sight/hearing, fracture, etc.",
        "triggers": ["hurt", "grievous hurt", "assault", "injury", "fracture", "stab"],
        "checklist": [
            "Obtain detailed injury certificate from registered medical practitioner",
            "Classify injuries as simple or grievous under statutory definition",
        ],
    },
    {
        "id": "bns_303",
        "section": "BNS Section 303",
        "title": "Theft",
        "category": "offence",
        "text": "Whoever, intending to take dishonestly any movable property out of the possession of any person without that person's consent, moves that property, is said to commit theft.",
        "triggers": ["theft", "stolen", "steal", "larceny"],
        "checklist": [
            "Prepare seizure memo with independent witnesses",
            "Inventory recovered property with unique identifiers",
            "Link accused to possession via recovery under Section 27 Evidence Act if applicable",
        ],
    },
    {
        "id": "bns_309",
        "section": "BNS Section 309",
        "title": "Robbery",
        "category": "offence",
        "text": "Theft is robbery if, in order to the committing of the theft, or in committing the theft, or in carrying away property obtained by theft, the offender voluntarily causes or attempts to cause death, hurt, or wrongful restraint.",
        "triggers": ["robbery", "dacoity", "snatching"],
        "checklist": ["Document use or threat of force", "Identify all participants if dacoity (5 or more)"],
    },
    {
        "id": "bns_318",
        "section": "BNS Section 318",
        "title": "Cheating",
        "category": "offence",
        "text": "Whoever, by deceiving any person, fraudulently or dishonestly induces the person so deceived to deliver any property... is said to cheat.",
        "triggers": ["cheating", "fraud", "deception", "forgery"],
        "checklist": ["Collect original documents alleged to be forged", "Obtain handwriting / signature expert opinion if needed"],
    },

    # ── Procedural (CrPC / BNSS) ──
    {
        "id": "crpc_154",
        "section": "CrPC / BNSS Section 154",
        "title": "Information in cognizable cases (FIR)",
        "category": "procedure",
        "text": "Every information relating to the commission of a cognizable offence, if given orally to an officer in charge of a police station, shall be reduced to writing by him or under his direction, and be read over to the informant.",
        "triggers": ["fir", "first information", "cognizable", "police station"],
        "checklist": [
            "Ensure FIR is registered promptly for cognizable offences",
            "Provide free copy of FIR to informant",
            "Avoid delay that could be used to attack credibility",
        ],
    },
    {
        "id": "crpc_161",
        "section": "CrPC / BNSS Section 161",
        "title": "Examination of witnesses by police",
        "category": "procedure",
        "text": "Any police officer making an investigation under this Chapter may examine orally any person supposed to be acquainted with the facts and circumstances of the case.",
        "triggers": ["witness", "statement", "examination", "161 statement"],
        "checklist": [
            "Record statements promptly after the incident",
            "Read over the statement to the witness",
            "Note any subsequent improvements or omissions in later statements",
            "Do not administer oath (statements under 161 are not on oath)",
        ],
    },
    {
        "id": "crpc_164",
        "section": "CrPC / BNSS Section 164",
        "title": "Recording of confessions and statements by Magistrate",
        "category": "procedure",
        "text": "Any Metropolitan Magistrate or Judicial Magistrate may record any confession or statement made to him in the course of an investigation.",
        "triggers": ["confession", "164 statement", "magistrate", "judicial confession"],
        "checklist": [
            "Ensure confession is voluntary — Magistrate must give time for reflection",
            "Record in the manner prescribed; accused should not be in police custody during recording if possible",
        ],
    },
    {
        "id": "crpc_27_evidence",
        "section": "Indian Evidence Act Section 27",
        "title": "How much of information received from accused may be proved",
        "category": "procedure",
        "text": "When any fact is deposed to as discovered in consequence of information received from a person accused of any offence, in the custody of a police officer, so much of such information as relates distinctly to the fact thereby discovered may be proved.",
        "triggers": ["recovery", "disclosure", "section 27", "discovery"],
        "checklist": [
            "Document exact words of disclosure",
            "Ensure independent witnesses to recovery",
            "Prepare proper recovery / seizure memo",
            "Photograph and seal recovered articles",
        ],
    },
    {
        "id": "chain_of_custody",
        "section": "Chain of Custody principles (Evidence Act + judicial precedents)",
        "title": "Chain of Custody",
        "category": "procedure",
        "text": "Evidence must be collected, sealed, labeled, and transferred with continuous documented custody. Any unexplained break can lead to exclusion or adverse inference.",
        "triggers": ["custody", "seal", "seizure", "evidence bag", "tamper", "chain of custody"],
        "checklist": [
            "Two-person confirmation at collection",
            "Unique seal numbers recorded",
            "Every transfer logged with time, place, and signatures",
            "Store in secure malkhana / evidence room",
        ],
    },
    {
        "id": "crpc_173",
        "section": "CrPC / BNSS Section 173",
        "title": "Report of police officer on completion of investigation (Chargesheet / Final Report)",
        "category": "procedure",
        "text": "Every investigation under this Chapter shall be completed without unnecessary delay. As soon as it is completed, the officer in charge shall forward to a Magistrate empowered to take cognizance a report in the prescribed form.",
        "triggers": ["chargesheet", "final report", "investigation complete", "173 report", "closure report"],
        "checklist": [
            "Ensure all material evidence is listed and copies supplied",
            "Include list of witnesses and documents",
            "Address any contradictions that defense may exploit",
            "File within statutory timelines where applicable",
        ],
    },
    {
        "id": "crpc_41a",
        "section": "CrPC / BNSS Section 41A / related arrest guidelines",
        "title": "Notice of appearance before police officer / Arrest safeguards",
        "category": "procedure",
        "text": "Judicial guidelines (Arnesh Kumar etc.) require that arrest is not automatic for offences punishable up to 7 years. Notice under 41A should be preferred where appropriate.",
        "triggers": ["arrest", "41a", "notice of appearance", "custody"],
        "checklist": [
            "Record reasons for arrest in writing",
            "Inform grounds of arrest to the accused",
            "Produce before Magistrate within 24 hours",
        ],
    },
    {
        "id": "evidence_act_32",
        "section": "Indian Evidence Act Section 32",
        "title": "Dying declaration / statements by persons who cannot be called as witnesses",
        "category": "procedure",
        "text": "Statements, written or verbal, of relevant facts made by a person who is dead... are themselves relevant facts in certain cases, including when the statement is made by a person as to the cause of his death.",
        "triggers": ["dying declaration", "death bed", "last words", "section 32"],
        "checklist": [
            "Record as soon as possible, preferably by Magistrate",
            "Ensure declarant is in fit mental state (medical certification)",
            "Avoid leading questions; record exact words",
        ],
    },
    {
        "id": "post_mortem",
        "section": "CrPC provisions on inquest & post-mortem",
        "title": "Inquest and Post-Mortem",
        "category": "procedure",
        "text": "In cases of unnatural death, inquest under Section 174 CrPC and post-mortem examination are mandatory to establish cause and manner of death.",
        "triggers": ["post-mortem", "autopsy", "inquest", "dead body", "unnatural death", "cause of death"],
        "checklist": [
            "Conduct inquest promptly",
            "Request post-mortem by authorized medical officer",
            "Preserve viscera for chemical analysis if poisoning suspected",
            "Cross-reference injury pattern with recovered weapon",
        ],
    },
]


# ─────────────────────────────────────────────────────────────
# ENTITY EXTRACTION (shared by all agents)
# ─────────────────────────────────────────────────────────────
def extract_entities(text: str) -> Dict[str, Any]:
    if not text:
        return {"times": [], "locations": [], "persons": [], "weapons": [], "vehicles": [], "injuries": [], "toxins": []}

    text_lower = text.lower()
    entities: Dict[str, Any] = {
        "times": [],
        "locations": [],
        "persons": [],
        "weapons": [],
        "vehicles": [],
        "injuries": [],
        "toxins": [],
    }

    time_patterns = [
        r"\b(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM)?)\b",
        r"\b(\d{1,2}\s*(?:am|pm|AM|PM))\b",
        r"\b(?:around|at|about|between)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b",
        r"\b(\d{1,2})\s*(?:o'clock|oclock|hrs|hours)\b",
        r"\b(\d{2}:\d{2})\b",
    ]
    for pat in time_patterns:
        for m in re.finditer(pat, text, re.IGNORECASE):
            val = m.group(1).strip()
            if val not in entities["times"]:
                entities["times"].append(val)

    loc_keywords = [
        "near", "at", "in front of", "outside", "inside", "street", "road",
        "colony", "nagar", "market", "station", "hospital", "park", "lane", "chowk",
    ]
    for kw in loc_keywords:
        if kw in text_lower:
            idx = text_lower.find(kw)
            snippet = text[max(0, idx - 15): idx + 55].strip()
            if snippet and snippet not in entities["locations"]:
                entities["locations"].append(snippet)

    name_pat = r"(?:witness|accused|victim|officer|by|said|named|deceased|complainant)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)"
    for m in re.finditer(name_pat, text):
        name = m.group(1)
        if name not in entities["persons"]:
            entities["persons"].append(name)

    weapons = [
        "knife", "gun", "pistol", "revolver", "sword", "rod", "stick", "blade",
        "firearm", "country-made", "khukri", "axe", "hammer", "iron rod", "scissors",
    ]
    for w in weapons:
        if w in text_lower and w not in entities["weapons"]:
            neg_pat = rf"\bno\s+{re.escape(w)}\b|\bwithout\s+{re.escape(w)}\b|\bno\s+{re.escape(w)}shot\b"
            if re.search(neg_pat, text_lower):
                continue
            if w == "gun" and "no gunshot" in text_lower:
                continue
            entities["weapons"].append(w)

    injuries = [
        "stab", "gunshot", "bruise", "fracture", "laceration", "contusion",
        "wound", "bleeding", "injury", "incised", "punctured", "abrasion",
        "haemorrhage", "hematoma", "cut", "slash", "sharp-force",
    ]
    for i in injuries:
        if i in text_lower and i not in entities["injuries"]:
            # skip if clearly negated (e.g. "no gunshot wounds")
            neg_pat = rf"\bno\s+{re.escape(i)}\b|\bwithout\s+{re.escape(i)}\b|\babsence of\s+{re.escape(i)}\b"
            if re.search(neg_pat, text_lower):
                continue
            entities["injuries"].append(i)

    toxins = ["poison", "pesticide", "insecticide", "alcohol", "ethanol", "drug", "narcotic", "toxicology"]
    for t in toxins:
        if t in text_lower and t not in entities["toxins"]:
            entities["toxins"].append(t)

    vehicles = ["car", "bike", "motorcycle", "scooter", "auto", "truck", "tempo", "number plate", "vehicle"]
    for v in vehicles:
        if v in text_lower and v not in entities["vehicles"]:
            entities["vehicles"].append(v)

    return entities


# ─────────────────────────────────────────────────────────────
# TIMELINE BUILDER
# ─────────────────────────────────────────────────────────────
def build_timeline_candidates(evidence_items: List[Dict]) -> List[Dict]:
    events = []
    for ev in evidence_items:
        content = ev.get("raw_content") or ev.get("description") or ""
        entities = extract_entities(content)
        collected = ev.get("collected_at")
        if isinstance(collected, str):
            try:
                collected = datetime.fromisoformat(collected.replace("Z", "+00:00"))
            except Exception:
                collected = None

        title = ev.get("title") or f"{ev.get('evidence_type', 'Evidence').title()} logged"
        desc_parts = [content[:300]]
        if entities.get("times"):
            desc_parts.append(f"Mentioned times: {', '.join(entities['times'][:3])}")
        if entities.get("locations"):
            desc_parts.append(f"Location cues: {entities['locations'][0][:80]}")

        events.append({
            "evidence_id": ev.get("id"),
            "event_time": collected.isoformat() if collected else None,
            "title": title,
            "description": " | ".join(desc_parts),
            "location": entities["locations"][0][:120] if entities["locations"] else None,
            "source_type": "ai_extracted",
            "is_verified": False,
            "confidence": 0.75 if entities.get("times") or entities.get("locations") else 0.55,
            "entities": entities,
            "label": "AI-extracted, unverified",
        })
    events.sort(key=lambda x: x["event_time"] or "9999")
    return events


# ─────────────────────────────────────────────────────────────
# CONTRADICTION DETECTOR
# ─────────────────────────────────────────────────────────────
def _hours_from_times(times: List[str]) -> set:
    hrs = set()
    for t in times:
        m = re.search(r"(\d{1,2})", t)
        if not m:
            continue
        h = int(m.group(1))
        low = t.lower()
        if "pm" in low and h < 12:
            h += 12
        if "am" in low and h == 12:
            h = 0
        hrs.add(h)
    return hrs


def detect_contradictions(evidence_items: List[Dict], timeline: List[Dict] = None) -> List[Dict]:
    contradictions = []
    n = len(evidence_items)
    for i in range(n):
        for j in range(i + 1, n):
            a = evidence_items[i]
            b = evidence_items[j]
            a_text = (a.get("raw_content") or a.get("description") or "").lower()
            b_text = (b.get("raw_content") or b.get("description") or "").lower()
            a_ent = extract_entities(a.get("raw_content") or a.get("description") or "")
            b_ent = extract_entities(b.get("raw_content") or b.get("description") or "")

            # Time conflict
            a_hrs = _hours_from_times(a_ent["times"])
            b_hrs = _hours_from_times(b_ent["times"])
            if a_hrs and b_hrs and a_hrs.isdisjoint(b_hrs):
                contradictions.append({
                    "evidence_a_id": a["id"],
                    "evidence_b_id": b["id"],
                    "description": (
                        f"Possible time discrepancy: Evidence #{a['id']} references hours {sorted(a_hrs)}, "
                        f"while Evidence #{b['id']} references hours {sorted(b_hrs)}."
                    ),
                    "severity": "high",
                    "confidence": 0.72,
                    "ai_explanation": (
                        "Extracted time references do not overlap. Officer should reconcile witness statements, "
                        "CCTV clock calibration, and exact wording before treating either as verified."
                    ),
                    "label": "AI-flagged, requires human review",
                })

            # Weapon vs injury mismatch (only if positive gunshot language, not negation)
            if a_ent["weapons"] and b_ent["injuries"]:
                if "knife" in a_ent["weapons"] or "blade" in a_ent["weapons"]:
                    if any(x in b_ent["injuries"] for x in ["gunshot"]) and "no gunshot" not in b_text:
                        contradictions.append({
                            "evidence_a_id": a["id"],
                            "evidence_b_id": b["id"],
                            "description": "Weapon language (knife/blade) appears inconsistent with gunshot-type injury language.",
                            "severity": "critical",
                            "confidence": 0.68,
                            "ai_explanation": (
                                "Cross-check recovered weapon against post-mortem injury pattern. "
                                "This is a hypothesis only — forensic medical officer must decide."
                            ),
                            "label": "AI-flagged, requires human review",
                        })

            # Presence / absence conflict
            if (("not present" in a_text or "was not" in a_text or "did not see" in a_text)
                    and ("was present" in b_text or "saw him" in b_text or "saw the accused" in b_text)):
                contradictions.append({
                    "evidence_a_id": a["id"],
                    "evidence_b_id": b["id"],
                    "description": "Presence/absence statements appear to conflict between the two pieces of evidence.",
                    "severity": "medium",
                    "confidence": 0.65,
                    "ai_explanation": "One statement denies presence while another asserts it. Review original wording and context carefully.",
                    "label": "AI-flagged, requires human review",
                })

    return contradictions


# ─────────────────────────────────────────────────────────────
# PART 3 — INVESTIGATION GUIDANCE AGENT
# ─────────────────────────────────────────────────────────────
def generate_guidance(
    case_title: str,
    evidence_items: List[Dict],
    contradictions: List[Dict],
) -> List[Dict]:
    """
    Checklist-style investigation guidance grounded in LEGAL_KB.
    Explicitly framed as assistant, not legal authority.
    """
    guidance: List[Dict] = []
    all_text = " ".join(
        [(e.get("raw_content") or "") + " " + (e.get("title") or "") + " " + (e.get("description") or "")
         for e in evidence_items]
    ).lower()
    all_text += " " + (case_title or "").lower()

    types_present = {e.get("evidence_type") for e in evidence_items}

    # 1. Always-on procedural checks
    if any(t in types_present for t in ("seizure", "forensic", "photo", "cctv")):
        guidance.append({
            "category": "procedural",
            "title": "Verify continuous chain of custody",
            "description": (
                "Ensure every transfer of physical or digital evidence is logged with two-person confirmation "
                "and seal / hash numbers. Unexplained gaps can be fatal at trial."
            ),
            "legal_reference": "Chain of Custody principles (Evidence Act + judicial precedents)",
            "priority": "high",
            "source_kb_id": "chain_of_custody",
        })

    if "statement" in types_present:
        guidance.append({
            "category": "procedural",
            "title": "Record / review statements under CrPC 161 formalities",
            "description": (
                "Witness statements should be recorded promptly, read over to the witness, and any later "
                "improvements or omissions noted. Statements under 161 are not on oath."
            ),
            "legal_reference": "CrPC / BNSS Section 161",
            "priority": "medium",
            "source_kb_id": "crpc_161",
        })

    # 2. Open contradictions become guidance items
    open_count = len([c for c in contradictions if c.get("status", "open") == "open"])
    if open_count or contradictions:
        guidance.append({
            "category": "gap",
            "title": f"Resolve {len(contradictions)} AI-flagged contradiction(s)",
            "description": (
                "Each AI-flagged contradiction must be confirmed or dismissed by an officer with a short note. "
                "This log demonstrates due diligence and protects the case from later challenge."
            ),
            "legal_reference": None,
            "priority": "high",
            "source_kb_id": None,
        })

    # 3. Death / autopsy gap
    death_keywords = ["death", "murder", "killed", "body", "deceased", "homicide", "dead"]
    if any(w in all_text for w in death_keywords):
        has_autopsy = "autopsy" in types_present
        if not has_autopsy:
            guidance.append({
                "category": "gap",
                "title": "Obtain post-mortem / autopsy report",
                "description": (
                    "Case involves death. Post-mortem findings (time of death, injuries, toxicology) are critical "
                    "and must be cross-referenced against the timeline and recovered weapon."
                ),
                "legal_reference": "CrPC provisions on inquest & post-mortem",
                "priority": "critical",
                "source_kb_id": "post_mortem",
            })
        else:
            guidance.append({
                "category": "next_step",
                "title": "Cross-reference autopsy with timeline and weapon",
                "description": (
                    "Run the Autopsy Analysis Agent and have a forensic medical officer review every hypothesis. "
                    "Injury pattern must be consistent with recovered weapon and witness accounts."
                ),
                "legal_reference": "CrPC provisions on inquest & post-mortem",
                "priority": "high",
                "source_kb_id": "post_mortem",
            })

    # 4. Match against LEGAL_KB
    matched = []
    for item in LEGAL_KB:
        score = sum(1 for t in item["triggers"] if t in all_text)
        if score > 0:
            matched.append((score, item))
    matched.sort(key=lambda x: -x[0])

    for score, sec in matched[:6]:
        checklist_text = ""
        if sec.get("checklist"):
            checklist_text = " Suggested checks: " + "; ".join(sec["checklist"][:3]) + "."
        guidance.append({
            "category": "next_step" if sec["category"] == "offence" else "procedural",
            "title": f"Review applicability of {sec['section']} — {sec['title']}",
            "description": (sec["text"][:260] + ("..." if len(sec["text"]) > 260 else "")) + checklist_text,
            "legal_reference": sec["section"],
            "priority": "medium" if sec["category"] == "offence" else "medium",
            "source_kb_id": sec["id"],
        })

    # 5. Chargesheet readiness hint
    if len(evidence_items) >= 3 and open_count == 0:
        guidance.append({
            "category": "next_step",
            "title": "Consider chargesheet consistency check",
            "description": (
                "Evidence volume is sufficient for a pre-filing QA pass. Run the Chargesheet Agent to surface "
                "any remaining contradictions a defense lawyer could exploit."
            ),
            "legal_reference": "CrPC / BNSS Section 173",
            "priority": "medium",
            "source_kb_id": "crpc_173",
        })

    # Deduplicate by title
    seen = set()
    unique = []
    for g in guidance:
        if g["title"] not in seen:
            seen.add(g["title"])
            unique.append(g)
    return unique


# ─────────────────────────────────────────────────────────────
# PART 3 — AUTOPSY / POST-MORTEM ANALYSIS AGENT
# ─────────────────────────────────────────────────────────────
def analyze_autopsy(
    autopsy_text: str,
    timeline_events: List[Dict],
    evidence_items: List[Dict],
) -> Dict[str, Any]:
    """
    Cross-reference post-mortem findings against the case timeline and other evidence.

    CRITICAL FRAMING (never relax this):
    Every output is an investigative hypothesis that requires forensic medical officer review.
    This agent never diagnoses cause of death and never makes a legal determination.
    """
    label = "AI-generated investigative hypothesis — requires forensic medical officer review"

    if not autopsy_text or not autopsy_text.strip():
        return {
            "label": label,
            "status": "no_autopsy_text",
            "hypotheses": [],
            "warnings": ["No autopsy / post-mortem text supplied."],
            "consistency_checks": [],
            "entities": {},
            "confidence": 0.0,
            "disclaimer": (
                "This agent does not determine cause or manner of death. "
                "All outputs are hypotheses for human medical review only."
            ),
        }

    ent = extract_entities(autopsy_text)
    text_lower = autopsy_text.lower()
    hypotheses = []
    warnings = []
    consistency_checks = []

    # Injury inventory
    if ent.get("injuries"):
        hypotheses.append({
            "type": "injury_pattern",
            "text": f"Injury indicators extracted: {', '.join(ent['injuries'])}.",
            "confidence": 0.70,
        })
    else:
        warnings.append("No clear injury descriptors extracted — full medical reading required.")

    # Weapon consistency
    weapon_mentions = ent.get("weapons") or []
    other_weapons = []
    for e in evidence_items:
        if e.get("evidence_type") in ("seizure", "forensic", "statement", "photo"):
            other_weapons.extend(extract_entities(e.get("raw_content") or e.get("description") or "").get("weapons") or [])

    if weapon_mentions or other_weapons:
        hypotheses.append({
            "type": "weapon_link",
            "text": (
                f"Autopsy weapon-related language: {weapon_mentions or 'none explicit'}. "
                f"Other evidence weapon mentions: {list(set(other_weapons)) or 'none'}."
            ),
            "confidence": 0.60,
        })
        if weapon_mentions and other_weapons:
            if set(weapon_mentions).isdisjoint(set(other_weapons)):
                warnings.append(
                    "Possible mismatch between weapon language in autopsy and weapons mentioned in other evidence. "
                    "Forensic medical officer should compare injury morphology with recovered object."
                )
                consistency_checks.append({
                    "check": "weapon_injury_alignment",
                    "result": "possible_mismatch",
                    "detail": "Autopsy and other evidence do not share common weapon terms.",
                })
            else:
                consistency_checks.append({
                    "check": "weapon_injury_alignment",
                    "result": "partial_overlap",
                    "detail": f"Shared terms: {list(set(weapon_mentions) & set(other_weapons))}",
                })

    # Time of death vs timeline
    tod_patterns = [
        r"(?:time of death|tod|estimated time of death|death occurred).*?(\d{1,2}(?::\d{2})?\s*(?:am|pm|hrs)?)",
        r"(?:between)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s+and\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)",
    ]
    tod_found = None
    for pat in tod_patterns:
        m = re.search(pat, autopsy_text, re.I)
        if m:
            tod_found = m.group(0)
            break

    if tod_found:
        hypotheses.append({
            "type": "time_of_death",
            "text": f"Estimated time-of-death language found: “{tod_found}”.",
            "confidence": 0.65,
        })
        if timeline_events:
            warnings.append(
                "Compare estimated TOD against verified CCTV / witness times on the case timeline. "
                "Clock calibration and exact wording matter."
            )
            consistency_checks.append({
                "check": "tod_vs_timeline",
                "result": "requires_manual_comparison",
                "detail": "TOD language present; officer/medical reviewer must align with timeline events.",
            })
    else:
        warnings.append("No clear time-of-death estimate extracted from the supplied text.")

    # Toxicology
    if ent.get("toxins") or "toxicology" in text_lower or "viscera" in text_lower:
        hypotheses.append({
            "type": "toxicology",
            "text": f"Toxicology-related language present: {ent.get('toxins') or 'viscera / toxicology mentioned'}.",
            "confidence": 0.55,
        })
        consistency_checks.append({
            "check": "toxicology_pending",
            "result": "flag_for_followup",
            "detail": "Ensure chemical analysis report is obtained and linked to the case file.",
        })

    # Negation of gunshot (important for consistency)
    if "no gunshot" in text_lower or "no firearm" in text_lower:
        hypotheses.append({
            "type": "negative_finding",
            "text": "Autopsy language indicates absence of gunshot / firearm injuries.",
            "confidence": 0.75,
        })

    if not hypotheses:
        hypotheses.append({
            "type": "insufficient_extraction",
            "text": "No strong structured findings extracted. Full reading by forensic medical officer is required.",
            "confidence": 0.30,
        })

    return {
        "label": label,
        "status": "analyzed",
        "hypotheses": hypotheses,
        "warnings": warnings,
        "consistency_checks": consistency_checks,
        "entities": ent,
        "confidence": 0.55,
        "disclaimer": (
            "This agent does not determine cause or manner of death. "
            "All outputs are investigative hypotheses that exist solely to flag gaps "
            "(e.g. “injury pattern may not match recovered weapon — investigate further”). "
            "A forensic medical officer must review and confirm or dismiss every item before it enters the verified record."
        ),
    }


# ─────────────────────────────────────────────────────────────
# PART 3 — CHARGESHEET CONSISTENCY / QA AGENT
# ─────────────────────────────────────────────────────────────
def run_chargesheet_qa(
    case_title: str,
    evidence_items: List[Dict],
    timeline_events: List[Dict],
    contradictions: List[Dict],
    chargesheet_text: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Pre-filing QA pass. Produces a checklist for a human legal reviewer.
    Never issues a verdict on case strength.
    """
    label = "AI-generated pre-filing QA checklist — requires human legal reviewer"
    findings = []
    risks = []
    checklist = []

    # 1. Open contradictions
    open_contras = [c for c in contradictions if c.get("status", "open") == "open"]
    if open_contras:
        risks.append({
            "severity": "high",
            "issue": f"{len(open_contras)} unresolved contradiction flag(s)",
            "recommendation": "Confirm or dismiss every open flag with a short note before filing. Defense will exploit unexplained conflicts.",
        })
        checklist.append("Resolve all open AI contradiction flags and record officer notes.")
    else:
        findings.append("No open contradiction flags remaining.")
        checklist.append("Confirm that all prior contradiction flags have been addressed.")

    # 2. Unverified timeline events
    unverified = [t for t in timeline_events if not t.get("is_verified")]
    if unverified:
        risks.append({
            "severity": "medium",
            "issue": f"{len(unverified)} timeline event(s) still marked AI-extracted / unverified",
            "recommendation": "Promote key events to verified status after officer review, or exclude them from the narrative relied upon in the chargesheet.",
        })
        checklist.append("Review and verify (or exclude) AI-extracted timeline events that the chargesheet will rely on.")
    else:
        findings.append("All current timeline events are marked verified.")

    # 3. Chain of custody
    evidence_with_hash = [e for e in evidence_items if e.get("chain_hash") or e.get("file_hash")]
    if len(evidence_with_hash) < len(evidence_items):
        risks.append({
            "severity": "high",
            "issue": "Some evidence items lack hash / chain metadata",
            "recommendation": "Complete tamper-proof logging for every item before filing.",
        })
    else:
        findings.append(f"All {len(evidence_items)} evidence items carry hash-chain metadata.")
        checklist.append("Re-run chain integrity verification and attach result to the file.")

    # 4. Death cases without autopsy
    all_text = " ".join(
        [(e.get("raw_content") or "") + " " + (e.get("title") or "") for e in evidence_items]
    ).lower() + " " + (case_title or "").lower()
    if any(w in all_text for w in ["death", "murder", "killed", "deceased", "homicide"]):
        has_autopsy = any(e.get("evidence_type") == "autopsy" for e in evidence_items)
        if not has_autopsy:
            risks.append({
                "severity": "critical",
                "issue": "Death-related case has no autopsy / post-mortem evidence logged",
                "recommendation": "Obtain and log the post-mortem report before filing. Courts expect it.",
            })
            checklist.append("Attach post-mortem report and toxicology (if any).")
        else:
            findings.append("Autopsy / post-mortem evidence is present in the file.")
            checklist.append("Ensure autopsy hypotheses have been reviewed by forensic medical officer.")

    # 5. Statement formalities
    statements = [e for e in evidence_items if e.get("evidence_type") == "statement"]
    if statements:
        checklist.append(
            f"Review {len(statements)} witness statement(s) for CrPC 161 formalities "
            "(prompt recording, read-over, note of later improvements)."
        )

    # 6. If a draft chargesheet text is supplied, run lightweight consistency scan
    if chargesheet_text:
        cs_lower = chargesheet_text.lower()
        cs_entities = extract_entities(chargesheet_text)
        # Flag if chargesheet asserts a time that conflicts with open contradictions
        for c in open_contras:
            findings.append(f"(Draft scan) Open contradiction still relevant: {c.get('description', '')[:120]}")
        if cs_entities.get("times"):
            checklist.append(
                f"Draft chargesheet mentions times {cs_entities['times'][:4]} — "
                "confirm these align with verified timeline, not merely AI-extracted events."
            )
        checklist.append("Read the draft chargesheet against the full verified evidence list one final time.")

    # 7. Standard Section 173 checklist items
    checklist.extend([
        "List of witnesses complete and contactable",
        "List of documents / material objects attached",
        "Copies of documents prepared for supply to accused",
        "Statutory timelines reviewed (where applicable)",
    ])

    overall_ready = len([r for r in risks if r["severity"] in ("critical", "high")]) == 0

    return {
        "label": label,
        "ready_for_human_review": True,
        "overall_risk_level": "high" if any(r["severity"] == "critical" for r in risks) else (
            "medium" if any(r["severity"] == "high" for r in risks) else "low"
        ),
        "findings": findings,
        "risks": risks,
        "checklist": checklist,
        "disclaimer": (
            "This is a pre-filing quality-assurance checklist for the prosecution team. "
            "It is not a verdict on case strength, guilt, or prospects of conviction. "
            "A human legal reviewer must sign off before any chargesheet is filed."
        ),
    }


# ─────────────────────────────────────────────────────────────
# ORCHESTRATOR
# ─────────────────────────────────────────────────────────────
def run_full_analysis(case: Dict, evidence_items: List[Dict]) -> Dict[str, Any]:
    timeline = build_timeline_candidates(evidence_items)
    contradictions = detect_contradictions(evidence_items, timeline)
    guidance = generate_guidance(case.get("title", ""), evidence_items, contradictions)
    return {
        "timeline": timeline,
        "contradictions": contradictions,
        "guidance": guidance,
        "disclaimer": (
            "All AI outputs are unverified hypotheses. "
            "A human officer must confirm or dismiss before any item enters the official case record."
        ),
    }


def run_autopsy_agent(case: Dict, evidence_items: List[Dict], timeline_events: List[Dict]) -> Dict[str, Any]:
    autopsy_texts = []
    for e in evidence_items:
        if e.get("evidence_type") == "autopsy":
            autopsy_texts.append(e.get("raw_content") or e.get("description") or "")
    combined = "\n\n".join(t for t in autopsy_texts if t)
    return analyze_autopsy(combined, timeline_events, evidence_items)


def run_chargesheet_agent(
    case: Dict,
    evidence_items: List[Dict],
    timeline_events: List[Dict],
    contradictions: List[Dict],
    chargesheet_text: Optional[str] = None,
) -> Dict[str, Any]:
    return run_chargesheet_qa(
        case.get("title", ""),
        evidence_items,
        timeline_events,
        contradictions,
        chargesheet_text,
    )
