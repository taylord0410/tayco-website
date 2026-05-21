import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit, checkEmailLimit, sanitize, validateOrigin,
  checkTiming, checkUserAgent, checkPayloadSize, checkEmailDomain, checkSpam,
} from "../_utils";

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN!;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID!;
const TABLE_NAME = "Subcontractors";
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const NOTIFY_EMAIL = "tayroofing@gmail.com";

async function sendNotification(data: Record<string, string>) {
  if (!RESEND_API_KEY) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "TAYCO Website <onboarding@resend.dev>",
        to: [NOTIFY_EMAIL],
        subject: `New Vendor Application — ${data.businessName}`,
        html: `
          <h2 style="color:#0F2040">New Vendor Application Received</h2>
          <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px">
            <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Business Name</td><td style="padding:8px;border:1px solid #eee">${data.businessName}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Contact</td><td style="padding:8px;border:1px solid #eee">${data.contactName}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Phone</td><td style="padding:8px;border:1px solid #eee">${data.phone}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Email</td><td style="padding:8px;border:1px solid #eee">${data.email}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Trades</td><td style="padding:8px;border:1px solid #eee">${data.trades}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">State</td><td style="padding:8px;border:1px solid #eee">${data.stateServed}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Cities</td><td style="padding:8px;border:1px solid #eee">${data.citiesServed}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Insured</td><td style="padding:8px;border:1px solid #eee">${data.insured}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Years in Business</td><td style="padding:8px;border:1px solid #eee">${data.yearsInBusiness}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Crew Size</td><td style="padding:8px;border:1px solid #eee">${data.crewSize}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">W9</td><td style="padding:8px;border:1px solid #eee">${data.w9Url ? `<a href="${data.w9Url}">View W9</a>` : "Not uploaded yet"}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Insurance COI</td><td style="padding:8px;border:1px solid #eee">${data.insuranceUrl ? `<a href="${data.insuranceUrl}">View COI</a>` : "Not uploaded yet"}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Notes</td><td style="padding:8px;border:1px solid #eee">${data.notes || "—"}</td></tr>
          </table>
          <p style="margin-top:16px;color:#666;font-size:12px">Review in Airtable → Subcontractors</p>
        `,
      }),
    });
  } catch (e) {
    console.error("Email notification failed:", e);
  }
}

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

    if (body.website) return NextResponse.json({ success: true });
    if (!checkTiming(body._loadedAt)) return NextResponse.json({ success: true });

    const w9Url = typeof body.w9Url === "string" ? body.w9Url : "";
    const insuranceUrl = typeof body.insuranceUrl === "string" ? body.insuranceUrl : "";

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

    if (!checkEmailDomain(email)) {
      return NextResponse.json({
        error: "disposable_email",
        message: "We only accept real email addresses (Gmail, Outlook, Yahoo, iCloud, etc.). Temporary or disposable email addresses are not accepted — please use your real email so we can review your application.",
      }, { status: 400 });
    }

    if (!checkEmailLimit(email)) {
      return NextResponse.json({
        error: "duplicate_email",
        message: "We already received an application from this email address today. Our team will review it and contact you within 2-3 business days. Please do not submit the form again.",
      }, { status: 429 });
    }

    if (!checkSpam(notes)) return NextResponse.json({ success: true });

    // Build notes with document URLs appended
    const fullNotes = [
      notes,
      w9Url ? `W9: ${w9Url}` : "W9: Not uploaded",
      insuranceUrl ? `Insurance COI: ${insuranceUrl}` : "Insurance COI: Not uploaded",
    ].filter(Boolean).join("\n");

    const tradesArray = trades.split(",").map((t) => t.trim()).filter(Boolean);

    const generalNotes = [
      `Source: Website Application`,
      `State: ${stateServed}`,
      `Insured: ${insured}`,
      licenseNumber ? `License #: ${licenseNumber}` : null,
      yearsInBusiness ? `Years in Business: ${yearsInBusiness}` : null,
      notes ? `Notes: ${notes}` : null,
      w9Url ? `W9: ${w9Url}` : `W9: Not uploaded`,
      insuranceUrl ? `Insurance COI: ${insuranceUrl}` : `Insurance COI: Not uploaded`,
    ].filter(Boolean).join("\n");

    const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          "Business Name": businessName,
          "Primary Contact Name": contactName,
          "Contact Phone": phone,
          "Contact Email": email,
          "Crew Size": Number(crewSize) || crewSize,
          "Cities Served": citiesServed,
          "Types of Work/Trades": tradesArray,
          "Approval Status": "Pending",
          "General Notes": generalNotes,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Airtable error:", err);
      return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }

    // Send email notification (non-blocking)
    sendNotification({ businessName, contactName, phone, email, trades, stateServed, citiesServed, insured, yearsInBusiness, crewSize, w9Url, insuranceUrl, notes });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
