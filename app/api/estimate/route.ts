import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit, checkEmailLimit, sanitize, validateOrigin,
  checkTiming, checkUserAgent, checkPayloadSize, checkEmailDomain, checkSpam,
} from "../_utils";

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN!;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID!;
const TABLE_NAME = "Estimate Requests";
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
        subject: `New Estimate Request — ${data.fullName}`,
        html: `
          <h2 style="color:#0F2040">New Estimate Request Received</h2>
          <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px">
            <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Name</td><td style="padding:8px;border:1px solid #eee">${data.fullName}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Phone</td><td style="padding:8px;border:1px solid #eee">${data.phone}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Email</td><td style="padding:8px;border:1px solid #eee">${data.email}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Project Type</td><td style="padding:8px;border:1px solid #eee">${data.projectType}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Location</td><td style="padding:8px;border:1px solid #eee">${data.projectLocation}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Details</td><td style="padding:8px;border:1px solid #eee">${data.projectDetails || "—"}</td></tr>
          </table>
          <p style="margin-top:16px;color:#666;font-size:12px">Review in Airtable → Estimate Requests</p>
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

    // Honeypot trap
    if (body.website) return NextResponse.json({ success: true });

    // Timing trap
    if (!checkTiming(body._loadedAt)) return NextResponse.json({ success: true });

    const fullName = sanitize(body.fullName);
    const phone = sanitize(body.phone, 30);
    const email = sanitize(body.email, 200);
    const projectType = sanitize(body.projectType, 100);
    const projectLocation = sanitize(body.projectLocation, 200);
    const projectDetails = sanitize(body.projectDetails, 2000);

    if (!fullName || !phone || !email || !projectType || !projectLocation) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Block disposable/fake email providers
    if (!checkEmailDomain(email)) {
      return NextResponse.json({
        error: "disposable_email",
        message: "We only accept real email addresses (Gmail, Outlook, Yahoo, iCloud, etc.). Temporary or disposable email addresses are not accepted — please use your real email so we can follow up on your request.",
      }, { status: 400 });
    }

    // Block same email submitting more than once in 24 hours
    if (!checkEmailLimit(email)) {
      return NextResponse.json({
        error: "duplicate_email",
        message: "We already received a request from this email address today. Our team will review it and get back to you shortly. Please do not submit the form again.",
      }, { status: 429 });
    }

    // Spam keyword filter
    if (!checkSpam(projectDetails)) {
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
          "Full Name": fullName,
          "Phone": phone,
          "Email": email,
          "Project Type": projectType,
          "Project Location": projectLocation,
          "Project Details": projectDetails,
          "Status": "New",
          "Submitted At": new Date().toISOString(),
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Airtable error:", err);
      return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }

    // Send email notification (non-blocking)
    sendNotification({ fullName, phone, email, projectType, projectLocation, projectDetails });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
