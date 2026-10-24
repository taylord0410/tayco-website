#!/usr/bin/env python3
"""
scripts/seed-coherent-console.py
Idempotent SQLite seeder for TAYCO ERP & Auth consoles.
Fulfills strict governance:
- Preserves all 19 project IDs and 42 document IDs (and viewerDocumentId / sourceSha256).
- Zero invoice and purchase_order records.
- Coherent October 2026 states (overdue vs pending_company_info).
- Complete modules (estimate, lead, proposal, vendor, bid, corporate_meeting, followup, note, change, hours, team, compliance, monthly_management_estimates).
- Syncs both .data/review-takeoff-populated-20261023/erp.sqlite AND .data/tayco-erp.sqlite.
- Syncs takeoff_measurement_* tables.
- Ensures admin + 3h guest user in both auth databases without deleting existing sessions or users.
"""

import os
import sys
import json
import sqlite3
import uuid
from datetime import datetime, timezone

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
POPULATED_DIR = os.path.join(BASE_DIR, ".data", "review-takeoff-populated-20261023")
TAYCO_DATA_DIR = os.path.join(BASE_DIR, ".data")

POPULATED_ERP = os.path.join(POPULATED_DIR, "erp.sqlite")
TAYCO_ERP = os.path.join(TAYCO_DATA_DIR, "tayco-erp.sqlite")

POPULATED_AUTH = os.path.join(POPULATED_DIR, "auth.sqlite")
TAYCO_AUTH = os.path.join(TAYCO_DATA_DIR, "tayco-auth.sqlite")

TENANT_ID = "tayco_llc"
ADMIN_USER_ID = "695937b9-780c-4046-b087-0e40687f0d4e"
ADMIN_EMAIL = "randolfjoan@gmail.com"
ADMIN_PW_HASH = "scrypt$32768$8$3$66e5c008ed6814a3fb26d41d7664a10a$3ffc0531bec8de27a6ac24df22c655c718f4b7f3f4390e4ed750ee2ff98013f041916617496bcf7533bca9888f8c9f4d2710cf51b47c53f8fcfda8358f2ef533"

GUEST_USER_ID = "c2ec34c7-2a74-4e3b-a55d-f84d685883bb"
GUEST_EMAIL = "guest@tayco.test"
GUEST_PW_HASH = "scrypt$32768$8$3$f50fb3f7a35171ce77a551da78d6fe49$cb8796e49bf5691ceccfcde9717d5066df0f499c2a2d0fb63b302139aa2bda7c13b19b9ad327930bbc10fa70e4f2d58186d5179d4020f34ac710b6ef147af860"

def get_db(path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    conn = sqlite3.connect(path)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=OFF")
    return conn

def sync_schema_from(src_conn, dst_conn):
    tables = [r[0] for r in src_conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").fetchall()]
    for tbl in tables:
        src_sql_row = src_conn.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name=?", (tbl,)).fetchone()
        if not src_sql_row or not src_sql_row[0]:
            continue
        src_sql = src_sql_row[0]
        dst_row = dst_conn.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name=?", (tbl,)).fetchone()
        if not dst_row:
            dst_conn.execute(src_sql)
        else:
            if src_sql.strip() != dst_row[0].strip():
                print(f"Table {tbl} schema definition mismatch. Updating in dst...")
                existing_rows = dst_conn.execute(f"SELECT * FROM {tbl}").fetchall()
                dst_conn.execute(f"DROP TABLE {tbl}")
                dst_conn.execute(src_sql)
                if existing_rows:
                    cols = [c[1] for c in dst_conn.execute(f"PRAGMA table_info({tbl})").fetchall()]
                    if len(existing_rows[0]) == len(cols):
                        try:
                            placeholders = ",".join(["?"] * len(cols))
                            dst_conn.executemany(f"INSERT INTO {tbl} VALUES({placeholders})", existing_rows)
                        except Exception as e:
                            print(f"Could not restore rows for {tbl}: {e}")
    triggers = [r[0] for r in src_conn.execute("SELECT sql FROM sqlite_master WHERE type='trigger' AND sql IS NOT NULL").fetchall()]
    for trg_sql in triggers:
        try:
            dst_conn.execute(trg_sql)
        except Exception:
            pass

def seed_database():
    print(f"Connecting to source ERP: {POPULATED_ERP}")
    p_conn = get_db(POPULATED_ERP)

    # 1. Inspect existing 19 projects & 42 documents
    raw_projects = p_conn.execute("SELECT id, tenant_id, owner_id, version, created_at, updated_at, payload FROM records WHERE kind='project'").fetchall()
    raw_docs = p_conn.execute("SELECT id, project_id, owner_id, version, created_at, updated_at, payload FROM records WHERE kind='document'").fetchall()

    print(f"Found {len(raw_projects)} projects and {len(raw_docs)} documents in populated ERP.")

    # Group documents by project
    proj_docs = {}
    for d_id, p_id, owner_id, ver, c_at, u_at, payload_str in raw_docs:
        d = json.loads(payload_str)
        proj_docs.setdefault(p_id, []).append({
            "id": d_id,
            "name": d.get("name", "Document.pdf"),
            "viewerDocumentId": d.get("viewerDocumentId"),
            "sourceSha256": d.get("sourceSha256", "0" * 64)
        })

    # The 8 Overdue projects mapping
    overdue_definitions = {
        "takeoff-project-407f145f0c80530677758d1fb3da7a6a52ac0e94b0ee29f826624047c4352c3b": {
            "name": "Kroger Store — Greenfield, IN (J-752 / J552)",
            "client": "Healy Construction Services, Inc.",
            "location": "Greenfield, IN",
            "deadline": "2026-10-09",
            "progress": 75,
            "budget": 840000.00,
            "directCost": 710000.00,
            "slug": "kroger_greenfield_j552"
        },
        "takeoff-project-f948318444fa3e16e634fdc0a28aeb42f5976473824e9d2acaaf61487274f702": {
            "name": "Dutch Bros IL0403",
            "client": "CDO Group Inc",
            "location": "Mt Prospect, IL",
            "deadline": "2026-10-16",
            "progress": 80,
            "budget": 620000.00,
            "directCost": 525000.00,
            "slug": "dutch_bros_il0403"
        },
        "takeoff-project-cf1d2246a4f00215d6300eeff6eabcc8424bb127976bc74656afb0379cb94bc7": {
            "name": "Davenport, IA — DT #10766",
            "client": "Sun Industrial Inc",
            "location": "Davenport, IA",
            "deadline": "2026-10-19",
            "progress": 65,
            "budget": 485000.00,
            "directCost": 410000.00,
            "slug": "davenport_10766"
        },
        "takeoff-project-35193cae13b26d92b2b23fdf98b86d823ac2c2ada4fc62abad8629a985a59112": {
            "name": "Benjamin Center — specifications",
            "client": "Bear Construction Company",
            "location": "Shorewood, WI",
            "deadline": "2026-10-19",
            "progress": 55,
            "budget": 790000.00,
            "directCost": 665000.00,
            "slug": "benjamin_center"
        },
        "takeoff-project-90668401b4540e3e5202b253a59d1fc9864ecac574a0dc3a8828a3ab50398a92": {
            "name": "Freeway Insurance #8262 — Belvidere, IL (State St)",
            "client": "GLR, Inc.",
            "location": "Belvidere, IL",
            "deadline": "2026-10-09",
            "progress": 85,
            "budget": 245000.00,
            "directCost": 205000.00,
            "slug": "freeway_insurance_8262_belvidere"
        },
        "takeoff-project-d8ea5ac5c3d47d3dd9e29b8e638b766273cebbb7092778ba9515b4c08d573b1e": {
            "name": "Cresco Labs — GlowUp Rollout, IL (ITB)",
            "client": "GLR, Inc.",
            "location": "South Beloit, Rockford, Chicago (Wrigleyville) y Danville, IL",
            "deadline": "2026-10-08",
            "progress": 85,
            "budget": 1420000.00,
            "directCost": 1210000.00,
            "slug": "cresco_labs_glowup_rollout_il"
        },
        "takeoff-project-66e108df849998632dcf7f4e6e3525d4d0f488bb177479393a36eb925d970edd": {
            "name": "Mission Pet Health — Livewell Animal Hospital, Westfield, IN",
            "client": "Healy Construction Services, Inc.",
            "location": "Westfield, IN",
            "deadline": "2026-10-16",
            "progress": 60,
            "budget": 590000.00,
            "directCost": 498000.00,
            "slug": "mission_pet_livewell_westfield_in"
        },
        "takeoff-project-96726a630ca0da618d98b936a8567f325a957a57342338c0cae1222bbab6a345": {
            "name": "Venice Grocery Market / Retail Building",
            "client": "Wright Building Systems",
            "location": "Venice, IL",
            "deadline": "2026-10-19",
            "progress": 50,
            "budget": 710000.00,
            "directCost": 595000.00,
            "slug": "venice_grocery"
        }
    }

    # The 11 Pending Company Info projects mapping
    pending_definitions = {
        "takeoff-project-cea43b7cd3e55f8ae3c44fffe9fd51686b7fa81fe9ef7c90043adc0646cb78e4": {
            "name": "TMAD 490 — Normal, IL",
            "client": "PKC Construction Co.",
            "location": "Normal, IL",
            "progress": 35,
            "budget": 360000.00,
            "directCost": 305000.00,
            "slug": "tmad_490_normal_il"
        },
        "takeoff-project-f4feef694d2db8d8eb3d913b06fffcf685b69bac2073a9eb49d0773d144a4079": {
            "name": "CLC IDF Room — IMEG",
            "client": "The KEO Group - Illinois",
            "location": "Grayslake, IL",
            "progress": 28,
            "budget": 215000.00,
            "directCost": 182000.00,
            "slug": "clc_idf_room_imeg"
        },
        "takeoff-project-59b2f7bb0cc500f99fe4e8e278f715b6a86edcd6e4a56b2a1be0ea06f28339da": {
            "name": "Foot Locker #7091 — Mishawaka, IN",
            "client": "GLR, Inc.",
            "location": "Mishawaka, IN",
            "progress": 38,
            "budget": 540000.00,
            "directCost": 458000.00,
            "slug": "foot_locker_7091_mishawaka"
        },
        "takeoff-project-19f78f8e9e412b6bcf1f843cbdbcf9dc5388662ff17086cfc247ea1b1d71f6be": {
            "name": "CF Melrose Park, IL",
            "client": "Bear Construction Company",
            "location": "Melrose Park, IL",
            "progress": 22,
            "budget": 490000.00,
            "directCost": 415000.00,
            "slug": "cf_melrose_park_il"
        },
        "takeoff-project-4b24b66c85455ff05abba4381916183c6dd17f7abbc94553796fc9a1eda5d633": {
            "name": "Mendocino Farms — Naperville, IL (192 W Gartner Rd; RS2425-0063)",
            "client": "CDO Group Inc",
            "location": "Naperville, IL",
            "progress": 32,
            "budget": 875000.00,
            "directCost": 740000.00,
            "slug": "mendocino_farms_naperville_il"
        },
        "takeoff-project-5d2b9cfe5fbda44b9ef570180a9808189f6eec88f7b75f5893941e912f4a9587": {
            "name": "Cuba Township — 25-023",
            "client": "Sun Industrial Inc",
            "location": "Barrington, IL",
            "progress": 18,
            "budget": 310000.00,
            "directCost": 260000.00,
            "slug": "cuba_township_25_023"
        },
        "takeoff-project-88a66333b5ee88f5c6f949c18d5de3b09823aaa09e9dc38d678994c78cd24fc6": {
            "name": "Handel's Ice Cream — Zionsville, IN",
            "client": "Healy Construction Services, Inc.",
            "location": "Zionsville, IN",
            "progress": 25,
            "budget": 430000.00,
            "directCost": 365000.00,
            "slug": "handel_zionsville_in"
        },
        "takeoff-project-8e173d64ab43955901dcbba3d4a648ab0d578a566eb94ea82092dc8c6e6312dd": {
            "name": "Millis Transfer — Richfield, WI (2026-045)",
            "client": "Bear Construction Company",
            "location": "Richfield, WI",
            "progress": 20,
            "budget": 680000.00,
            "directCost": 575000.00,
            "slug": "millis_transfer_richfield_2026_045"
        },
        "takeoff-project-d1fc25b7523ccf021e32bdcbd4a3133bb4837e334e89d5f1b6003b00bc5c1177": {
            "name": "Goddard — Burr Ridge",
            "client": "Wright Building Systems",
            "location": "Burr Ridge, IL",
            "progress": 30,
            "budget": 740000.00,
            "directCost": 625000.00,
            "slug": "goddard_burr_ridge"
        },
        "takeoff-project-c5276df0d0e5f53f817dcded341bab1157998059e90aaa194ce66ac080f189fe": {
            "name": "Project #11111 — Current Conformed Set",
            "client": "The KEO Group - Illinois",
            "location": "Chicago, IL",
            "progress": 35,
            "budget": 920000.00,
            "directCost": 780000.00,
            "slug": "conformed_set_11111"
        },
        "takeoff-project-35f87cf6a72cdba892d1815d2dff2f9e7d50e662a83d630870480dd8fa8d2ce1": {
            "name": "Received PDF sources - identity review",
            "client": "PKC Construction Co.",
            "location": "Chicago, IL",
            "progress": 15,
            "budget": 195000.00,
            "directCost": 165000.00,
            "slug": "received_artemis_pdf_review_20261024"
        }
    }

    # Clean non-project, non-document records to re-seed cleanly and idempotently
    print("Purging prior generated module records in populated ERP (keeping 19 projects and 42 documents)...")
    p_conn.execute("DELETE FROM records WHERE kind NOT IN ('project', 'document')")
    p_conn.execute("DELETE FROM records WHERE kind IN ('invoice', 'purchase_order')")

    now_iso = "2026-10-24T12:00:00.000Z"

    # Update the 19 projects with coherent October 2026 states
    print("Updating 19 projects with coherent October 2026 state...")
    all_project_meta = {}

    for p_id, tenant_id, owner_id, version, created_at, updated_at, payload_str in raw_projects:
        d = json.loads(payload_str)
        is_overdue = p_id in overdue_definitions
        meta = overdue_definitions[p_id] if is_overdue else pending_definitions[p_id]
        all_project_meta[p_id] = meta

        d["name"] = meta["name"]
        d["location"] = meta["location"]
        d["client"] = meta["client"]
        d["clientName"] = meta["client"]
        d["budgetUsd"] = meta["budget"]
        d["budgetSource"] = "Board Resolution & Client Approved Scope" if is_overdue else "Preliminary Estimating Baseline"
        d["budgetApprovedOn"] = "2026-10-02" if is_overdue else "2026-10-05"
        d["budgetUpdatedAt"] = "2026-10-05T12:00:00.000Z"
        d["progress"] = meta["progress"]
        d["reportingPeriod"] = "2026-10"
        d["reviewPeriod"] = "2026-10"
        d["period"] = "2026-10"
        d["sourceProjectSlug"] = meta["slug"]

        if is_overdue:
            d["status"] = "overdue"
            d["operationalState"] = "overdue"
            d["statusNote"] = "Vencido — Plazo de entrega de octubre cumplido"
            d["plannedStart"] = "2026-10-01"
            d["plannedEnd"] = meta["deadline"]
            d["nextAction"] = f"Revisar oferta comercial y gestionar prórroga con {meta['client']} (Venció: {meta['deadline']})"
            
            # Commercial progress - valid in commercial-stages AND guest console
            d["commercialProgress"] = {
                "currentStage": "estimate_provided",
                "stageLabel": "proposal_submitted",
                "source": "Formal estimate and proposal submitted in October 2026",
                "occurredOn": "2026-10-18",
                "reportedCompletedStages": ["contacted", "meeting_scheduled"],
                "actorId": ADMIN_USER_ID,
                "recordedAt": "2026-10-18T15:00:00.000Z",
                "updatedAt": "2026-10-18T15:00:00.000Z",
                "history": [
                    {
                        "currentStage": "contacted",
                        "source": "Commercial kickoff and scope intake",
                        "occurredOn": "2026-10-02",
                        "reportedCompletedStages": [],
                        "actorId": ADMIN_USER_ID,
                        "recordedAt": "2026-10-02T10:00:00.000Z"
                    },
                    {
                        "currentStage": "meeting_scheduled",
                        "source": "Pre-bid technical walkthrough",
                        "occurredOn": "2026-10-05",
                        "reportedCompletedStages": ["contacted"],
                        "actorId": ADMIN_USER_ID,
                        "recordedAt": "2026-10-05T14:00:00.000Z"
                    },
                    {
                        "currentStage": "estimate_provided",
                        "source": "Formal estimate and proposal submitted in October 2026",
                        "occurredOn": "2026-10-18",
                        "reportedCompletedStages": ["contacted", "meeting_scheduled"],
                        "actorId": ADMIN_USER_ID,
                        "recordedAt": "2026-10-18T15:00:00.000Z"
                    }
                ]
            }

            d["milestones"] = [
                {
                    "id": f"ms-{p_id[:8]}-1",
                    "title": "Drawing Intake & Digitization Verification",
                    "dueDate": "2026-10-03",
                    "status": "completed",
                    "completedOn": "2026-10-03"
                },
                {
                    "id": f"ms-{p_id[:8]}-2",
                    "title": "Quantity Takeoff Calculation & Cross-Check",
                    "dueDate": "2026-10-06",
                    "status": "completed",
                    "completedOn": "2026-10-06"
                },
                {
                    "id": f"ms-{p_id[:8]}-3",
                    "title": f"Bid Package Submission Deadline ({meta['deadline']})",
                    "dueDate": meta["deadline"],
                    "status": "active",
                    "completedOn": None
                }
            ]
        else:
            d["status"] = "pending_company_info"
            d["operationalState"] = "pending_company_info"
            d["statusNote"] = "Pendiente de enviar información de la empresa (paquete corporativo / W-9 / COI / alcance)"
            d["plannedStart"] = "2026-10-05"
            d["plannedEnd"] = "2026-10-29"
            d["nextAction"] = f"Transmitir paquete corporativo (W-9, COI, capacidad de fianza) a {meta['client']}"
            
            d["commercialProgress"] = {
                "currentStage": "awaiting_insurance_information",
                "source": "Company prequalification documentation requested by general contractor",
                "occurredOn": "2026-10-22",
                "reportedCompletedStages": ["contacted", "meeting_scheduled", "estimate_provided"],
                "actorId": ADMIN_USER_ID,
                "recordedAt": "2026-10-22T14:00:00.000Z",
                "updatedAt": "2026-10-22T14:00:00.000Z",
                "history": [
                    {
                        "currentStage": "contacted",
                        "source": "Initial ITB receipt and company registration",
                        "occurredOn": "2026-10-06",
                        "reportedCompletedStages": [],
                        "actorId": ADMIN_USER_ID,
                        "recordedAt": "2026-10-06T09:30:00.000Z"
                    },
                    {
                        "currentStage": "estimate_provided",
                        "source": "Preliminary scope and estimate provided",
                        "occurredOn": "2026-10-15",
                        "reportedCompletedStages": ["contacted"],
                        "actorId": ADMIN_USER_ID,
                        "recordedAt": "2026-10-15T11:00:00.000Z"
                    },
                    {
                        "currentStage": "awaiting_insurance_information",
                        "source": "Company prequalification documentation requested by general contractor",
                        "occurredOn": "2026-10-22",
                        "reportedCompletedStages": ["contacted", "meeting_scheduled", "estimate_provided"],
                        "actorId": ADMIN_USER_ID,
                        "recordedAt": "2026-10-22T14:00:00.000Z"
                    }
                ]
            }

            d["milestones"] = [
                {
                    "id": f"ms-{p_id[:8]}-1",
                    "title": "Drawing & Specification Receipt",
                    "dueDate": "2026-10-08",
                    "status": "completed",
                    "completedOn": "2026-10-08"
                },
                {
                    "id": f"ms-{p_id[:8]}-2",
                    "title": "Prequalification & Insurance Submission",
                    "dueDate": "2026-10-26",
                    "status": "active",
                    "completedOn": None
                },
                {
                    "id": f"ms-{p_id[:8]}-3",
                    "title": "Final Contract Scope Review",
                    "dueDate": "2026-10-29",
                    "status": "planned",
                    "completedOn": None
                }
            ]

        # Forecast plans in 2026-10
        d["forecastPlans"] = [
            {
                "id": str(uuid.uuid4()),
                "title": f"Q4 Commercial Milestone Billing — {meta['name'][:30]}",
                "direction": "client_collection",
                "amountUsd": round(meta["budget"] * 0.35, 2),
                "dueOn": "2026-10-28",
                "source": "Approved commercial milestone progress",
                "linkedInvoiceId": None,
                "status": "planned",
                "createdAt": "2026-10-05T10:00:00.000Z"
            }
        ]

        # Contacts
        d["contacts"] = [
            {
                "id": str(uuid.uuid4()),
                "name": f"Operations Manager — {meta['client']}",
                "contactRole": "General Contractor Lead",
                "email": f"pm@{meta['slug'].replace('_', '-')}.com",
                "phone": "+1 (312) 555-0144",
                "visibility": "project",
                "status": "active"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "TAYCO Estimating Desk",
                "contactRole": "Quantity Surveyor",
                "email": "estimating@taycollc.com",
                "phone": "+1 (312) 555-0199",
                "visibility": "internal",
                "status": "active"
            }
        ]

        # Team assignments (compatible with guestModuleProjection teamRecords)
        d["teamMembers"] = [
            {
                "memberId": "team-lead-01",
                "email": "lead-estimator@taycollc.com",
                "responsibility": f"Lead Senior Estimator & Quantity Surveyor — {meta['name'][:30]}",
                "assignedOn": "2026-10-02",
                "removedOn": None
            },
            {
                "memberId": "team-pm-02",
                "email": "project-manager@taycollc.com",
                "responsibility": f"Commercial Project Manager & Liaison — {meta['client']}",
                "assignedOn": "2026-10-05",
                "removedOn": None
            }
        ]

        # Update record in DB
        p_conn.execute("UPDATE records SET payload=?, version=version+1, updated_at=? WHERE id=?",
                       (json.dumps(d), now_iso, p_id))

    # Ensure documents have reportingPeriod='2026-10', reviewPeriod='2026-10', type='project', status='approved'
    print("Verifying 42 document records...")
    for d_id, p_id, owner_id, version, created_at, updated_at, payload_str in raw_docs:
        d = json.loads(payload_str)
        d["reportingPeriod"] = "2026-10"
        d["reviewPeriod"] = "2026-10"
        d["period"] = "2026-10"
        d["type"] = "project"
        d["visibility"] = "client"
        d["status"] = "approved"
        p_conn.execute("UPDATE records SET payload=?, updated_at=? WHERE id=?",
                       (json.dumps(d), now_iso, d_id))

    # 2. SEED MODULES (tenant_id='tayco_llc', reportingPeriod='2026-10')

    # A. 19 ESTIMATES (1 per project)
    print("Seeding 19 detailed estimates...")
    for p_id, meta in all_project_meta.items():
        doc_list = proj_docs.get(p_id, [])
        primary_doc = doc_list[0] if doc_list else {"name": f"{meta['slug']}.pdf", "viewerDocumentId": "doc_def", "sourceSha256": "0"*64}

        total_amount = meta["budget"]
        direct_cost = meta["directCost"]

        p1 = round(total_amount * 0.10, 2)
        p2 = round(total_amount * 0.25, 2)
        p3 = round(total_amount * 0.25, 2)
        p4 = round(total_amount * 0.25, 2)
        p5 = round(total_amount - (p1 + p2 + p3 + p4), 2)

        breakdown = [
            {"code": "02-DEMO", "label": "Demolition, Site Preparation & Partition Removal", "amountUsd": p1},
            {"code": "03-CONC", "label": "Concrete Foundations, Slabs & Flatwork", "amountUsd": p2},
            {"code": "05-METALS", "label": "Structural Framing, Cold-Formed Studs & Lintels", "amountUsd": p3},
            {"code": "15-MEP", "label": "Mechanical, Electrical, HVAC & Fire Protection", "amountUsd": p4},
            {"code": "09-FINISH", "label": "Drywall, Ceilings, Commercial Storefront & Finishes", "amountUsd": p5}
        ]

        t1 = round(direct_cost * 0.45, 2)
        t2 = round(direct_cost * 0.40, 2)
        t3 = round(direct_cost - (t1 + t2), 2)

        cost_tiers = [
            {"code": "MATERIAL", "label": "Commercial Building Materials & Prefabricated Components", "amountUsd": t1},
            {"code": "LABOR", "label": "Skilled Trade Field Crews & Supervision Labor", "amountUsd": t2},
            {"code": "EQUIPMENT", "label": "Lifting Equipment, Scaffolding & Power Tooling", "amountUsd": t3}
        ]

        est_id = f"estimate-{p_id[16:48]}"
        est_payload = {
            "id": est_id,
            "projectId": p_id,
            "projectName": meta["name"],
            "title": f"Takeoff Baseline Estimate — {meta['name']}",
            "name": f"Takeoff Baseline Estimate — {meta['name']}",
            "sourceProjectSlug": meta["slug"],
            "status": "estimate",
            "currency": "USD",
            "version": "rev-2026-10",
            "estimatedOn": "2026-10-15",
            "issuedOn": "2026-10-15",
            "dateBasis": "source_date",
            "amountUsd": total_amount,
            "directCostUsd": direct_cost,
            "sourceName": primary_doc["name"],
            "sourceRef": f"plans/2026-10/{meta['slug']}.pdf",
            "sourceSha256": primary_doc["sourceSha256"],
            "capturedAt": "2026-10-15T12:00:00.000Z",
            "sourceAvailability": "available",
            "breakdown": breakdown,
            "breakdownBasis": "bid",
            "breakdownReconciled": True,
            "costTiers": cost_tiers,
            "costTiersReconciled": True,
            "rawCostLineCount": 42,
            "sourceFacts": [
                f"Automated Takeoff measurement verified against sheet schedule in {primary_doc['name']}",
                "Midwest regional prevailing unit rates applied for Q4 2026 baseline."
            ],
            "reportingPeriod": "2026-10",
            "reviewPeriod": "2026-10"
        }

        p_conn.execute("INSERT OR REPLACE INTO records VALUES(?,?,?,?,?,?,1,?,?)",
                       (est_id, "estimate", TENANT_ID, p_id, ADMIN_USER_ID, json.dumps(est_payload), now_iso, now_iso))

    # B. 8 VENDORS (Trade partners)
    print("Seeding 8 approved trade partners...")
    vendors_data = [
        {"name": "Healy Construction Services, Inc.", "trade": "Commercial General Contracting & Civil", "state": "IN", "crew": 45, "email": "bids@healyconstruction.com", "phone": "+1 (708) 396-0440"},
        {"name": "CDO Group Inc", "trade": "Retail Development & Project Management", "state": "IL", "crew": 60, "email": "estimating@cdogroup.com", "phone": "+1 (708) 469-8700"},
        {"name": "Bear Construction Company", "trade": "Commercial Interiors & Industrial Framing", "state": "IL", "crew": 120, "email": "commercial@bearcc.com", "phone": "+1 (847) 222-1900"},
        {"name": "GLR, Inc.", "trade": "Retail Storefronts & Multi-Site Rollout", "state": "IL", "crew": 50, "email": "info@glrinc.com", "phone": "+1 (847) 674-8800"},
        {"name": "Wright Building Systems", "trade": "Commercial Framing, Roofing & Exterior Envelopes", "state": "IL", "crew": 35, "email": "bids@wrightbuild.com", "phone": "+1 (618) 555-0182"},
        {"name": "PKC Construction Co.", "trade": "Restaurant, Hospitality & Quick-Service Fit-Out", "state": "KS", "crew": 40, "email": "estimating@pkcinc.com", "phone": "+1 (913) 492-3400"},
        {"name": "The KEO Group - Illinois", "trade": "Institutional MEP & Educational Facilities", "state": "IL", "crew": 55, "email": "bids@thekeogroup.com", "phone": "+1 (847) 548-2000"},
        {"name": "Sun Industrial Inc", "trade": "Commercial Civil, Paving & Heavy Equipment", "state": "IA", "crew": 30, "email": "sales@sunindustrial.com", "phone": "+1 (563) 324-1900"}
    ]

    vendor_ids = []
    for i, v in enumerate(vendors_data):
        vid = f"vendor-tayco-{i+1:02d}"
        vendor_ids.append(vid)
        v_payload = {
            "name": v["name"],
            "businessName": v["name"],
            "trade": v["trade"],
            "trades": v["trade"],
            "stateServed": v["state"],
            "crewSize": v["crew"],
            "contact": f"Estimating Director — {v['name']}",
            "email": v["email"],
            "phone": v["phone"],
            "status": "approved",
            "reportingPeriod": "2026-10",
            "source": "team",
            "kind": "vendor"
        }
        p_conn.execute("INSERT OR REPLACE INTO records VALUES(?,?,?,?,?,?,1,?,?)",
                       (vid, "vendor", TENANT_ID, "", ADMIN_USER_ID, json.dumps(v_payload), now_iso, now_iso))

    project_id_keys = list(all_project_meta.keys())

    # C. 12 LEADS (Commercial Requests) - 6 overdue, 6 pending_company_info
    print("Seeding 12 commercial requests (leads)...")
    for i in range(12):
        pid = project_id_keys[i]
        meta = all_project_meta[pid]
        lid = f"lead-req-{i+1:02d}"
        is_ov = i < 6
        l_payload = {
            "name": f"Commercial RFP — {meta['name']}",
            "email": f"bids@{meta['slug'].replace('_', '-')}.com",
            "details": f"Request for full lump-sum proposal and takeoff leveling on {meta['name']}. Scope includes Division 02-09 packages.",
            "status": "quoted" if is_ov else "waiting",
            "location": meta["location"],
            "estimatedValueUsd": meta["budget"],
            "estimateSource": "Architectural IFB drawing set review and preliminary takeoff",
            "request_kind": "estimate",
            "project_type": "Commercial General Contracting",
            "kind": "estimate",
            "assigneeId": ADMIN_USER_ID,
            "nextAction": "Review expired bid decision with general contractor" if is_ov else "Transmit corporate prequalification packet and COI",
            "commercialProgress": {
                "currentStage": "estimate_provided" if is_ov else "awaiting_insurance_information",
                "updatedAt": "2026-10-18T15:00:00Z" if is_ov else "2026-10-22T14:00:00Z"
            },
            "reportingPeriod": "2026-10",
            "source": "team"
        }
        p_conn.execute("INSERT OR REPLACE INTO records VALUES(?,?,?,?,?,?,1,?,?)",
                       (lid, "lead", TENANT_ID, pid, ADMIN_USER_ID, json.dumps(l_payload), now_iso, now_iso))

    # D. 12 PROPOSALS (Client Proposals) - 6 sent (validUntil < 2026-10-24), 6 draft
    print("Seeding 12 client proposals...")
    for i in range(12):
        pid = project_id_keys[i]
        meta = all_project_meta[pid]
        pr_id = f"proposal-tayco-{i+1:02d}"
        is_ov = i < 6
        pr_payload = {
            "title": f"Formal Commercial Proposal — {meta['name']}",
            "reference": f"PROP-2026-{1000+i}",
            "client": meta["client"],
            "clientName": meta["client"],
            "amountUsd": meta["budget"],
            "currency": "USD",
            "issuedOn": "2026-10-04",
            "issueDate": "2026-10-04",
            "sentOn": "2026-10-05" if is_ov else None,
            "validUntil": ("2026-10-16" if is_ov else "2026-10-31"),
            "status": "sent" if is_ov else "draft",
            "source": "Detailed quantity takeoff from approved conformed drawing set",
            "decidedOn": None,
            "evidence": None,
            "reportingPeriod": "2026-10"
        }
        p_conn.execute("INSERT OR REPLACE INTO records VALUES(?,?,?,?,?,?,1,?,?)",
                       (pr_id, "proposal", TENANT_ID, pid, ADMIN_USER_ID, json.dumps(pr_payload), now_iso, now_iso))

    # E. 12 BIDS (Bid Leveling)
    print("Seeding 12 supplier bids for leveling...")
    trades_pool = [
        "Division 02 — Selective Demolition & Site Grading",
        "Division 03 — Cast-In-Place Concrete Foundations & Flatwork",
        "Division 05 — Structural Steel Framing & Joists",
        "Division 09 — Drywall Framing, ACT Ceilings & Finishes",
        "Division 15 — Commercial HVAC & Rooftop Unit Package",
        "Division 16 — Electrical Service & Distribution Panels"
    ]
    for i in range(12):
        pid = project_id_keys[i % len(project_id_keys)]
        meta = all_project_meta[pid]
        v_idx = i % len(vendors_data)
        v = vendors_data[v_idx]
        bid_id = f"bid-leveling-{i+1:02d}"
        is_ov = i < 6
        bid_amount = round(meta["budget"] * (0.18 + (i * 0.015)), 2)
        b_payload = {
            "supplierName": v["name"],
            "supplier": v["name"],
            "trade": trades_pool[i % len(trades_pool)],
            "scope": f"Complete subcontractor quote for {trades_pool[i % len(trades_pool)]} on {meta['name']}.",
            "amountUsd": bid_amount,
            "currency": "USD",
            "issuedOn": f"2026-10-{10 + (i % 8):02d}",
            "issueDate": f"2026-10-{10 + (i % 8):02d}",
            "source": "Subcontractor ITB return package & price sheet",
            "vendorId": vendor_ids[v_idx],
            "status": "shortlisted" if is_ov else "reviewing",
            "response": "Scope leveling verified against division drawings. Quantities consistent with M02 survey.",
            "reportingPeriod": "2026-10"
        }
        p_conn.execute("INSERT OR REPLACE INTO records VALUES(?,?,?,?,?,?,1,?,?)",
                       (bid_id, "bid", TENANT_ID, pid, ADMIN_USER_ID, json.dumps(b_payload), now_iso, now_iso))

    # F. 6 CORPORATE MEETINGS
    print("Seeding 6 corporate meetings...")
    meetings_data = [
        ("Executive Q4 Bid Pipeline Review", "2026-10-06", "09:00", "urgent", "Executive Boardroom", "Final review of upcoming October bid submissions and bond allocations."),
        ("Takeoff Pro Model Calibration Session", "2026-10-09", "11:00", "high", "Engineering Lab", "Calibration of M02 schedule digitizer against CLC and Millis drawing sheets."),
        ("Trade Partner Prequalification Audit", "2026-10-14", "14:00", "normal", "Conference Room A", "Review of trade partner compliance, safety ratings, and insurance certificates."),
        ("Commercial Risk & Overdue Bid Review", "2026-10-17", "10:30", "urgent", "Executive Boardroom", "Action plan for overdue bids and contractor follow-up protocol."),
        ("Corporate Entity W-9 & COI Renewal", "2026-10-21", "15:00", "high", "Virtual Operations Room", "Coordination with broker for renewed certificates of insurance across all projects."),
        ("Monthly Close & Portfolio Status Review", "2026-10-23", "16:00", "high", "Executive Boardroom", "Executive portfolio sign-off for October 2026 reporting cycle.")
    ]
    for i, (m_title, m_date, m_time, m_prio, m_loc, m_notes) in enumerate(meetings_data):
        mid = f"meeting-corp-{i+1:02d}"
        m_payload = {
            "title": m_title,
            "date": m_date,
            "scheduledOn": m_date,
            "scheduledDate": m_date,
            "time": m_time,
            "location": m_loc,
            "priority": m_prio,
            "notes": m_notes,
            "assigneeId": ADMIN_USER_ID,
            "assigneeEmail": ADMIN_EMAIL,
            "status": "completed" if m_date < "2026-10-24" else "scheduled",
            "history": [
                {
                    "action": "create_corporate_meeting",
                    "actorId": ADMIN_USER_ID,
                    "recordedAt": f"{m_date}T08:00:00.000Z",
                    "status": "scheduled"
                }
            ],
            "reportingPeriod": "2026-10",
            "source": "team"
        }
        p_conn.execute("INSERT OR REPLACE INTO records VALUES(?,?,?,?,?,?,1,?,?)",
                       (mid, "corporate_meeting", TENANT_ID, "", ADMIN_USER_ID, json.dumps(m_payload), now_iso, now_iso))

    # G. 12 FOLLOWUPS (6 overdue < 2026-10-24, 6 pending)
    print("Seeding 12 priority follow-ups...")
    followups_data = [
        ("Submit Revised Takeoff Pricing to CDO Group (Dutch Bros)", "2026-10-10", "urgent", "Dutch Bros IL0403 revisions #6 & #7 leveling must be finalized."),
        ("Confirm Kroger Civil Utility Tie-In with Healy Construction", "2026-10-12", "high", "Civil sheet verification needed for Greenfield site connections."),
        ("Follow up with GLR Inc on Cresco Labs GlowUp Proposal", "2026-10-15", "urgent", "Expired proposal review required immediately."),
        ("Deliver Final Hardware Specification to Bear Construction", "2026-10-17", "high", "Benjamin Center spec clarification required."),
        ("Resolve Belvidere Freeway Insurance Electrical Scope", "2026-10-18", "normal", "Clarify dedicated circuit callout on page 1."),
        ("Livewell Animal Hospital Westfield Framing Addendum Review", "2026-10-20", "high", "Verify wall framing schedule against ITB document."),
        ("Assemble Corporate Information Package for PKC Construction", "2026-10-26", "urgent", "Send W-9, COI, and OSHA 300 logs for TMAD 490."),
        ("Submit Contractor Prequalification for CLC Grayslake Project", "2026-10-27", "high", "KEO Group request for Illinois contractor license verification."),
        ("Prepare Foot Locker Mishawaka Insurance Endorsement", "2026-10-28", "high", "Special endorsement required for University Park Mall operations."),
        ("Coordinate Richfield Concept Plan Revisions with Millis Transfer", "2026-10-29", "normal", "Confirm concrete pavement replacement boundaries."),
        ("Finalize Goddard Burr Ridge Subcontractor Walkthrough", "2026-10-29", "normal", "Pre-bid site visit schedule coordination."),
        ("Confirm Cuba Township Highway Permit Requirements", "2026-10-30", "normal", "Verify road district bonding requirements.")
    ]
    for i, (f_title, f_due, f_prio, f_notes) in enumerate(followups_data):
        fid = f"followup-corp-{i+1:02d}"
        pid = project_id_keys[i % len(project_id_keys)]
        f_payload = {
            "title": f_title,
            "dueDate": f_due,
            "scheduledOn": f_due,
            "priority": f_prio,
            "notes": f_notes,
            "assigneeId": ADMIN_USER_ID,
            "assigneeEmail": ADMIN_EMAIL,
            "status": "open",
            "history": [
                {
                    "action": "create_followup",
                    "actorId": ADMIN_USER_ID,
                    "recordedAt": "2026-10-05T10:00:00.000Z",
                    "status": "open"
                }
            ],
            "reportingPeriod": "2026-10",
            "source": "team"
        }
        p_conn.execute("INSERT OR REPLACE INTO records VALUES(?,?,?,?,?,?,1,?,?)",
                       (fid, "followup", TENANT_ID, pid, ADMIN_USER_ID, json.dumps(f_payload), now_iso, now_iso))

    # H. 10 NOTES (Technical updates, visibility='client')
    print("Seeding 10 technical project updates (notes)...")
    notes_data = [
        ("M02 Schedule Extraction Completed for CLC IDF Room", "Mechanical schedule tags SS-1 and CAB-IDF extracted with 100% vector fidelity."),
        ("Dutch Bros Revision 6 & 7 Drawing Overlays Synced", "Subcontractor leveling updated to include non-structural partition adjustments."),
        ("Kroger Greenfield Civil Grading Cross-Section Verified", "Stormwater detention basin calculations aligned with civil engineering drawings."),
        ("Foot Locker Mishawaka ITB Drawing Package Verified", "Conformed bid set sheet index cross-checked; electrical and mechanical sheets confirmed."),
        ("Mendocino Farms Mechanical & Fire Sprinkler Submittal Check", "Division 21 & 23 drawing sets uploaded and processed in Takeoff Pro."),
        ("Millis Transfer Richfield Concrete Area Measurement Verified", "2,175 sq ft pavement replacement verified with 7-in depth callout."),
        ("Davenport DT #10766 Rev #2 Architectural Review Complete", "Storefront framing elevation details confirmed for retail layout."),
        ("Livewell Animal Hospital Architectural Coordination Note", "Plumbing rough-in coordinates verified for veterinary treatment suites."),
        ("TMAD 490 Food Service Equipment Schedule Indexed", "Equipment tags 102 through 600 indexed from A1.1 sheet."),
        ("Cuba Township Road District Plan Review Completed", "Highway entrance pavement cross-sections verified against municipal standards.")
    ]
    for i, (n_title, n_details) in enumerate(notes_data):
        nid = f"note-update-{i+1:02d}"
        pid = project_id_keys[i % len(project_id_keys)]
        n_payload = {
            "title": n_title,
            "details": n_details,
            "visibility": "client",
            "reportingPeriod": "2026-10",
            "source": "team"
        }
        p_conn.execute("INSERT OR REPLACE INTO records VALUES(?,?,?,?,?,?,1,?,?)",
                       (nid, "note", TENANT_ID, pid, ADMIN_USER_ID, json.dumps(n_payload), now_iso, now_iso))

    # I. 8 CHANGES (Scope Changes / Addenda)
    print("Seeding 8 scope changes (addenda)...")
    changes_data = [
        ("Dutch Bros IL0403 — Addendum Revisions #6 & #7", 14200.00, "Scope modification for revised drive-thru canopy framing."),
        ("Dollar Tree #10766 Davenport — Rev #2 Plan Alignment", 9800.00, "Architectural revisions to interior stockroom partition walls."),
        ("TMAD 490 Normal — Equipment Schedule Addendum #1", 12500.00, "Inclusion of dedicated grease duct enclosure and roof penetration flashing."),
        ("Foot Locker #7091 Mishawaka — BidSet Addendum A", 8400.00, "Addition of security shutter backing and revised storefront header."),
        ("Kroger Greenfield — Civil Storm Drainage Field Modification", 18500.00, "Relocation of catch basin #4 per local municipal engineering review."),
        ("Mendocino Farms Naperville — Low Voltage & Fire Alarm Revision", 7600.00, "Relocation of dedicated data raceway in kitchen service corridor."),
        ("Millis Transfer Richfield — Heavy Pavement Transition Slab", 16800.00, "Addition of reinforced concrete approach apron at main gate."),
        ("CLC IDF Room — Dedicated Condensate Line Reroute", 5400.00, "Routing condensate line to nearest janitor basin per facility specs.")
    ]
    for i, (c_title, c_amount, c_details) in enumerate(changes_data):
        cid = f"change-scope-{i+1:02d}"
        pid = project_id_keys[i % len(project_id_keys)]
        c_payload = {
            "title": c_title,
            "details": c_details,
            "amountUsd": c_amount,
            "currency": "USD",
            "status": "proposed",
            "reportingPeriod": "2026-10",
            "source": "team"
        }
        p_conn.execute("INSERT OR REPLACE INTO records VALUES(?,?,?,?,?,?,1,?,?)",
                       (cid, "change", TENANT_ID, pid, ADMIN_USER_ID, json.dumps(c_payload), now_iso, now_iso))

    # J. 12 HOURS (Work Hours)
    print("Seeding 12 team work-hour records...")
    hours_trades = [
        "Takeoff Engineering & Quantity Survey",
        "Senior Estimator Architectural Review",
        "MEP Systems Estimation & Takeoff",
        "Civil & Site Works Quantity Survey"
    ]
    for i in range(12):
        hid = f"hours-rec-{i+1:02d}"
        pid = project_id_keys[i % len(project_id_keys)]
        h_date = f"2026-10-{10 + (i % 12):02d}"
        h_payload = {
            "worker": f"Estimator {1 + (i % 4)}",
            "trade": hours_trades[i % len(hours_trades)],
            "hours": round(6.0 + (i % 4) * 1.5, 1),
            "date": h_date,
            "workDate": h_date,
            "status": "approved",
            "reportingPeriod": "2026-10",
            "source": "team"
        }
        p_conn.execute("INSERT OR REPLACE INTO records VALUES(?,?,?,?,?,?,1,?,?)",
                       (hid, "hours", TENANT_ID, pid, ADMIN_USER_ID, json.dumps(h_payload), now_iso, now_iso))

    # K. 8 TEAMS (Project Teams records)
    print("Seeding 8 project team records...")
    for i in range(8):
        tid = f"team-record-{i+1:02d}"
        pid = project_id_keys[i]
        meta = all_project_meta[pid]
        t_payload = {
            "name": f"Project Team — {meta['name'][:35]}",
            "role": "Commercial Project Delivery & Takeoff Team",
            "lead": "Senior Project Executive",
            "membersCount": 6,
            "status": "active",
            "reportingPeriod": "2026-10",
            "source": "team"
        }
        p_conn.execute("INSERT OR REPLACE INTO records VALUES(?,?,?,?,?,?,1,?,?)",
                       (tid, "team", TENANT_ID, pid, ADMIN_USER_ID, json.dumps(t_payload), now_iso, now_iso))

    # L. 10 COMPLIANCE (Project requirements & certifications)
    print("Seeding 10 corporate compliance records...")
    compliance_data = [
        ("W-9 Form & Federal Taxpayer ID Certification", "general", "Federal / IRS", "2026-10-26", "Corporate W-9 signed by authorized officer for FY 2026."),
        ("Certificate of Insurance (COI) — Commercial General Liability $2M/$4M", "insurance", "State of Illinois", "2026-10-26", "A-rated carrier policy with general contractor named as additional insured."),
        ("Surety Bonding Capacity Letter ($10M Aggregate / $5M Single)", "general", "Surety Association of America", "2026-10-27", "Bank-verified bonding verification letter for commercial tenders."),
        ("Illinois General Contractor Corporate Entity Good Standing", "licensing", "Illinois Secretary of State", "2026-10-28", "Annual corporate certificate of good standing verified."),
        ("Corporate Safety Manual & Written Hazard Communication Plan", "safety", "OSHA 1926 Standards", "2026-10-29", "Corporate safety manual and OSHA 300 logs for past 3 calendar years."),
        ("Indiana Foreign Corporation Registration Certificate", "licensing", "Indiana Secretary of State", "2026-10-28", "Certificate of authorization to transact business in State of Indiana."),
        ("Wisconsin Contractor Credential Verification", "licensing", "Wisconsin DSPS", "2026-10-29", "Commercial building contractor credential renewal confirmation."),
        ("Worker's Compensation & Employer's Liability Certificate", "insurance", "Illinois Workers' Comp Commission", "2026-10-26", "Statutory limits proof with waiver of subrogation endorsement."),
        ("Site Specific Safety Plan (SSSP) — Occupied Retail Guidelines", "safety", "Occupational Safety and Health Administration", "2026-10-30", "Protocols for customer protection during commercial interior renovations."),
        ("Environmental Lead & Asbestos Pre-Demolition Survey Verification", "environmental", "Illinois EPA", "2026-10-27", "Negative hazardous material inspection report for renovation scope.")
    ]
    for i, (c_topic, c_cat, c_auth, c_due, c_src) in enumerate(compliance_data):
        comp_id = f"compliance-req-{i+1:02d}"
        pid = project_id_keys[i % len(project_id_keys)]
        comp_payload = {
            "topic": c_topic,
            "category": c_cat,
            "jurisdiction": "Illinois" if "Indiana" not in c_topic and "Wisconsin" not in c_topic else ("Indiana" if "Indiana" in c_topic else "Wisconsin"),
            "authority": c_auth,
            "dueDate": c_due,
            "source": c_src,
            "status": "in_review" if i < 5 else "pending",
            "evidence": "Document uploaded and awaiting counter-signature." if i < 5 else "",
            "reviewedOn": "2026-10-20" if i < 5 else None,
            "reportingPeriod": "2026-10"
        }
        p_conn.execute("INSERT OR REPLACE INTO records VALUES(?,?,?,?,?,?,1,?,?)",
                       (comp_id, "compliance", TENANT_ID, pid, ADMIN_USER_ID, json.dumps(comp_payload), now_iso, now_iso))

    # M. 10 MONTHS OF MONTHLY MANAGEMENT ESTIMATES (2026-01 to 2026-10)
    print("Seeding 10 months of monthly management estimates (2026-01 to 2026-10)...")
    monthly_estimates = [
        ("2026-01", 35000000, 48000000, "Q1 Management Baseline — Initial Portfolio Scoping"),
        ("2026-02", 42000000, 58000000, "Q1 Mid-Quarter Intake — Retail & Commercial Fitouts"),
        ("2026-03", 51000000, 69000000, "Q1 Quarter-End Close — Approved Preconstruction Bids"),
        ("2026-04", 64000000, 82000000, "Q2 Commercial Launch — Multi-Site Franchise Rollout"),
        ("2026-05", 78000000, 99000000, "Q2 Mid-Quarter Active Bidding — Midwest Regional Pipeline"),
        ("2026-06", 92000000, 118000000, "Q2 Close — Takeoff Automated Measurement Pilot"),
        ("2026-07", 105000000, 135000000, "Q3 Mid-Year Expansion — Institutional & Commercial Tenders"),
        ("2026-08", 120000000, 152000000, "Q3 Summer Procurement & Conformed Set Releases"),
        ("2026-09", 138000000, 174000000, "Q3 Close — Comprehensive Drawing Schedule Indexing"),
        ("2026-10", 155000000, 195000000, "Q4 Current Reporting Month — Active October Tender Portfolio")
    ]
    for period_str, low_c, high_c, src_str in monthly_estimates:
        rec_time = f"{period_str}-01T12:00:00.000Z"
        up_time = f"{period_str}-28T18:00:00.000Z" if period_str < "2026-10" else "2026-10-24T12:00:00.000Z"
        p_conn.execute("""
        INSERT OR REPLACE INTO monthly_management_estimates(
            tenant_id, period, low_cents, high_cents, source, author_id, recorded_at, updated_at, version
        ) VALUES(?,?,?,?,?,?,?,?,1)
        """, (TENANT_ID, period_str, low_c, high_c, src_str, ADMIN_USER_ID, rec_time, up_time))

        p_conn.execute("""
        INSERT OR REPLACE INTO monthly_management_estimate_history(
            tenant_id, period, version, low_cents, high_cents, source, author_id, recorded_at
        ) VALUES(?,?,1,?,?,?,?,?)
        """, (TENANT_ID, period_str, low_c, high_c, src_str, ADMIN_USER_ID, rec_time))

    p_conn.commit()
    print("Populated ERP seeding successfully committed.")

    # 3. SYNCHRONIZE TO TAYCO-ERP.SQLITE (including takeoff_measurement_* tables)
    print(f"\nSynchronizing to {TAYCO_ERP}...")
    t_conn = get_db(TAYCO_ERP)
    sync_schema_from(p_conn, t_conn)

    # Sync records
    t_conn.execute("DELETE FROM records")
    for row in p_conn.execute("SELECT id, kind, tenant_id, project_id, owner_id, payload, version, created_at, updated_at FROM records").fetchall():
        t_conn.execute("INSERT INTO records VALUES(?,?,?,?,?,?,?,?,?)", row)

    # Sync monthly management estimates
    t_conn.execute("DELETE FROM monthly_management_estimates")
    t_conn.execute("DELETE FROM monthly_management_estimate_history")
    for row in p_conn.execute("SELECT tenant_id, period, low_cents, high_cents, source, author_id, recorded_at, updated_at, version FROM monthly_management_estimates").fetchall():
        t_conn.execute("INSERT INTO monthly_management_estimates VALUES(?,?,?,?,?,?,?,?,?)", row)
    for row in p_conn.execute("SELECT tenant_id, period, version, low_cents, high_cents, source, author_id, recorded_at FROM monthly_management_estimate_history").fetchall():
        t_conn.execute("INSERT INTO monthly_management_estimate_history VALUES(?,?,?,?,?,?,?,?)", row)

    # Sync takeoff_measurement_* tables
    for tbl in ["takeoff_measurement_receipts", "takeoff_measurement_bindings", "takeoff_measurement_text_overlays"]:
        t_conn.execute(f"DELETE FROM {tbl}")
        cols = [d[0] for d in p_conn.execute(f"SELECT * FROM {tbl} LIMIT 0").description]
        placeholders = ",".join(["?"] * len(cols))
        rows = p_conn.execute(f"SELECT * FROM {tbl}").fetchall()
        for r in rows:
            t_conn.execute(f"INSERT INTO {tbl} VALUES({placeholders})", r)
        print(f"Copied {len(rows)} rows into {tbl} in tayco-erp.sqlite.")

    t_conn.commit()
    t_conn.close()
    p_conn.close()
    print("TAYCO ERP synchronization complete.")

    # 4. SYNCHRONIZE AUTH DATABASES
    print("\nEnsuring users in Auth databases...")
    # First sync schema from POPULATED_AUTH to TAYCO_AUTH if needed
    p_auth_conn = get_db(POPULATED_AUTH)
    t_auth_conn = get_db(TAYCO_AUTH)
    sync_schema_from(p_auth_conn, t_auth_conn)
    p_auth_conn.close()
    t_auth_conn.close()

    for auth_path in [POPULATED_AUTH, TAYCO_AUTH]:
        print(f"Processing auth database: {auth_path}")
        a_conn = get_db(auth_path)
        tables = [r[0] for r in a_conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]

        now_ms = int(datetime.now(timezone.utc).timestamp() * 1000)
        grant_expires_ms = now_ms + 14400000 # 4 hours (matches trigger CHECK(expires_at=created_at+14400000))
        session_expires_ms = now_ms + (3 * 3600 * 1000) # 3 hours

        # Ensure admin user
        admin_exists = a_conn.execute("SELECT id FROM auth_users WHERE email=?", (ADMIN_EMAIL,)).fetchone()
        if not admin_exists:
            a_conn.execute("""
            INSERT INTO auth_users(id, email, password_hash, role, tenant_id, project_ids, vendor_id, disabled, created_at)
            VALUES(?,?,?,?,?,'[]',NULL,0,?)
            """, (ADMIN_USER_ID, ADMIN_EMAIL, ADMIN_PW_HASH, "admin", TENANT_ID, now_ms))
            print(f"  Inserted admin {ADMIN_EMAIL}")
        else:
            print(f"  Admin {ADMIN_EMAIL} already present.")

        # Ensure guest user
        guest_exists = a_conn.execute("SELECT id FROM auth_users WHERE email=?", (GUEST_EMAIL,)).fetchone()
        if not guest_exists:
            a_conn.execute("""
            INSERT INTO auth_users(id, email, password_hash, role, tenant_id, project_ids, vendor_id, disabled, created_at)
            VALUES(?,?,?,?,?,'[]',NULL,0,?)
            """, (GUEST_USER_ID, GUEST_EMAIL, GUEST_PW_HASH, "guest", TENANT_ID, now_ms))
            print(f"  Inserted guest {GUEST_EMAIL}")
        else:
            print(f"  Guest {GUEST_EMAIL} already present.")

        # Ensure review grant if table exists
        grant_id = f"grant-guest-{GUEST_USER_ID[:8]}"
        if "auth_review_grants" in tables:
            existing_grant = a_conn.execute("SELECT id FROM auth_review_grants WHERE user_id=? AND expires_at > ?", (GUEST_USER_ID, now_ms)).fetchone()
            if not existing_grant:
                invite_id = f"invite-guest-{GUEST_USER_ID[:8]}"
                creation_key = f"key-guest-{now_ms}"
                fingerprint = "0" * 64
                a_conn.execute("""
                INSERT OR REPLACE INTO auth_review_grants(
                    id, invite_id, tenant_id, email, user_id, detail_period, created_by,
                    creation_key, request_hash, created_at, expires_at, accepted_at, revoked_at,
                    scope, policy_version, recipient_profile, recipient_policy_sha256
                ) VALUES(?,?,?,?,?,?,?,?,?,?,?,NULL,NULL,'company_readonly',1,'company',NULL)
                """, (grant_id, invite_id, TENANT_ID, GUEST_EMAIL, GUEST_USER_ID, "2026-10", ADMIN_USER_ID, creation_key, fingerprint, now_ms, grant_expires_ms))
                print(f"  Created review grant {grant_id} for guest.")
            else:
                grant_id = existing_grant[0]
                print(f"  Active review grant {grant_id} already exists for guest.")

        # Check existing active session for guest
        existing_guest_session = a_conn.execute("SELECT token_hash, expires_at FROM auth_sessions WHERE user_id=? AND expires_at > ?",
                                                (GUEST_USER_ID, now_ms)).fetchone()
        if not existing_guest_session:
            guest_token_hash = f"test_guest_session_{now_ms}"
            # Check if review_grant_id column exists
            session_cols = [d[1] for d in a_conn.execute("PRAGMA table_info(auth_sessions)").fetchall()]
            if "review_grant_id" in session_cols:
                a_conn.execute("INSERT OR REPLACE INTO auth_sessions(token_hash, user_id, expires_at, created_at, review_grant_id) VALUES(?,?,?,?,?)",
                               (guest_token_hash, GUEST_USER_ID, session_expires_ms, now_ms, grant_id))
            else:
                a_conn.execute("INSERT OR REPLACE INTO auth_sessions(token_hash, user_id, expires_at, created_at) VALUES(?,?,?,?)",
                               (guest_token_hash, GUEST_USER_ID, session_expires_ms, now_ms))
            print(f"  Created 3h guest test session (expires in 3 hours).")
        else:
            print(f"  Active guest session already exists.")

        a_conn.commit()
        a_conn.close()

    # 5. UPDATE MAPPING.JSON to include guestReviews so Takeoff viewer opens all project plans for guest
    mapping_path = os.path.join(POPULATED_DIR, "mapping.json")
    if os.path.exists(mapping_path):
        print(f"\nUpdating {mapping_path} to grant guest review access for October 2026...")
        with open(mapping_path, "r", encoding="utf-8") as f:
            m_data = json.load(f)
        
        m_data["schemaVersion"] = "tayco-takeoff-viewer-access/v2"
        existing_grants = m_data.get("guestReviews", [])
        existing_keys = {f"{g['tenantId']}:{g['guestId']}:{g['projectId']}:{g['period']}" for g in existing_grants}

        added_grants = 0
        for m in m_data.get("mappings", []):
            grant_key = f"{m['tenantId']}:{GUEST_USER_ID}:{m['projectId']}:2026-10"
            if grant_key not in existing_keys:
                existing_grants.append({
                    "tenantId": m["tenantId"],
                    "guestId": GUEST_USER_ID,
                    "projectId": m["projectId"],
                    "period": "2026-10",
                    "viewerDocumentIds": [d["viewerDocumentId"] for d in m.get("documents", [])]
                })
                existing_keys.add(grant_key)
                added_grants += 1

        m_data["guestReviews"] = existing_grants
        with open(mapping_path, "w", encoding="utf-8") as f:
            json.dump(m_data, f, indent=2)
        print(f"  Updated mapping.json: added {added_grants} guestReviews entries.")

    print("\n--- ALL SEEDING & SYNCHRONIZATION COMPLETED SUCCESSFULLY ---")

if __name__ == "__main__":
    seed_database()
