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

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "TAYCO LLC <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
      }),
    });
  } catch (e) {
    console.error("Email failed:", e);
  }
}

async function sendNotification(data: Record<string, string>) {
  await sendEmail(
    NOTIFY_EMAIL,
    `New Vendor Application — ${data.businessName}`,
    `
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
    `
  );
}

async function sendConfirmation(data: Record<string, string>) {
  await sendEmail(
    data.email,
    "We received your application — TAYCO LLC",
    `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <img src="https://taycoturnkey.com/tayco-logo.png" alt="TAYCO LLC" style="height:50px;margin-bottom:24px" />
      <h2 style="color:#0F2040;margin-bottom:8px">Thank you, ${data.contactName}!</h2>
      <p style="color:#444;font-size:15px;line-height:1.6">
        We have received the subcontractor application for <strong>${data.businessName}</strong>.
        Our team will review it and contact you within <strong>2–3 business days</strong>.
      </p>
      <div style="background:#f4f6f9;border-radius:8px;padding:16px;margin:24px 0">
        <p style="margin:0 0 8px 0;font-size:13px;color:#666;font-weight:bold;text-transform:uppercase;letter-spacing:.5px">Application Summary</p>
        <table style="font-size:14px;color:#333;width:100%">
          <tr><td style="padding:4px 0;color:#666">Business:</td><td><strong>${data.businessName}</strong></td></tr>
          <tr><td style="padding:4px 0;color:#666">Trades:</td><td>${data.trades}</td></tr>
          <tr><td style="padding:4px 0;color:#666">State:</td><td>${data.stateServed}</td></tr>
        </table>
      </div>
      <p style="color:#444;font-size:14px;line-height:1.6">
        If you have any questions in the meantime, you can reply to this email or call us at
        <strong>(414) 333-0000</strong>.
      </p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
      <p style="color:#999;font-size:12px;margin:0">TAYCO LLC · 2829 West Wisconsin Ave, Milwaukee, WI 53208</p>
    </div>
    `
  );
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

    const tradesRaw = trades.split(",").map((t) => t.trim()).filter(Boolean);

    // Map form trade names to valid Airtable multi-select options
    const TRADE_ALIASES: Record<string, string> = {
      "Solar Panels": "Solar Installation",
      "Cleaning": "cleaning",
      "Windows & Doors": "Windows/Doors",
      "Fire Damage Restoration": "Fire Protection",
      "Water Damage Restoration": "Waterproofing",
    };
    const VALID_TRADES = new Set([
      "Framing","Drywall","Painting","Roofing","HVAC","Electrical","Plumbing",
      "Concrete","Landscaping","General Labor","Demolition","Flooring","Windows/Doors",
      "Other","Solar Installation","Irrigation","Masonry","Tile","Carpentry","Insulation",
      "Windows","Glass Installation","Waterproofing","Sealants","Steel Erection",
      "Welding","Fire Protection","Sprinklers","cleaning",
    ]);
    const mappedTrades = tradesRaw
      .map((t) => TRADE_ALIASES[t] ?? t)
      .filter((t) => VALID_TRADES.has(t));

    const generalNotes = [
      `Source: Website Application`,
      `Trades: ${trades}`,
      `State: ${stateServed}`,
      `Cities: ${citiesServed}`,
      `Insured: ${insured}`,
      licenseNumber ? `License #: ${licenseNumber}` : null,
      yearsInBusiness ? `Years in Business: ${yearsInBusiness}` : null,
      crewSize ? `Crew: ${crewSize}` : null,
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
          ...(mappedTrades.length > 0 && { "Types of Work/Trades": mappedTrades }),
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

    // Send emails (non-blocking)
    sendNotification({ businessName, contactName, phone, email, trades, stateServed, citiesServed, insured, yearsInBusiness, crewSize, w9Url, insuranceUrl, notes });
    sendConfirmation({ businessName, contactName, email, trades, stateServed });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
