"""Seed the demo case.

Creates the officers, the shift roster, the case, and the pre-loaded evidence
the pitch calls for -- leaving the on-stage pair to be uploaded live.

    python scripts/seed_demo.py [--reset]

Runs the real API routes in-process, so everything it creates is hashed,
signed, chained and audited exactly as it would be over HTTP.
"""
from __future__ import annotations

import argparse
import io
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient  # noqa: E402

from app.database import Base, engine, init_db  # noqa: E402
from app.main import app  # noqa: E402

CASE_NUMBER = "CR-2026-0042"
MG_ROAD = (12.9716, 77.5946)

CCTV_LOG = b"""CAM-07 MG ROAD JUNCTION -- FRAME INDEX
2026-08-29 21:44:10  subject enters frame from north
2026-08-29 21:47:32  subject exits east toward Brigade Road
2026-08-29 21:52:04  frame clear
"""

FIR_TEXT = (
    "Complaint received at 23:10 on 29 August 2026 from Smt. L. Menon, "
    "proprietor of Menon Electronics, MG Road. Complainant states that on "
    "returning to the shop she found the rear shutter forced and cash missing. "
    "Complainant last secured the premises at approximately 20:30 the same day."
)

FORENSIC_TEXT = (
    "Preliminary forensic examination of the rear shutter shows tool marks "
    "consistent with a flat pry bar approximately 25mm in width. Two partial "
    "latent prints lifted from the shutter frame; comparison pending."
)


def seed(reset: bool = False) -> None:
    if reset:
        Base.metadata.drop_all(bind=engine)
    init_db()
    client = TestClient(app)

    officers = {}
    for badge, name, role in [
        ("KA-1001", "Insp. Anita Rao", "INVESTIGATING_OFFICER"),
        ("KA-1002", "SI Bhaskar Nair", "SUPERVISOR"),
        ("KA-2007", "Dr. Meera Iyer", "FORENSIC_REVIEWER"),
        ("KA-3011", "APP Ravi Shankar", "LEGAL_REVIEWER"),
    ]:
        response = client.post(
            "/api/v1/officers",
            json={
                "badge_number": badge,
                "full_name": name,
                "role": role,
                "station": "MG Road PS",
            },
        )
        if response.status_code == 409:
            print(f"! {badge} already registered -- run with --reset for a clean slate")
            return
        officers[badge] = response.json()

    io_hdr = {"X-Officer-Id": str(officers["KA-1001"]["id"])}
    sup_hdr = {"X-Officer-Id": str(officers["KA-1002"]["id"])}

    # The roster that locked device metadata gets cross-checked against.
    client.post(
        f"/api/v1/officers/{officers['KA-1001']['id']}/shifts",
        headers=io_hdr,
        json={
            "started_at": "2026-08-29T18:00:00Z",
            "ended_at": "2026-08-30T06:00:00Z",
            "lat": MG_ROAD[0],
            "lon": MG_ROAD[1],
            "radius_m": 2500,
            "location_label": "MG Road PS beat",
        },
    )

    case = client.post(
        "/api/v1/cases",
        headers=io_hdr,
        json={
            "case_number": CASE_NUMBER,
            "title": "Burglary -- Menon Electronics, MG Road",
            "description": "Break-in reported 29 Aug 2026, ~23:10.",
            "station": "MG Road PS",
        },
    ).json()
    case_id = case["id"]

    def confirm(uid: str, note: str) -> None:
        client.post(
            f"/api/v1/evidence/{uid}/confirm", headers=sup_hdr, json={"note": note}
        )

    # 1. FIR / complaint
    fir = client.post(
        f"/api/v1/cases/{case_id}/evidence/text",
        headers=io_hdr,
        json={
            "evidence_type": "COMPLAINT",
            "title": "FIR / complaint of Smt. L. Menon",
            "text_content": FIR_TEXT,
            "occurred_at": "2026-08-29T23:10:00Z",
            "collected_at": "2026-08-29T23:25:00Z",
        },
    ).json()
    confirm(fir["uid"], "complaint recorded in my presence")

    # 2. CCTV frame log -- the item the on-stage statement will contradict
    cctv = client.post(
        f"/api/v1/cases/{case_id}/evidence",
        headers=io_hdr,
        files={"file": ("cam07_frameindex.txt", io.BytesIO(CCTV_LOG), "text/plain")},
        data={
            "evidence_type": "CCTV_FOOTAGE",
            "title": "CAM-07 frame index, MG Road junction",
            "description": "Subject exits frame 21:47:32.",
            "occurred_at": "2026-08-29T21:47:32Z",
            "device_metadata": json.dumps(
                {
                    "device_id": "CAM-07",
                    "device_model": "Hikvision DS-2CD",
                    "capture_timestamp": "2026-08-29T21:47:32Z",
                    "gps_lat": MG_ROAD[0],
                    "gps_lon": MG_ROAD[1],
                    "gps_accuracy_m": 5,
                }
            ),
        },
    ).json()
    confirm(cctv["uid"], "footage collected from shop owner's DVR")

    # 3. Scene photograph
    photo = client.post(
        f"/api/v1/cases/{case_id}/evidence",
        headers=io_hdr,
        files={"file": ("shutter.jpg", io.BytesIO(b"\xff\xd8\xff-demo-jpeg-bytes"), "image/jpeg")},
        data={
            "evidence_type": "PHOTO",
            "title": "Rear shutter, tool marks",
            "occurred_at": "2026-08-29T23:40:00Z",
            "device_metadata": json.dumps(
                {
                    "device_id": "PIXEL-7-KA1001",
                    "device_model": "Pixel 7",
                    "capture_timestamp": "2026-08-29T23:40:00Z",
                    "gps_lat": 12.9718,
                    "gps_lon": 77.5949,
                    "gps_accuracy_m": 8,
                }
            ),
        },
    ).json()
    confirm(photo["uid"], "photographed at the scene in my presence")

    # 4. Seized item -- two-person confirmation is mandatory here
    weapon = client.post(
        f"/api/v1/cases/{case_id}/evidence",
        headers=io_hdr,
        files={"file": ("seizure_memo.txt", io.BytesIO(b"Pry bar, 25mm, recovered 30/08 06:15"), "text/plain")},
        data={
            "evidence_type": "WEAPON",
            "title": "Seized pry bar (25mm)",
            "occurred_at": "2026-08-30T06:15:00Z",
        },
    ).json()
    confirm(weapon["uid"], "seizure witnessed at recovery")

    # 5. Left pending on purpose -- shows the confirmation queue in the UI
    forensic = client.post(
        f"/api/v1/cases/{case_id}/evidence/text",
        headers=io_hdr,
        json={
            "evidence_type": "FORENSIC_REPORT",
            "title": "Preliminary forensic examination",
            "text_content": FORENSIC_TEXT,
            "occurred_at": "2026-08-30T11:00:00Z",
        },
    ).json()

    verify = client.get(f"/api/v1/cases/{case_id}/ledger/verify", headers=io_hdr).json()
    detail = client.get(f"/api/v1/cases/{case_id}", headers=io_hdr).json()

    print("\n=== Chain of Truth -- demo case seeded ===")
    print(f"case            {CASE_NUMBER} (id={case_id})")
    print(f"evidence        {detail['evidence_counts']}")
    print(f"ledger entries  {verify['entry_count']}   head {verify['head_hash'][:16]}...")
    print(f"chain valid     {verify['valid']}")
    print("\nofficers (use as X-Officer-Id):")
    for badge, officer in officers.items():
        print(f"  {officer['id']}  {badge:<8} {officer['full_name']:<20} {officer['role']}")
    print("\npending confirmation (for the queue demo):")
    print(f"  {forensic['uid']}  {forensic['title']}")
    print("\nleft for the live demo: upload the witness statement that says the")
    print('suspect left "at about 9 PM" -- CAM-07 has them exiting at 21:47:32.')
    print("\nstart the API with:  uvicorn app.main:app --reload --port 8000\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--reset", action="store_true", help="drop all tables first")
    seed(**vars(parser.parse_args()))
