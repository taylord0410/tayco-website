import { NextRequest, NextResponse } from "next/server";

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN!;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID!;
const TABLE_NAME = "Subcontractors";

export async function POST(req: NextRequest) {
  try {
    const {
      businessName, contactName, phone, email,
      licenseNumber, yearsInBusiness, crewSize,
      citiesServed, stateServed, insured, trades, notes,
    } = await req.json();

    if (!businessName || !contactName || !phone || !email || !yearsInBusiness || !crewSize || !stateServed || !citiesServed || !insured || !trades) {
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
          "Business Name": businessName,
          "Contact Name": contactName,
          "Phone": phone,
          "Email": email,
          "License Number": licenseNumber || "",
          "Years Experience": yearsInBusiness,
          "Crew Size": crewSize,
          "Cities Served": citiesServed,
          "State": stateServed,
          "Insurance": insured,
          "Trades": trades,
          "Notes": notes || "",
          "Approval Status": "Pending",
          "Source": "Website Application",
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
