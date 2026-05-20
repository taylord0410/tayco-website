import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit, checkEmailLimit, sanitize, validateOrigin,
  checkTiming, checkUserAgent, checkPayloadSize, checkEmailDomain, checkSpam,
} from "../_utils";

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN!;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID!;
const TABLE_NAME = "Estimate Requests";

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
        message: "We only accept real email addresses (Gmail, Outlook, Yahoo, iCloud, etc.). Temporary or disposable email addresses are not accepted — we need a real email to be able to contact you about your project.",
      }, { status: 400 });
    }

    // Block same email submitting more than once in 24 hours
    if (!checkEmailLimit(email)) {
      return NextResponse.json({
        error: "duplicate_email",
        message: "We already received a request from this email address today. We will contact you shortly. If this is urgent, please email us directly at info@taycoturnkey.com.",
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

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
