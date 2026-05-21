import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit, checkEmailLimit, sanitize, validateOrigin,
  checkTiming, checkUserAgent, checkPayloadSize, checkEmailDomain, checkSpam,
} from "../_utils";

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN!;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID!;
const TABLE_NAME = "Company Leads";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    if (!checkRateLimit(ip)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    if (!validateOrigin(req.headers.get("origin"))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!checkUserAgent(req.headers.get("user-agent"))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();

    if (!checkPayloadSize(body)) return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    if (body.website) return NextResponse.json({ success: true });
    if (!checkTiming(body._loadedAt)) return NextResponse.json({ success: true });

    const fullName        = sanitize(body.fullName);
    const company         = sanitize(body.company, 200);
    const email           = sanitize(body.email, 200);
    const phone           = sanitize(body.phone, 30);
    const preferredContact = sanitize(body.preferredContact, 20);
    const properties      = sanitize(body.properties, 20);
    const workNeeded      = sanitize(body.workNeeded, 500);
    const states          = sanitize(body.states, 200);
    const activeProjects  = sanitize(body.activeProjects, 50);
    const notes           = sanitize(body.notes, 2000);

    if (!fullName || !email || !phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    if (!checkEmailDomain(email)) {
      return NextResponse.json({
        error: "disposable_email",
        message: "Please use a real email address so we can contact you.",
      }, { status: 400 });
    }

    if (!checkEmailLimit(email)) {
      return NextResponse.json({
        error: "duplicate_email",
        message: "We already received your information. Our team will reach out shortly.",
      }, { status: 429 });
    }

    if (!checkSpam(notes)) return NextResponse.json({ success: true });

    const leadNotes = [
      `TYPE: Investor Lead`,
      `Preferred Contact: ${preferredContact}`,
      `Properties Managed: ${properties}`,
      `Work Needed: ${workNeeded}`,
      `States: ${states}`,
      `Active Projects: ${activeProjects}`,
      notes ? `Notes: ${notes}` : null,
    ].filter(Boolean).join("\n");

    const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          "Company Name": company || fullName,
          "Primary Contact Name": fullName,
          "Contact Email": email,
          "Contact Phone": phone,
          "status": "no contact",
          "Lead Notes": leadNotes,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Airtable error:", err);
      return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
