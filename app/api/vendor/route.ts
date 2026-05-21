import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit, checkEmailLimit, sanitize, validateOrigin,
  checkTiming, checkUserAgent, checkPayloadSize, checkEmailDomain, checkSpam,
} from "../_utils";

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN!;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID!;
const TABLE_NAME = "Subcontractors";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    if (!validateOrigin(req.headers.get("origin"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!checkUserAgent(req.headers.get("user-agent"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    if (!checkPayloadSize(body)) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    // Honeypot trap
    if (body.website) return NextResponse.json({ success: true });

    // Timing trap
    if (!checkTiming(body._loadedAt)) return NextResponse.json({ success: true });

    const w9Url = typeof body.w9Url === "string" ? body.w9Url : "";
    const insuranceUrl = typeof body.insuranceUrl === "string" ? body.insuranceUrl : "";
    const docsPending = body.docsPending === true;

    const businessName = sanitize(body.businessName);
    const contactName = sanitize(body.contactName);
    const phone = sanitize(body.phone, 30);
    const email = sanitize(body.email, 200);
    const licenseNumber = sanitize(body.licenseNumber, 100);
    const yearsInBusiness = sanitize(body.yearsInBusiness, 20);
    const crewSize = sanitize(body.crewSize, 50);
    const citiesServed = sanitize(body.citiesServed, 500);
    const stateServed = sanitize(body.stateServed, 50);
    const insured = sanitize(body.insured, 10);
    const trades = sanitize(body.trades, 1000);
    const notes = sanitize(body.notes, 2000);

    if (!businessName || !contactName || !phone || !email || !yearsInBusiness || !crewSize || !stateServed || !citiesServed || !insured || !trades) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Block disposable/fake email providers
    if (!checkEmailDomain(email)) {
      return NextResponse.json({
        error: "disposable_email",
        message: "We only accept real email addresses (Gmail, Outlook, Yahoo, iCloud, etc.). Temporary or disposable email addresses are not accepted — please use your real email so we can review your application.",
      }, { status: 400 });
    }

    // Block same email submitting more than once in 24 hours
    if (!checkEmailLimit(email)) {
      return NextResponse.json({
        error: "duplicate_email",
        message: "We already received an application from this email address today. Our team will review it and contact you within 2-3 business days. Please do not submit the form again.",
      }, { status: 429 });
    }

    // Spam keyword filter on notes field
    if (!checkSpam(notes)) {
      return NextResponse.json({ success: true }); // silent reject
    }

    const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          "Business Name": businessName,
          "Contact Name": contactName,
          "Phone": phone,
          "Email": email,
          "License Number": licenseNumber,
          "Years Experience": yearsInBusiness,
          "Crew Size": crewSize,
          "Cities Served": citiesServed,
          "State": stateServed,
          "Insurance": insured,
          "Trades": trades,
          "Notes": notes,
          "Approval Status": "Pending",
          "Source": "Website Application",
          "W9": w9Url ? [{ url: w9Url }] : undefined,
          "Insurance Certificate": insuranceUrl ? [{ url: insuranceUrl }] : undefined,
          "Documents Status": docsPending ? "Pending Upload" : (w9Url && insuranceUrl ? "Complete" : "Partial"),
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
