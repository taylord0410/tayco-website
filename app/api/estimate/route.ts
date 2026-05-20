import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, sanitize, validateOrigin } from "../_utils";

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN!;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID!;
const TABLE_NAME = "Estimate Requests";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const origin = req.headers.get("origin");
    if (!validateOrigin(origin)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    // Honeypot: bots fill hidden fields, humans don't
    if (body.website) {
      return NextResponse.json({ success: true });
    }

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
