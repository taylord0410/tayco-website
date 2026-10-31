import { DatabaseSync } from "node:sqlite";
import { accessSync, constants, mkdirSync } from "node:fs";
import path from "node:path";
import { requiredSecret, SUBMISSION_SECRET_NAMES, SECURITY_LOG_SECRET_NAMES } from "@/lib/required-secret";

import { assertGuardDeployment } from '@/lib/guard-preflight';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Readiness only: no record counts, credentials, paths or error details leave this endpoint. */
export function GET() {
  try {
    assertGuardDeployment();
    requiredSecret(["TAYCO_SESSION_SECRET"]);
    requiredSecret(SUBMISSION_SECRET_NAMES);
    requiredSecret(SECURITY_LOG_SECRET_NAMES);
    if (process.env.NODE_ENV === "production" && process.env.TAYCO_TRUSTED_INGRESS !== "railway-public-edge") throw new Error("configuration");
    const origin = new URL(process.env.TAYCO_APP_URL || "");
    if (process.env.NODE_ENV === "production" && origin.protocol !== "https:") throw new Error("configuration");
    for (const file of [process.env.TAYCO_AUTH_DB_PATH || path.join(process.cwd(), ".data", "tayco-auth.sqlite"), process.env.TAYCO_ERP_DB_PATH || path.join(process.cwd(), ".data", "tayco-erp.sqlite")]) {
      mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
      accessSync(path.dirname(file), constants.W_OK);
      const db = new DatabaseSync(file);
      try { db.prepare("SELECT 1").get(); } finally { db.close(); }
    }
    return Response.json({ status: "ready" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
