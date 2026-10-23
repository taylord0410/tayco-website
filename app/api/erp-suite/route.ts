import { NextRequest, NextResponse } from "next/server";
import {
  getErpSuiteDashboardState,
  createModuleInvitation,
  loadSuiteState,
  probeTakeoffProBridge,
  recordWebsiteSubmissionToSuite,
  saveSuiteState,
  updateOpportunityStage,
  logCrewPayrollHours,
  verifySubcontractorCompliance,
  recordQuickBooksG702Draw,
  TaycoModuleId,
  TaycoCrmOpportunity,
} from "@/lib/tayco_erp_suite_store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const inviteQuery = searchParams.get("invite");
    const tenantQuery = searchParams.get("tenant");

    const snapshot = getErpSuiteDashboardState(inviteQuery, tenantQuery);
    return NextResponse.json({
      success: true,
      ...snapshot,
    });
  } catch (err) {
    console.error("GET /api/erp-suite error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to load TAYCO ERP Suite snapshot" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action || "");

    if (action === "create_invitation") {
      const allowedModules = (Array.isArray(body.allowedModules)
        ? body.allowedModules
        : ["MOD_TAKEOFF_PRO", "MOD_CRM_BIDS"]) as TaycoModuleId[];

      const created = createModuleInvitation({
        guestName: String(body.guestName || "Executive Guest"),
        guestCompany: String(body.guestCompany || "Client Organization"),
        guestEmail: String(body.guestEmail || "executive@client.com"),
        role: String(body.role || "Project Executive / Evaluator"),
        tenantId: String(body.tenantId || "custom_invited_client"),
        allowedModules,
        expiresInDays: Number(body.expiresInDays) || 14,
      });

      const snapshot = getErpSuiteDashboardState(created.code, created.tenantId);
      return NextResponse.json({
        success: true,
        action: "create_invitation",
        invitation: created,
        ...snapshot,
      });
    }

    if (action === "switch_tenant_or_invite") {
      const state = loadSuiteState();
      if (body.invitationCode) {
        state.activeInvitationCode = String(body.invitationCode);
      }
      if (body.tenantId) {
        state.activeTenantId = String(body.tenantId);
      }
      saveSuiteState(state);
      const snapshot = getErpSuiteDashboardState(
        state.activeInvitationCode,
        state.activeTenantId
      );
      return NextResponse.json({
        success: true,
        action: "switch_tenant_or_invite",
        ...snapshot,
      });
    }

    if (action === "create_crm_lead") {
      const createdLead = recordWebsiteSubmissionToSuite("estimate", {
        fullName: String(body.clientName || body.fullName || "Commercial Client"),
        company: String(body.clientName || "Commercial Development Group"),
        email: String(body.contactEmail || "bids@client.com"),
        phone: String(body.contactPhone || "(414) 293-8400"),
        projectType: String(body.title || "Commercial Construction & Turnkey"),
        projectLocation: String(body.location || "Milwaukee, WI"),
        estimatedValueUsd: Number(body.estimatedValueUsd) || 450000,
        sqft: Number(body.sqft) || 6500,
      });

      const snapshot = getErpSuiteDashboardState();
      return NextResponse.json({
        success: true,
        action: "create_crm_lead",
        createdLead,
        ...snapshot,
      });
    }

    if (action === "update_opportunity_stage") {
      const oppId = String(body.opportunityId || body.id || "");
      const newStage = String(body.stage || "Bidding") as TaycoCrmOpportunity["stage"];
      const updatedOpportunity = updateOpportunityStage(oppId, newStage);
      const snapshot = getErpSuiteDashboardState();
      return NextResponse.json({
        success: true,
        action: "update_opportunity_stage",
        updatedOpportunity,
        ...snapshot,
      });
    }

    if (action === "log_crew_payroll_hours") {
      const crewCode = String(body.crewCode || "CREW-CSI-03");
      const additionalHours = Number(body.additionalHours ?? body.hours ?? 8.0);
      const updatedCrew = logCrewPayrollHours(crewCode, additionalHours);
      const snapshot = getErpSuiteDashboardState();
      return NextResponse.json({
        success: true,
        action: "log_crew_payroll_hours",
        updatedCrew,
        ...snapshot,
      });
    }

    if (action === "verify_subcontractor_w9_coi") {
      const subId = String(body.subcontractorId || body.id || "");
      const w9Status = (body.w9Status === "PENDING" ? "PENDING" : "VERIFIED") as "VERIFIED" | "PENDING";
      const coiStatus = (body.coiStatus === "EXPIRING_SOON" ? "EXPIRING_SOON" : "ACTIVE") as "ACTIVE" | "EXPIRING_SOON";
      const updatedSubcontractor = verifySubcontractorCompliance(subId, w9Status, coiStatus);
      const snapshot = getErpSuiteDashboardState();
      return NextResponse.json({
        success: true,
        action: "verify_subcontractor_w9_coi",
        updatedSubcontractor,
        ...snapshot,
      });
    }

    if (action === "record_quickbooks_g702_draw") {
      const progressPct = Number(body.progressPct ?? 60.2);
      const retainagePct = Number(body.retainagePct ?? 10.0);
      const drawResult = recordQuickBooksG702Draw(progressPct, retainagePct);
      const snapshot = getErpSuiteDashboardState();
      return NextResponse.json({
        success: true,
        action: "record_quickbooks_g702_draw",
        drawResult,
        ...snapshot,
      });
    }

    if (action === "calculate_state_tax") {
      const state = loadSuiteState();
      if (body.stateCode) {
        state.selectedTaxState = String(body.stateCode).toUpperCase();
      }
      if (typeof body.taxExempt === "boolean") {
        state.taxExemptCertificateActive = body.taxExempt;
      }
      if (body.exemptionCertificateNumber) {
        state.exemptionCertificateNumber = String(body.exemptionCertificateNumber);
      }
      saveSuiteState(state);
      const snapshot = getErpSuiteDashboardState();
      return NextResponse.json({
        success: true,
        action: "calculate_state_tax",
        ...snapshot,
      });
    }

    if (action === "sync_with_takeoff_pro") {
      const state = loadSuiteState();
      const bridgeResult = await probeTakeoffProBridge(state);
      const snapshot = getErpSuiteDashboardState();
      return NextResponse.json({
        success: true,
        action: "sync_with_takeoff_pro",
        bridgeResult,
        ...snapshot,
      });
    }

    return NextResponse.json(
      { success: false, error: `Unknown action: ${action}` },
      { status: 400 }
    );
  } catch (err) {
    console.error("POST /api/erp-suite error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to process TAYCO ERP Suite action" },
      { status: 500 }
    );
  }
}
