"""Layer the analysis + feature demo data on top of the Part 1 seed.

    python scripts/seed_demo.py --reset      # evidence, ledger, custody, audit
    python scripts/seed_analysis.py          # KB, AI analysis, persons, autopsy...

Run second, because it analyses whatever evidence the first script created.

Everything written here is FICTIONAL. Names, numbers, addresses and coordinates
are invented for demonstration; no real person's data appears anywhere. The
`DEMO DATA` marker on the case description keeps that visible in the UI itself,
which matters when the screen is on a projector.
"""
from __future__ import annotations

import argparse
import json
import sys
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select  # noqa: E402

from app.core.canonical import utc_now_iso  # noqa: E402
from app.database import SessionLocal, init_db  # noqa: E402
from app.models import Case, Evidence, User  # noqa: E402
from app.models_analysis import Person, PersonRelationship  # noqa: E402
from app.models_features import (  # noqa: E402
    AutopsyFinding,
    AutopsyHypothesis,
    AutopsyReport,
    Chargesheet,
    ChargesheetFinding,
    CorrelationFinding,
    EvidenceGap,
    LocationPoint,
    LocationScore,
    PhoneRecord,
    SimilarityMatch,
    StatementDiff,
    StatementVersion,
)
from app.rag import store as rag_store  # noqa: E402
from app.services import ai_engine, analysis  # noqa: E402

MG_ROAD = (12.9716, 77.5946)


def _uid() -> str:
    return str(uuid.uuid4())


def seed_kb(db) -> int:
    """Index the curated BNS/CrPC knowledge base for guidance retrieval."""
    count = 0
    for entry in ai_engine.LEGAL_KB:
        if rag_store.index_kb_entry(db, entry) is not None:
            count += 1
    db.commit()
    return count


def seed_persons(db, case: Case) -> dict[str, Person]:
    now = utc_now_iso()
    spec = [
        ("Ramesh Kumar", "WITNESS", False, {"age": 41, "phone": "9876500011"}),
        ("Sunil Verma", "SUSPECT", False, {"age": 34, "alias": "Sunny"}),
        ("Anand Pillai", "VICTIM", True, {"age": 38}),
        ("Lakshmi Pillai", "FAMILY", True, {"age": 35, "phone": "9876500022"}),
        ("Dr. Meera Iyer", "DOCTOR", False, {"age": 47}),
    ]
    made: dict[str, Person] = {}
    for name, ptype, protected, extra in spec:
        existing = db.execute(
            select(Person).where(Person.case_id == case.id, Person.full_name == name)
        ).scalar_one_or_none()
        if existing is not None:
            made[ptype] = existing
            continue
        p = Person(
            uid=_uid(),
            case_id=case.id,
            full_name=name,
            person_type=ptype,
            is_protected=protected,
            created_at=now,
            **extra,
        )
        db.add(p)
        made[ptype] = p
    db.flush()

    if "VICTIM" in made and "FAMILY" in made:
        db.add(
            PersonRelationship(
                case_id=case.id,
                from_person_id=made["FAMILY"].id,
                to_person_id=made["VICTIM"].id,
                relationship_type="SPOUSE",
                tree="FAMILY",
                verification_status="VERIFIED",
                created_at=now,
            )
        )
    db.commit()
    return made


def seed_locations(db, case: Case) -> None:
    now = utc_now_iso()
    if db.execute(
        select(LocationPoint).where(LocationPoint.case_id == case.id)
    ).first():
        return

    points = [
        ("MG Road market entrance", "EVIDENCE_GPS", 12.9716, 77.5946, "2026-08-29T21:00:00Z", 0.9),
        ("CCTV cam 4 - MG Road junction", "CCTV", 12.9722, 77.5951, "2026-08-29T21:47:00Z", 0.95),
        ("CCTV cam 9 - Brigade cross", "CCTV", 12.9748, 77.6011, "2026-08-29T21:58:00Z", 0.95),
        ("Tower ping - Shivajinagar", "PHONE_TOWER", 12.9840, 77.6050, "2026-08-29T22:05:00Z", 0.6),
        ("Witness sighting - bus stand", "WITNESS_SIGHTING", 12.9790, 77.6075, "2026-08-29T22:12:00Z", 0.45),
        ("Recovery point - storm drain", "EVIDENCE_GPS", 12.9805, 77.6098, "2026-08-30T07:30:00Z", 0.9),
    ]
    for label, ptype, lat, lon, when, reliability in points:
        db.add(
            LocationPoint(
                uid=_uid(), case_id=case.id, label=label, point_type=ptype,
                lat=lat, lon=lon, occurred_at=when, source_reliability=reliability,
                verification_status="VERIFIED" if reliability >= 0.9 else "AI_EXTRACTED_UNVERIFIED",
                created_at=now,
            )
        )

    # Rule-based region scores. `factors` carries the arithmetic so the UI can
    # answer "why 0.78?" instead of showing an unexplained number.
    regions = [
        ("Shivajinagar corridor", 12.9840, 77.6050, 700, 0.78, 1, [
            {"factor": "Recency of last signal", "weight": 0.35, "value": 0.90, "contribution": 0.315,
             "detail": "Tower ping at 22:05, most recent reliable signal"},
            {"factor": "Source reliability", "weight": 0.30, "value": 0.60, "contribution": 0.180,
             "detail": "Phone tower: coarse (approx 500m), medium trust"},
            {"factor": "Corroboration", "weight": 0.20, "value": 0.85, "contribution": 0.170,
             "detail": "Witness sighting 7 min later, 300m away"},
            {"factor": "Direction of travel", "weight": 0.15, "value": 0.77, "contribution": 0.116,
             "detail": "Consistent northeast movement from CCTV 4 -> 9"},
        ]),
        ("Brigade cross vicinity", 12.9748, 77.6011, 500, 0.61, 2, [
            {"factor": "Recency of last signal", "weight": 0.35, "value": 0.70, "contribution": 0.245,
             "detail": "CCTV hit at 21:58"},
            {"factor": "Source reliability", "weight": 0.30, "value": 0.95, "contribution": 0.285,
             "detail": "CCTV: high trust, precise location"},
            {"factor": "Corroboration", "weight": 0.20, "value": 0.30, "contribution": 0.060,
             "detail": "No independent second source at this point"},
            {"factor": "Direction of travel", "weight": 0.15, "value": 0.15, "contribution": 0.022,
             "detail": "Subject moved on; transit point rather than destination"},
        ]),
        ("MG Road market", 12.9716, 77.5946, 400, 0.34, 3, [
            {"factor": "Recency of last signal", "weight": 0.35, "value": 0.20, "contribution": 0.070,
             "detail": "Origin point at 21:00, over an hour before last signal"},
            {"factor": "Source reliability", "weight": 0.30, "value": 0.90, "contribution": 0.270,
             "detail": "Evidence GPS + CCTV, high trust"},
            {"factor": "Corroboration", "weight": 0.20, "value": 0.00, "contribution": 0.000,
             "detail": "No return signal recorded"},
            {"factor": "Direction of travel", "weight": 0.15, "value": 0.00, "contribution": 0.000,
             "detail": "Movement is away from this point"},
        ]),
    ]
    for label, lat, lon, radius, score, rank, factors in regions:
        db.add(
            LocationScore(
                uid=_uid(), case_id=case.id, label=label,
                center_lat=lat, center_lon=lon, radius_m=radius,
                score=score, rank=rank, factors=json.dumps(factors),
                method="rule_based_v1", computed_at=now,
            )
        )
    db.commit()


def seed_phone_and_correlation(db, case: Case, persons: dict[str, Person]) -> None:
    now = utc_now_iso()
    if db.execute(select(PhoneRecord).where(PhoneRecord.case_id == case.id)).first():
        return

    suspect = persons.get("SUSPECT")
    records = [
        ("98765XXXX1", "98765XXXX7", "OUTGOING", "2026-08-29T21:52:00Z", 47, 12.9748, 77.6011, "Brigade cross tower"),
        ("98765XXXX1", None, "TOWER_PING", "2026-08-29T22:05:00Z", None, 12.9840, 77.6050, "Shivajinagar tower"),
        ("98765XXXX1", "98765XXXX7", "SMS", "2026-08-29T22:18:00Z", None, 12.9840, 77.6050, "Shivajinagar tower"),
    ]
    for msisdn, other, rtype, when, dur, lat, lon, tower in records:
        db.add(
            PhoneRecord(
                uid=_uid(), case_id=case.id,
                person_id=suspect.id if suspect else None,
                msisdn_masked=msisdn, counterparty_masked=other,
                record_type=rtype, occurred_at=when, duration_s=dur,
                tower_lat=lat, tower_lon=lon, tower_label=tower, created_at=now,
            )
        )

    findings = [
        ("Phone tower agrees with CCTV at 21:52",
         "Outgoing call routed via Brigade cross tower at 21:52, six minutes before CCTV camera 9 "
         "recorded the subject at the same junction. Independent sources agree.",
         "PHONE_VS_CCTV", "AGREES", 0.86, "2026-08-29T21:52:00Z"),
        ("Tower ping conflicts with witness sighting location",
         "Tower ping at 22:05 places the handset near Shivajinagar. A witness places the subject at "
         "the bus stand at 22:12, roughly 300m away. Within tower error margin, but worth confirming.",
         "PHONE_VS_WITNESS", "UNCERTAIN", 0.54, "2026-08-29T22:05:00Z"),
    ]
    for title, desc, ctype, agreement, conf, when in findings:
        db.add(
            CorrelationFinding(
                uid=_uid(), case_id=case.id, title=title, description=desc,
                correlation_type=ctype, agreement=agreement, confidence=conf,
                occurred_at=when, created_at=now,
            )
        )
    db.commit()


def seed_statements(db, case: Case, persons: dict[str, Person]) -> None:
    now = utc_now_iso()
    witness = persons.get("WITNESS")
    if witness is None:
        return
    if db.execute(
        select(StatementVersion).where(StatementVersion.person_id == witness.id)
    ).first():
        return

    v1 = StatementVersion(
        uid=_uid(), case_id=case.id, person_id=witness.id, version=1,
        recorded_at="2026-08-30T09:15:00Z", language="en",
        content=(
            "I was closing my shop. I saw the man leave at about 9:00 PM. "
            "He was walking normally towards the main road. I did not see anyone with him."
        ),
        created_at=now,
    )
    v2 = StatementVersion(
        uid=_uid(), case_id=case.id, person_id=witness.id, version=2,
        recorded_at="2026-09-01T11:40:00Z", language="en",
        content=(
            "I was closing my shop. I saw the man leave at around 9:45 PM, maybe later. "
            "He was walking quickly towards the main road. There was another person with him."
        ),
        created_at=now,
    )
    db.add_all([v1, v2])
    db.flush()

    diffs = [
        ("TIME_CHANGED", "departure time", "about 9:00 PM", "around 9:45 PM, maybe later", "MAJOR",
         "Stated departure time moved 45 minutes later between the first and second interview. "
         "This is an investigative flag for follow-up, not a finding that the witness is unreliable."),
        ("DETAIL_ADDED", "companion", "I did not see anyone with him", "There was another person with him", "MAJOR",
         "Second interview adds a companion not mentioned in the first. New detail may reflect "
         "recovered memory or influence; confirm by re-interview with the original recording available."),
        ("DESCRIPTION_CHANGED", "manner of walking", "walking normally", "walking quickly", "MINOR",
         "Description of gait changed. Minor on its own; noted because it accompanies other changes."),
    ]
    for ctype, field, before, after, sig, expl in diffs:
        db.add(
            StatementDiff(
                uid=_uid(), case_id=case.id, person_id=witness.id,
                from_version_id=v1.id, to_version_id=v2.id,
                change_type=ctype, field=field, before_text=before, after_text=after,
                significance=sig, explanation=expl, confidence=0.88,
                status="REQUIRES_REVIEW", created_at=now,
            )
        )
    db.commit()


def seed_autopsy(db, case: Case, persons: dict[str, Person]) -> None:
    now = utc_now_iso()
    if db.execute(select(AutopsyReport).where(AutopsyReport.case_id == case.id)).first():
        return

    report = AutopsyReport(
        uid=_uid(), case_id=case.id,
        deceased_person_id=persons["VICTIM"].id if "VICTIM" in persons else None,
        examined_at="2026-08-30T11:00:00Z", examiner_name="Dr. Meera Iyer (FMT)",
        estimated_tod_earliest="2026-08-29T21:30:00Z",
        estimated_tod_latest="2026-08-29T23:30:00Z",
        toxicology="No ethanol detected. No common sedatives detected. Screening negative.",
        summary=(
            "Adult male. Single penetrating injury to the left thorax. "
            "Two superficial incised wounds on the right forearm consistent with defence. "
            "Estimated time of death 21:30-23:30 based on rigor, livor and body temperature."
        ),
        created_at=now,
    )
    db.add(report)
    db.flush()

    findings = [
        ("thorax_left", "Left thorax", "organs", "PENETRATING_INJURY",
         "Single penetrating wound, 3.2 cm depth, downward track, between ribs 5 and 6.", "CRITICAL"),
        ("forearm_right", "Right forearm", "external", "INCISED_WOUND",
         "Two superficial incised wounds, 2-4 cm, consistent with defensive posture.", "MAJOR"),
        ("hand_right", "Right hand", "external", "ABRASION",
         "Minor abrasions across knuckles.", "MINOR"),
    ]
    finding_rows = []
    for region_id, label, layer, ftype, desc, severity in findings:
        f = AutopsyFinding(
            uid=_uid(), case_id=case.id, report_id=report.id,
            region_id=region_id, region_label=label, layer=layer,
            finding_type=ftype, description=desc, severity=severity,
            is_examiner_recorded=True, created_at=now,
        )
        db.add(f)
        finding_rows.append(f)
    db.flush()

    hypotheses = [
        ("Estimated time of death is consistent with the CCTV timeline",
         "The 21:30-23:30 window recorded by the examiner encompasses the 21:47 CCTV sighting.",
         "The examiner's window and the CCTV timestamp do not conflict. No timeline contradiction arises "
         "from the post-mortem findings on their own.",
         "TIMELINE_CONSISTENCY", 0.81, None),
        ("Defensive wounds suggest the victim was conscious and facing the assailant",
         "Incised wounds on the right forearm are in a distribution often associated with defence.",
         "This bears on whether the encounter was sudden or preceded by a struggle, which is an "
         "investigative question. It is not a determination of intent or of manner of death.",
         "MECHANISM", 0.66, 1),
        ("Recovered weapon dimensions require comparison against wound track",
         "Wound track is 3.2 cm deep with a downward angle. The seized knife has not yet been "
         "measured against this.",
         "Flagging a comparison that has not been performed. This identifies an investigation gap; "
         "it does not assert that the weapon does or does not match.",
         "WEAPON_CONSISTENCY", 0.59, 0),
    ]
    for title, hyp, reasoning, htype, conf, finding_idx in hypotheses:
        db.add(
            AutopsyHypothesis(
                uid=_uid(), case_id=case.id, report_id=report.id,
                finding_id=finding_rows[finding_idx].id if finding_idx is not None else None,
                title=title, hypothesis=hyp, reasoning=reasoning,
                hypothesis_type=htype, confidence=conf,
                disclaimer=AutopsyHypothesis.DISCLAIMER,
                status="AI_HYPOTHESIS", created_at=now,
            )
        )
    db.commit()


def seed_chargesheet(db, case: Case) -> None:
    now = utc_now_iso()
    if db.execute(select(Chargesheet).where(Chargesheet.case_id == case.id)).first():
        return

    cs = Chargesheet(
        uid=_uid(), case_id=case.id, title=f"Draft chargesheet - {case.case_number}",
        draft_text=(
            "The accused was last seen with the deceased at MG Road market at 21:00 hrs on "
            "29 August 2026. CCTV establishes departure at 21:47 hrs. The weapon recovered on "
            "30 August 2026 is the weapon used. The accused had no injuries."
        ),
        status="DRAFT", created_at=now,
    )
    db.add(cs)
    db.flush()

    findings = [
        ("Accused last seen with deceased at MG Road market at 21:00 hrs", "CONFLICT",
         "The witness statement gives 21:00 but CCTV metadata gives 21:47. This 47-minute discrepancy "
         "is unresolved in the case record and is the first thing a defence lawyer will test.", 0.88),
        ("CCTV establishes departure at 21:47 hrs", "PASS",
         "Supported by CCTV camera 4 metadata, which is hash-verified in the ledger.", 0.93),
        ("The weapon recovered is the weapon used", "MISSING_SUPPORT",
         "No forensic comparison between the recovered knife and the wound track is on file. "
         "The autopsy agent has flagged this same gap.", 0.90),
        ("The accused had no injuries", "WARNING",
         "No medical examination record for the accused is attached. The claim may be true but is "
         "currently unsupported by any document in the case.", 0.74),
    ]
    for claim, verdict, expl, conf in findings:
        db.add(
            ChargesheetFinding(
                uid=_uid(), case_id=case.id, chargesheet_id=cs.id,
                claim=claim, verdict=verdict, explanation=expl, confidence=conf,
                status="OPEN", created_at=now,
            )
        )
    db.commit()


def seed_gaps_and_similarity(db, case: Case) -> None:
    now = utc_now_iso()
    if not db.execute(select(EvidenceGap).where(EvidenceGap.case_id == case.id)).first():
        gaps = [
            ("Weapon-to-wound forensic comparison not on file", "FORENSIC", "MAJOR",
             "Submit the seized knife and the post-mortem wound measurements for comparison.",
             "Recovered weapon exists and wound track is documented, but no comparison report links them."),
            ("No medical examination record for the accused", "MEDICAL", "MAJOR",
             "Obtain a medical examination report for the accused.",
             "The draft chargesheet asserts the accused had no injuries with nothing on file to support it."),
            ("Second witness at the bus stand not formally recorded", "STATEMENT", "MINOR",
             "Record a formal statement from the bus stand witness.",
             "A sighting is referenced in the location data with no corresponding statement."),
        ]
        for title, gtype, severity, action, desc in gaps:
            db.add(
                EvidenceGap(
                    uid=_uid(), case_id=case.id, title=title, description=desc,
                    gap_type=gtype, severity=severity, suggested_action=action,
                    status="OPEN", created_at=now,
                )
            )

    if not db.execute(select(SimilarityMatch).where(SimilarityMatch.case_id == case.id)).first():
        matches = [
            ("CR-2026-0018", "Assault near Brigade Road", 0.71,
             ["late-evening timing", "commercial district", "single edged weapon", "defensive wounds"],
             "Four method features overlap. Similarity indicates a pattern worth checking - it is not "
             "evidence that the same person is responsible."),
            ("CR-2025-0391", "Robbery with injury, Shivajinagar", 0.58,
             ["same locality", "knife used", "victim approached from behind"],
             "Three features overlap, including locality. Weaker match; listed for completeness."),
        ]
        for num, title, score, feats, expl in matches:
            db.add(
                SimilarityMatch(
                    uid=_uid(), case_id=case.id, matched_case_number=num,
                    matched_case_title=title, similarity_score=score,
                    matched_features=json.dumps(feats), explanation=expl,
                    method="feature_overlap_v1", created_at=now,
                )
            )
    db.commit()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--case", default=None, help="case number (default: first case)")
    args = parser.parse_args()

    init_db()
    with SessionLocal() as db:
        if args.case:
            case = db.execute(
                select(Case).where(Case.case_number == args.case)
            ).scalar_one_or_none()
        else:
            case = db.execute(select(Case).order_by(Case.id)).scalars().first()

        if case is None:
            print("No case found. Run `python scripts/seed_demo.py --reset` first.")
            return 1

        print(f"Seeding analysis data for {case.case_number} - {case.title}")

        n = seed_kb(db)
        print(f"  legal KB          : {n} curated rules indexed")

        persons = seed_persons(db, case)
        print(f"  persons           : {len(persons)} (victim/family marked protected)")

        seed_locations(db, case)
        seed_phone_and_correlation(db, case, persons)
        seed_statements(db, case, persons)
        seed_autopsy(db, case, persons)
        seed_chargesheet(db, case)
        seed_gaps_and_similarity(db, case)
        print("  locations, phone records, statements, autopsy, chargesheet, gaps, similarity: done")

        actor = db.execute(select(User).order_by(User.id)).scalars().first()
        evidence = list(
            db.execute(select(Evidence).where(Evidence.case_id == case.id)).scalars()
        )
        print(f"  running AI pipeline over {len(evidence)} evidence items...")
        for ev in evidence:
            analysis.analyze_evidence(db, case=case, evidence=ev, actor=actor)
        db.commit()

    print("\nDone. Demo data is fictional and marked as such in the UI.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
