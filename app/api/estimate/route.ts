import { NextRequest, NextResponse } from "next/server";

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN!;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID!;
const TABLE_NAME = "Estimate Requests";

export async function POST(req: NextRequest) {
  try {
    const { fullName, phone, email, projectType, projectLocation, projectDetails } = await req.json();

    if (!fullName || !phone || !email || !projectType || !projectLocation) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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
          "Project Details": projectDetails || "",
          "Status": "New",
          "Submitted At": new Date().toISOString(),
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Airtable error:", err);
      return NextResponse.json({ error: "Failed to save to Airtable" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
