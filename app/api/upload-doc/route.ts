import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, checkUserAgent, clientIp, validateOrigin, VENDOR_DOC_TYPES } from "../_utils";

const MAX_BYTES = 10 * 1024 * 1024;

// Detect the real file type from its first bytes instead of trusting the browser's MIME type.
function sniffType(head: Uint8Array): { ext: "pdf" | "jpg" | "png"; contentType: string } | null {
  if (head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46) return { ext: "pdf", contentType: "application/pdf" };
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return { ext: "jpg", contentType: "image/jpeg" };
  if (head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47) return { ext: "png", contentType: "image/png" };
  return null;
}

export async function POST(req: NextRequest) {
  try {
    // W9 + COI + the form submit itself: allow a few more requests than the form routes.
    if (!checkRateLimit(clientIp(req.headers), "upload", 6)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    if (!validateOrigin(req.headers.get("origin"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!checkUserAgent(req.headers.get("user-agent"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const contentLength = Number(req.headers.get("content-length") ?? 0);
    if (contentLength > MAX_BYTES + 64 * 1024) {
      return NextResponse.json({ error: "File must be under 10MB." }, { status: 413 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const docType = formData.get("docType");

    if (!(file instanceof File) || typeof docType !== "string" || !(VENDOR_DOC_TYPES as readonly string[]).includes(docType)) {
      return NextResponse.json({ error: "Missing file or docType" }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File must be under 10MB." }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const type = sniffType(bytes);
    if (!type) {
      return NextResponse.json({ error: "Only PDF, JPG, or PNG files are accepted." }, { status: 400 });
    }

    // W9s carry EIN/SSN: store privately with an unguessable name. Only the server can read it back.
    const blob = await put(`vendor-docs/${docType}.${type.ext}`, bytes, {
      access: "private",
      addRandomSuffix: true,
      contentType: type.contentType,
    });

    // The client keeps the pathname as an opaque reference and sends it back with the application.
    return NextResponse.json({ url: blob.pathname });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
