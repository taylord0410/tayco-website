"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type TaycoModuleId =
  | "MOD_TAKEOFF_PRO"
  | "MOD_CRM_BIDS"
  | "MOD_PAYROLL_CREW"
  | "MOD_QUICKBOOKS_ERP"
  | "MOD_TAX_COMPLIANCE"
  | "MOD_INVESTOR_PORTAL";

type CommandViewId =
  | "VIEW_01_COMMAND"
  | "VIEW_02_INVITATIONS"
  | "VIEW_03_CRM"
  | "VIEW_04_PAYROLL"
  | "VIEW_05_QUICKBOOKS"
  | "VIEW_06_TAX"
  | "VIEW_08_INVESTOR"
  | "VIEW_07_TAKEOFF";

interface TaycoModuleDef {
  id: TaycoModuleId;
  code: string;
  title: string;
  shortTitle: string;
  badge: string;
  description: string;
  highlights: string[];
}

interface TaycoTenant {
  id: string;
  name: string;
  subtitle: string;
  hqLocation: string;
  statesCovered: string[];
  activeGmpUsd: number;
  roleLabel: string;
}

interface TaycoInvitation {
  code: string;
  label: string;
  guestName: string;
  guestCompany: string;
  guestEmail: string;
  role: string;
  tenantId: string;
  allowedModules: TaycoModuleId[];
  expiresInDays: number;
  createdAt: string;
  shareUrl: string;
}

interface SCurvePoint {
  weekLabel: string;
  weekNum: number;
  completionPct: number;
  planned_value_usd: number;
  earned_value_usd: number;
  actual_cost_usd: number;
  cash_inflow_net_g702_usd: number;
  cpi: number;
  spi: number;
}

interface CsiDonutSegment {
  id: string;
  code: string;
  label: string;
  category: string;
  amountUsd: number;
  sharePct: number;
  manHours: number;
  crewAssigned: string;
  colorHex: string;
}

interface StateFootprintItem {
  stateCode: string;
  stateName: string;
  active_pipeline_usd: number;
  active_projects_count: number;
  prequalified_vendors_count: number;
  combined_tax_rate_pct: number;
  estimated_material_tax_usd: number;
}

interface BidLevelingRow {
  csiPackage: string;
  tradeTitle: string;
  blueprintSheet: string;
  engineerGmpUsd: number;
  subABid: { vendor: string; amountUsd: number; note: string };
  subBBid: { vendor: string; amountUsd: number; note: string };
  subCBid: { vendor: string; amountUsd: number; note: string };
  awardedVendor: string;
  leveledAwardUsd: number;
  levelingSavingsUsd: number;
  scopeGapDetected: string | null;
  veRfiDescription: string | null;
  veTargetCreditUsd: number;
  veFinalTargetUsd: number;
}

interface PurchaseOrderRow {
  poNumber: string;
  csiDivision: string;
  title: string;
  vendorName: string;
  amountUsd: number;
  leadTimeWeeks: number;
  isCriticalLongLead: boolean;
  leadTimeBadge: string;
  blueprintSheet: string;
  status: string;
  qbAccountNumber: string;
}

interface ChangeOrderRow {
  coNumber: string;
  csiDivision: string;
  title: string;
  reasonCode: string;
  blueprintSheet: string;
  amountUsd: number;
  status: string;
  approvedAt: string;
}

interface DossierSection {
  sectionNumber: number;
  code: string;
  title: string;
  headlineKpi: string;
  summary: string;
  metrics: Array<{ label: string; value: string }>;
  blueprintRef: string;
}

interface ParetoHighlight {
  sheetCode: string;
  sheetTitle: string;
  csiDivision: string;
  allocatedBudgetUsd: number;
  shareOfDirectCostPct: number;
  engineeringSpec: string;
  takeoffViewerUrl: string;
}

interface SuiteSnapshot {
  activeTenant: TaycoTenant;
  activeInvitation: TaycoInvitation;
  tenants: TaycoTenant[];
  modules: TaycoModuleDef[];
  allowedModules: TaycoModuleDef[];
  invitations: TaycoInvitation[];
  analytics_visual_arsenal?: {
    scurve_24_weeks: SCurvePoint[];
    csi_cost_distribution: {
      direct_cost_total_usd: number;
      overhead_and_fee_usd: number;
      total_gmp_usd: number;
      cost_components: CsiDonutSegment[];
      csi_divisions: CsiDonutSegment[];
    };
    state_footprint_analytics: StateFootprintItem[];
    kpi_sparklines: {
      pipeline_trend: number[];
      cpi_trend: number[];
      manhours_trend: number[];
      cashflow_trend: number[];
    };
  };
  crm: {
    pipelineTotalUsd: number;
    activeProjectsCount: number;
    takeoffSyncedCount: number;
    statesCoveredCount: number;
    opportunities: Array<{
      id: string;
      projectCode: string;
      title: string;
      clientName: string;
      contactEmail: string;
      contactPhone: string;
      division: string;
      location: string;
      state: string;
      sqft: number;
      estimatedValueUsd: number;
      stage: string;
      takeoffProjectSlug: string | null;
      csiDivisionsCount: number;
      source: string;
    }>;
    subcontractors: Array<{
      id: string;
      businessName: string;
      contactName: string;
      phone: string;
      email: string;
      stateServed: string;
      citiesServed: string;
      trades: string[];
      crewSize: number;
      yearsInBusiness: number;
      w9Status: string;
      coiStatus: string;
      ytdPaidUsd: number;
    }>;
    bidLevelingMatrix?: {
      projectSlug: string;
      engineKernel: string;
      baseGmpUsd: number;
      leveledBidUsd: number;
      totalLevelingSavingsUsd: number;
      veTargetUsd: number;
      totalVeRfiCreditsUsd: number;
      combinedSavingsUsd: number;
      tradesCount: number;
      subcontractorBidsCount: number;
      scopeGapsDetectedCount: number;
      rows: BidLevelingRow[];
    };
  };
  payroll: {
    totalLaborBudgetUsd: number;
    totalManHours: number;
    totalCrewDays: number;
    weightedAvgHourlyRateUsd: number;
    baseWagesUsd: number;
    fica765Usd: number;
    futaSutaUsd: number;
    workersCompAndFringeUsd: number;
    crews: Array<{
      crewCode: string;
      tradeClassification: string;
      csiDivision: string;
      crewComposition?: string;
      workersCount: number;
      totalManHours: number;
      crewDays: number;
      baseHourlyRateUsd: number;
      fringeHourlyRateUsd: number;
      grossWagesUsd: number;
      ficaUsd: number;
      futaSutaUsd: number;
      workersCompFringeUsd: number;
      totalLoadedLaborUsd: number;
    }>;
  };
  quickbooks: {
    contractGmpUsd: number;
    netChangeOrdersUsd?: number;
    revisedContractGmpUsd?: number;
    aiaG702PayAppNumber: number;
    aiaProgressPct?: number;
    aiaRetainagePct?: number;
    aiaGrossCompletedToDateUsd: number;
    aiaRetainage10PctUsd: number;
    aiaPreviousCertificatesUsd: number;
    aiaCurrentNetPaymentDueUsd: number;
    committedMaterialPosCount: number;
    committedMaterialPosTotalUsd: number;
    purchaseOrders?: PurchaseOrderRow[];
    changeOrders?: ChangeOrderRow[];
    chartOfAccountsMapping: Array<{
      csiDivision: string;
      csiTitle: string;
      qbAccountNumber: string;
      qbAccountName: string;
      qbAccountType: string;
      budgetedUsd: number;
      committedPosUsd: number;
      billedToDateUsd: number;
      varianceUsd: number;
    }>;
    iifExportPreview: string;
  };
  taxCompliance: {
    stateCode: string;
    stateName: string;
    statutoryRatePct: number;
    effectiveRatePct: number;
    sutaBaseRatePct: number;
    constructionRule: string;
    taxExempt: boolean;
    exemptionCertificateNumber: string;
    taxableMaterialsUsd: number;
    exemptLaborUsd: number;
    equipmentAndSubcontractsUsd: number;
    overheadProfitBondUsd: number;
    estimatedSalesUseTaxUsd: number;
    taxSavingsIfExemptUsd: number;
    tribalTeroFeePct?: number;
    tribalTeroFeeUsd?: number;
    totalGmpWithTaxUsd: number;
    form941QuarterlySummary: {
      quarter: string;
      grossWagesSubjectToFicaUsd: number;
      employerFicaUsd: number;
      employeeFicaWithheldUsd: number;
      federalIncomeTaxWithheldUsd: number;
      futaSutaEmployerUsd: number;
      totalForm941DepositUsd: number;
    };
    availableStates: Array<{
      stateCode: string;
      stateName: string;
      combinedSalesUseTaxPct: number;
      sutaBaseRatePct: number;
      constructionRule: string;
    }>;
    vendors1099Nec: Array<{
      id: string;
      businessName: string;
      stateServed: string;
      tinMasked: string;
      ytdPaidUsd: number;
      w9Status: string;
      coiStatus: string;
      thresholdExceeded: boolean;
      filingStatus: string;
    }>;
  };
  investorDossier?: {
    dossierId: string;
    projectSlug: string;
    projectTitle: string;
    location: string;
    cabinsCount: number;
    totalSqFt: number;
    baseGmpUsd: number;
    leveledBidUsd: number;
    veTargetUsd: number;
    revisedContractWithCosUsd: number;
    costPerCabinUsd: number;
    costPerSqFtUsd: number;
    sha256LineItemsCount: number;
    tripleAiConsensusPct: number;
    sheetsCount: number;
    subViewsCount: number;
    sections: DossierSection[];
    paretoHighlights: ParetoHighlight[];
  };
  takeoffBridge: {
    online: boolean;
    url: string;
    lastSyncAt: string;
    rustEngineVersion: string;
    activeKernelsCount: number;
    featuredProjectSlug: string;
    featuredProjectGmpUsd: number;
    leveledBidUsd?: number;
    veTargetUsd?: number;
    revisedContractUsd?: number;
    evmCpi: number;
    evmSpi: number;
    monteCarloP80ContingencyUsd: number;
  };
}

function buildSparklinePoints(values: number[], width = 140, height = 34): string {
  if (!values || values.length === 0) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values
    .map((v, i) => {
      const x = (i / Math.max(1, values.length - 1)) * (width - 8) + 4;
      const y = height - 4 - ((v - min) / span) * (height - 10);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

const TAYCO_GOLD = "#C9A84C";
const TAYCO_GOLD_LIGHT = "#F3D37A";
const TAYCO_ORANGE = "#F97316";
const TAYCO_EMERALD = "#10B981";
const TAYCO_NAVY = "#1B3A6B";
const TAYCO_DARK_NAVY = "#0F2040";

const CRM_STAGE_OPTIONS = [
  "Takeoff Synced",
  "Bidding",
  "Contract Awarded",
  "New Website Lead",
  "Due Diligence",
] as const;

export default function TaycoMultiTenantPortalPage() {
  const [snapshot, setSnapshot] = useState<SuiteSnapshot | null>(null);
  const [activeView, setActiveView] = useState<CommandViewId>("VIEW_01_COMMAND");
  const [showInviteBuilder, setShowInviteBuilder] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // TAYCO Executive Cognitive Density & Raking Light Angle States
  const [densityMode, setDensityMode] = useState<"calm" | "deep">("calm");
  const [lightAngle, setLightAngle] = useState<number>(45);
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});

  // Interactive Chart States
  const [scurveWeekIdx, setScurveWeekIdx] = useState<number>(6);
  const [donutLayerMode, setDonutLayerMode] = useState<"components" | "divisions">("divisions");
  const [selectedDonutIdx, setSelectedDonutIdx] = useState<number>(0);

  // AIA G702/G703 Interactive Simulator
  const [aiaProgressPct, setAiaProgressPct] = useState<number>(60.2);
  const [aiaRetainagePct, setAiaRetainagePct] = useState<number>(10.0);
  const [aiaCommitNotice, setAiaCommitNotice] = useState<string | null>(null);

  // CRM Stage Filter & Notice
  const [crmStageFilter, setCrmStageFilter] = useState<string>("ALL");
  const [crmUpdateNotice, setCrmUpdateNotice] = useState<string | null>(null);

  // Payroll Crew Hours Logger State
  const [selectedCrewCode, setSelectedCrewCode] = useState<string>("CREW-CSI-03");
  const [crewHoursToAdd, setCrewHoursToAdd] = useState<string>("8.0");
  const [payrollLogNotice, setPayrollLogNotice] = useState<string | null>(null);

  // Tax 1099-NEC Verification Notice
  const [taxVerifyNotice, setTaxVerifyNotice] = useState<string | null>(null);

  // Bridge sync
  const [syncingBridge, setSyncingBridge] = useState(false);
  const [bridgeBannerMsg, setBridgeBannerMsg] = useState<string | null>(null);

  // Invite Builder Form
  const [guestName, setGuestName] = useState("Robert Vance");
  const [guestCompany, setGuestCompany] = useState("Vance Commercial Capital & CPA");
  const [guestEmail, setGuestEmail] = useState("rvance@vancecapital.com");
  const [guestRole, setGuestRole] = useState("Client Executive / CPA Evaluator");
  const [expiresInDays, setExpiresInDays] = useState(14);
  const [selectedModules, setSelectedModules] = useState<TaycoModuleId[]>([
    "MOD_TAKEOFF_PRO",
    "MOD_CRM_BIDS",
    "MOD_QUICKBOOKS_ERP",
  ]);
  const [createdInviteBanner, setCreatedInviteBanner] = useState<TaycoInvitation | null>(null);

  // Quick Add CRM Bid Inline
  const [newLeadTitle, setNewLeadTitle] = useState("");
  const [newLeadClient, setNewLeadClient] = useState("");
  const [newLeadLocation, setNewLeadLocation] = useState("Milwaukee, WI");
  const [newLeadValue, setNewLeadValue] = useState("680000");

  // QuickBooks preview mode
  const [showIifModal, setShowIifModal] = useState(false);

  const toggleTableExpand = (key: string) => {
    setExpandedTables((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isTableVisible = (key: string) => {
    return densityMode === "deep" || Boolean(expandedTables[key]);
  };

  const handleSurfaceMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const rx = ((0.5 - py) * 4.5).toFixed(2);
      const ry = ((px - 0.5) * 5.5).toFixed(2);
      el.style.setProperty("--response-px", px.toFixed(3));
      el.style.setProperty("--response-py", py.toFixed(3));
      el.style.setProperty("--rx", `${rx}deg`);
      el.style.setProperty("--ry", `${ry}deg`);
    },
    []
  );

  const handleSurfaceMouseLeave = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }, []);

  const fetchSuite = useCallback(async (inviteCode?: string, tenantId?: string) => {
    const params = new URLSearchParams();
    if (inviteCode) params.set("invite", inviteCode);
    if (tenantId) params.set("tenant", tenantId);
    const res = await fetch(`/api/erp-suite?${params.toString()}`);
    if (res.ok) {
      const data: SuiteSnapshot = await res.json();
      setSnapshot(data);
      if (typeof data.quickbooks?.aiaProgressPct === "number") {
        setAiaProgressPct(data.quickbooks.aiaProgressPct);
      }
      if (typeof data.quickbooks?.aiaRetainagePct === "number") {
        setAiaRetainagePct(data.quickbooks.aiaRetainagePct);
      }
    }
  }, []);

  useEffect(() => {
    const search = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const inviteParam = search?.get("invite") || undefined;
    const tabParam = search?.get("tab") as TaycoModuleId | null;
    if (tabParam === "MOD_CRM_BIDS") setActiveView("VIEW_03_CRM");
    else if (tabParam === "MOD_PAYROLL_CREW") setActiveView("VIEW_04_PAYROLL");
    else if (tabParam === "MOD_QUICKBOOKS_ERP") setActiveView("VIEW_05_QUICKBOOKS");
    else if (tabParam === "MOD_TAX_COMPLIANCE") setActiveView("VIEW_06_TAX");
    else if (tabParam === "MOD_INVESTOR_PORTAL") setActiveView("VIEW_08_INVESTOR");
    else if (tabParam === "MOD_TAKEOFF_PRO") setActiveView("VIEW_07_TAKEOFF");

    fetchSuite(inviteParam);
  }, [fetchSuite]);

  async function handleSwitchTenant(tenantId: string) {
    const res = await fetch("/api/erp-suite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "switch_tenant_or_invite", tenantId }),
    });
    if (res.ok) {
      const data: SuiteSnapshot = await res.json();
      setSnapshot(data);
    }
  }

  async function handleSwitchInvitation(invitationCode: string) {
    const res = await fetch("/api/erp-suite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "switch_tenant_or_invite", invitationCode }),
    });
    if (res.ok) {
      const data: SuiteSnapshot = await res.json();
      setSnapshot(data);
    }
  }

  function toggleModuleCheckbox(modId: TaycoModuleId) {
    setSelectedModules((prev) =>
      prev.includes(modId) ? prev.filter((id) => id !== modId) : [...prev, modId]
    );
  }

  async function handleCreateAndPreviewInvite(e: React.FormEvent) {
    e.preventDefault();
    if (selectedModules.length === 0) return;
    const res = await fetch("/api/erp-suite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_invitation",
        guestName,
        guestCompany,
        guestEmail,
        role: guestRole,
        expiresInDays,
        allowedModules: selectedModules,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setSnapshot(data);
      setCreatedInviteBanner(data.invitation);
    }
  }

  async function handleSyncTakeoffPro() {
    setSyncingBridge(true);
    setBridgeBannerMsg(null);
    try {
      const res = await fetch("/api/erp-suite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync_with_takeoff_pro" }),
      });
      if (res.ok) {
        const data = await res.json();
        setSnapshot(data);
        setBridgeBannerMsg(
          `✅ Live Multi-Endpoint Sync with Takeoff Pro (:8085 · ${data.bridgeResult?.source || "CSI-32 Bridge"}): Son of a Star $855,525.23 Base GMP · $824,875.23 Leveled · $798,175.23 VE · 6,536.0 MH · 8 POs ($375,012.51) · 4 COs (+$26,578.85)`
        );
      }
    } finally {
      setSyncingBridge(false);
    }
  }

  async function handleTaxStateChange(stateCode: string, taxExempt: boolean) {
    const res = await fetch("/api/erp-suite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "calculate_state_tax",
        stateCode,
        taxExempt,
      }),
    });
    if (res.ok) {
      const data: SuiteSnapshot = await res.json();
      setSnapshot(data);
    }
  }

  async function handleCreateQuickLead(e: React.FormEvent) {
    e.preventDefault();
    if (!newLeadTitle.trim()) return;
    const res = await fetch("/api/erp-suite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_crm_lead",
        title: newLeadTitle,
        clientName: newLeadClient || "Commercial Client",
        location: newLeadLocation,
        estimatedValueUsd: Number(newLeadValue) || 550000,
      }),
    });
    if (res.ok) {
      const data: SuiteSnapshot = await res.json();
      setSnapshot(data);
      setNewLeadTitle("");
      setNewLeadClient("");
    }
  }

  async function handleUpdateOpportunityStage(opportunityId: string, newStage: string) {
    const res = await fetch("/api/erp-suite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_opportunity_stage",
        opportunityId,
        stage: newStage,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setSnapshot(data);
      setCrmUpdateNotice(
        `✅ CRM Stage Updated: ${data.updatedOpportunity?.projectCode || opportunityId} → "${newStage}"`
      );
    }
  }

  async function handleLogCrewPayrollHours(e: React.FormEvent) {
    e.preventDefault();
    const hoursNum = Number(crewHoursToAdd);
    if (!Number.isFinite(hoursNum) || hoursNum === 0) return;
    const res = await fetch("/api/erp-suite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "log_crew_payroll_hours",
        crewCode: selectedCrewCode,
        additionalHours: hoursNum,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setSnapshot(data);
      setPayrollLogNotice(
        `✅ Logged +${hoursNum.toFixed(1)} MH to ${selectedCrewCode} — Updated Crew Total: ${data.updatedCrew?.totalManHours?.toFixed(1)} MH ($${data.updatedCrew?.totalLoadedLaborUsd?.toLocaleString("en-US", { minimumFractionDigits: 2 })} Loaded WH-347)`
      );
    }
  }

  async function handleCommitQuickBooksDraw() {
    const res = await fetch("/api/erp-suite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "record_quickbooks_g702_draw",
        progressPct: aiaProgressPct,
        retainagePct: aiaRetainagePct,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setSnapshot(data);
      setAiaCommitNotice(
        `✅ Committed AIA G702 Pay App #${data.drawResult?.payAppNumber || 3} (${aiaProgressPct.toFixed(1)}% Complete · ${aiaRetainagePct.toFixed(1)}% Retainage): Net Payment Due $${Number(data.drawResult?.netPaymentDueUsd || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} persisted to QuickBooks Ledger.`
      );
    }
  }

  async function handleVerifyVendorCompliance(subcontractorId: string, businessName: string) {
    const res = await fetch("/api/erp-suite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "verify_subcontractor_w9_coi",
        subcontractorId,
        w9Status: "VERIFIED",
        coiStatus: "ACTIVE",
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setSnapshot(data);
      setTaxVerifyNotice(
        `✅ Verified W-9 & COI Insurance for ${businessName} (${subcontractorId}) → Status promoted to READY_TO_EFILE_1099.`
      );
    }
  }

  function downloadFile(filename: string, content: string, mime = "text/plain") {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!snapshot) {
    return (
      <main className="min-h-screen pt-20 flex items-center justify-center" style={{ background: TAYCO_DARK_NAVY }}>
        <div className="text-center text-white">
          <div className="text-3xl font-black mb-2" style={{ color: TAYCO_GOLD }}>
            TAYCO LLC — EXECUTIVE COMMAND CENTER
          </div>
          <p className="text-sm text-gray-300">Loading Multi-Tenant ERP Suite &amp; Takeoff Pro Bridge (:8085)...</p>
        </div>
      </main>
    );
  }

  const allowedIds = snapshot.allowedModules.map((m) => m.id);
  const isGuestRestricted = snapshot.activeInvitation.code !== "INV-TAYCO-MASTER";

  const scurveSeries = snapshot.analytics_visual_arsenal?.scurve_24_weeks || [];
  const activeScurvePoint =
    scurveSeries[Math.min(scurveWeekIdx, Math.max(0, scurveSeries.length - 1))] || {
      weekLabel: "W14",
      weekNum: 14,
      completionPct: 60.2,
      planned_value_usd: 525500.0,
      earned_value_usd: 515011.33,
      actual_cost_usd: 495203.2,
      cash_inflow_net_g702_usd: 463510.2,
      cpi: 1.04,
      spi: 0.98,
    };

  const csiDist = snapshot.analytics_visual_arsenal?.csi_cost_distribution;
  const activeDonutSegments =
    donutLayerMode === "divisions"
      ? csiDist?.csi_divisions || []
      : csiDist?.cost_components || [];
  const selectedSegment =
    activeDonutSegments[Math.min(selectedDonutIdx, Math.max(0, activeDonutSegments.length - 1))] ||
    activeDonutSegments[0];

  const stateFootprint = snapshot.analytics_visual_arsenal?.state_footprint_analytics || [];
  const sparklines = snapshot.analytics_visual_arsenal?.kpi_sparklines || {
    pipeline_trend: [3.2, 3.6, 4.1, 4.4, 4.9, 5.2, 5.55, 5.88],
    cpi_trend: [1.01, 1.02, 1.02, 1.03, 1.03, 1.04, 1.04, 1.04],
    manhours_trend: [820, 1640, 2590, 3480, 4390, 5210, 5940, 6536],
    cashflow_trend: [86.7, 161.5, 241.3, 320.2, 390.8, 463.5, 544.3, 626.8],
  };

  // Complete 8 Command Views covering all 6 Enterprise Modules
  const navItems: Array<{
    viewId: CommandViewId;
    num: string;
    label: string;
    badge: string;
    moduleRequirement: TaycoModuleId | "ALWAYS";
    legacyBtnId?: string;
  }> = [
    {
      viewId: "VIEW_01_COMMAND",
      num: "01",
      label: "Executive Overview",
      badge: "4 SVG Charts",
      moduleRequirement: "ALWAYS",
    },
    {
      viewId: "VIEW_02_INVITATIONS",
      num: "02",
      label: "B2B Access & Invitations",
      badge: `${snapshot.allowedModules.length}/6 Active`,
      moduleRequirement: "ALWAYS",
    },
    {
      viewId: "VIEW_03_CRM",
      num: "03",
      label: "1. CRM & Bid Leveling",
      badge: "$824.9K Bid",
      moduleRequirement: "MOD_CRM_BIDS",
      legacyBtnId: "tab-btn-MOD_CRM_BIDS",
    },
    {
      viewId: "VIEW_04_PAYROLL",
      num: "04",
      label: "2. Payroll & WH-347",
      badge: `${snapshot.payroll.totalManHours.toFixed(0)} MH`,
      moduleRequirement: "MOD_PAYROLL_CREW",
      legacyBtnId: "tab-btn-MOD_PAYROLL_CREW",
    },
    {
      viewId: "VIEW_05_QUICKBOOKS",
      num: "05",
      label: "3. QuickBooks & 8 POs",
      badge: "8 POs · 4 COs",
      moduleRequirement: "MOD_QUICKBOOKS_ERP",
      legacyBtnId: "tab-btn-MOD_QUICKBOOKS_ERP",
    },
    {
      viewId: "VIEW_06_TAX",
      num: "06",
      label: "4. 9-State Tax & TERO",
      badge: "9 States",
      moduleRequirement: "MOD_TAX_COMPLIANCE",
      legacyBtnId: "tab-btn-MOD_TAX_COMPLIANCE",
    },
    {
      viewId: "VIEW_08_INVESTOR",
      num: "07",
      label: "📊 5. Investor & Lender Dossier",
      badge: "7 Sections",
      moduleRequirement: "MOD_INVESTOR_PORTAL",
      legacyBtnId: "tab-btn-MOD_INVESTOR_PORTAL",
    },
    {
      viewId: "VIEW_07_TAKEOFF",
      num: "08",
      label: "📐 Takeoff Pro Bridge",
      badge: "21 Kernels",
      moduleRequirement: "MOD_TAKEOFF_PRO",
      legacyBtnId: "tab-btn-MOD_TAKEOFF_PRO",
    },
  ];

  const visibleNavItems = navItems.filter(
    (item) =>
      item.moduleRequirement === "ALWAYS" ||
      allowedIds.includes(item.moduleRequirement)
  );

  const normalizedLightPx = ((lightAngle - 15) / 70).toFixed(3);
  const cardSurfaceClass =
    "tayco-bento-card bg-[#0F2040]/85 backdrop-blur-xl border border-[#C9A84C]/25 shadow-2xl text-white transition-all duration-300";

  const livingCardInlineStyle: React.CSSProperties = {
    ["--sculpture-angle" as string]: `${lightAngle}deg`,
    ["--response-px" as string]: normalizedLightPx,
    ["--response-py" as string]: "0.28",
    background: `linear-gradient(${lightAngle}deg, rgba(27, 58, 107, 0.72) 0%, rgba(15, 32, 64, 0.92) 58%, rgba(201, 168, 76, 0.12) 100%)`,
  };

  const simContractGmp = snapshot.quickbooks.contractGmpUsd;
  const simGrossCompleted = Number(((simContractGmp * aiaProgressPct) / 100).toFixed(2));
  const simRetainageHeld = Number(((simGrossCompleted * aiaRetainagePct) / 100).toFixed(2));
  const simTotalEarnedLessRetainage = Number((simGrossCompleted - simRetainageHeld).toFixed(2));
  const simPreviousCertificates = snapshot.quickbooks.aiaPreviousCertificatesUsd;
  const simCurrentNetPayment = Math.max(
    0,
    Number((simTotalEarnedLessRetainage - simPreviousCertificates).toFixed(2))
  );

  const filteredOpportunities =
    crmStageFilter === "ALL"
      ? snapshot.crm.opportunities
      : snapshot.crm.opportunities.filter((o) => o.stage === crmStageFilter);

  const bidMatrix = snapshot.crm.bidLevelingMatrix;
  const purchaseOrders = snapshot.quickbooks.purchaseOrders || [];
  const changeOrders = snapshot.quickbooks.changeOrders || [];
  const dossier = snapshot.investorDossier;

  return (
    <main
      className="min-h-screen pt-16 text-slate-100"
      style={{
        ["--dark-navy" as string]: TAYCO_DARK_NAVY,
        ["--navy" as string]: TAYCO_NAVY,
        ["--gold" as string]: TAYCO_GOLD,
        ["--gold-light" as string]: TAYCO_GOLD_LIGHT,
        ["--orange" as string]: TAYCO_ORANGE,
        ["--emerald" as string]: TAYCO_EMERALD,
        ["--sculpture-angle" as string]: `${lightAngle}deg`,
        ["--response-px" as string]: normalizedLightPx,
        background: `radial-gradient(circle at ${15 + (lightAngle - 15) * 0.8}% 12%, rgba(201,168,76,0.18), transparent 36%), radial-gradient(circle at 85% 22%, rgba(249,115,22,0.11), transparent 36%), linear-gradient(${lightAngle + 95}deg, #09152B 0%, #0F2040 52%, #1B3A6B 100%)`,
      }}
    >
      {/* ── GUEST PREVIEW BANNER ── */}
      {isGuestRestricted && (
        <div
          id="tayco-guest-preview-banner"
          className="border-b px-4 py-2.5"
          style={{ background: "rgba(249, 115, 22, 0.18)", borderColor: TAYCO_GOLD }}
        >
          <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs sm:text-sm text-amber-200">
              <strong>👁️ Scoped Partner Credential Active ({snapshot.activeInvitation.guestCompany}):</strong>{" "}
              Showing{" "}
              <strong>
                {snapshot.allowedModules.length} of {snapshot.modules.length} authorized modules
              </strong>{" "}
              under credential{" "}
              <code className="font-mono font-bold px-1.5 py-0.5 bg-amber-400/20 text-amber-100 rounded">
                {snapshot.activeInvitation.code}
              </code>
              .
            </div>
            <button
              type="button"
              id="btn-restore-master-admin"
              data-magnetic
              onClick={() => handleSwitchInvitation("INV-TAYCO-MASTER")}
              className="px-3.5 py-1.5 rounded-lg text-xs font-extrabold text-slate-950 shrink-0"
              style={{ background: TAYCO_GOLD }}
            >
              🔓 Restore Full Admin View (6/6)
            </button>
          </div>
        </div>
      )}

      {/* ── TAYCO COMMAND APP-SHELL RESPONSIVE GRID ── */}
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-[270px_minmax(0,1fr)] min-h-[calc(100vh-4rem)]">
        {/* ── A) TAYCO COMMAND LEFT SIDEBAR ── */}
        <aside
          id="tayco-command-sidebar"
          className="border-b lg:border-b-0 lg:border-r border-[#C9A84C]/20 p-4 sm:p-5 flex flex-col justify-between gap-6"
          style={{
            background: "linear-gradient(180deg, rgba(15, 32, 64, 0.96) 0%, rgba(9, 21, 43, 0.98) 100%)",
          }}
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-md"
                  style={{
                    background: "rgba(201,168,76,0.2)",
                    color: TAYCO_GOLD_LIGHT,
                    border: `1px solid ${TAYCO_GOLD}`,
                  }}
                >
                  TC
                </div>
                <div>
                  <div
                    className="text-xs font-black tracking-wider uppercase"
                    style={{ color: TAYCO_GOLD }}
                  >
                    TAYCO COMMAND OS
                  </div>
                  <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{snapshot.activeInvitation.code}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                data-magnetic
                onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                className="lg:hidden px-3 py-1.5 rounded-lg border border-white/15 text-xs font-bold text-slate-200"
              >
                {mobileSidebarOpen ? "Hide Menu ▴" : "Modules (01-08) ▾"}
              </button>
            </div>

            {/* Numbered Navigation 01 - 08 */}
            <nav
              id="tayco-portal-module-tabs"
              className={`${mobileSidebarOpen ? "flex" : "hidden"} lg:flex flex-col gap-1.5`}
              aria-label="Command Center Navigation"
            >
              <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-200/80 px-2 mb-1">
                Command Views (01–08 · 6 Modules)
              </div>
              {visibleNavItems.map((item) => {
                const isActive = activeView === item.viewId;
                return (
                  <button
                    key={item.viewId}
                    type="button"
                    data-magnetic
                    id={item.legacyBtnId || `nav-btn-${item.viewId}`}
                    onClick={() => {
                      setActiveView(item.viewId);
                      if (item.viewId === "VIEW_02_INVITATIONS") {
                        setShowInviteBuilder(true);
                      }
                      setMobileSidebarOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center justify-between gap-2 ${
                      isActive
                        ? "shadow-lg font-extrabold"
                        : "text-slate-200 hover:bg-white/10 hover:text-white font-semibold"
                    }`}
                    style={
                      isActive
                        ? {
                            background:
                              "linear-gradient(135deg, rgba(201,168,76,0.28), rgba(27,58,107,0.92))",
                            border: `1px solid ${TAYCO_GOLD}`,
                            color: "#FFFFFF",
                          }
                        : { border: "1px solid transparent" }
                    }
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="font-mono text-xs font-black px-1.5 py-0.5 rounded shrink-0"
                        style={{
                          background: isActive ? TAYCO_GOLD : "rgba(255,255,255,0.08)",
                          color: isActive ? TAYCO_DARK_NAVY : TAYCO_GOLD_LIGHT,
                        }}
                      >
                        {item.num}
                      </span>
                      <span className="text-xs truncate">{item.label}</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-amber-200 shrink-0">
                      {item.badge}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* ── TAYCO SIDEBAR BRIDGE CARD WITH ORBITAL SVG RINGS ── */}
          <div
            id="tayco-sidebar-bridge"
            data-response-kind="surface"
            onMouseMove={handleSurfaceMouseMove}
            onMouseLeave={handleSurfaceMouseLeave}
            className="tayco-bento-card relative overflow-hidden rounded-2xl p-4 border border-[#C9A84C]/30"
            style={{
              background: "linear-gradient(150deg, #1B3A6B 0%, #0F2040 100%)",
            }}
          >
            <div className="response-wash pointer-events-none" aria-hidden="true" />
            <svg
              className="preview-orbits absolute -right-8 -bottom-8 w-36 h-36 pointer-events-none opacity-40"
              viewBox="0 0 160 160"
              fill="none"
            >
              <circle cx="80" cy="80" r="68" stroke={TAYCO_GOLD} strokeWidth="1" strokeDasharray="4 4" />
              <circle cx="80" cy="80" r="48" stroke={TAYCO_EMERALD} strokeWidth="1.2" />
              <circle cx="80" cy="80" r="28" stroke={TAYCO_ORANGE} strokeWidth="1" />
              <circle cx="80" cy="12" r="3.5" fill={TAYCO_GOLD} />
              <circle cx="32" cy="80" r="3" fill={TAYCO_EMERALD} />
            </svg>

            <div className="relative z-10">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-emerald-300 mb-1">
                <span>● Takeoff Pro (:8085)</span>
                <span>v{snapshot.takeoffBridge.rustEngineVersion}</span>
              </div>
              <div className="text-sm font-black text-white">
                {snapshot.takeoffBridge.activeKernelsCount} Rust Kernels Active
              </div>
              <div className="text-[11px] text-slate-200 mt-0.5">
                32 ARCH-D / 87 Sub-Views · ${snapshot.takeoffBridge.featuredProjectGmpUsd.toLocaleString()} GMP
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  data-magnetic
                  onClick={handleSyncTakeoffPro}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-black text-slate-950 transition-transform hover:scale-105"
                  style={{ background: TAYCO_GOLD }}
                >
                  {syncingBridge ? "Syncing..." : "Sync :8085"}
                </button>
                <a
                  href={snapshot.takeoffBridge.url}
                  target="_blank"
                  rel="noreferrer"
                  data-magnetic
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-[#C9A84C]/40 text-amber-100 hover:bg-white/10"
                >
                  Open Blueprint ↗
                </a>
              </div>
            </div>
          </div>
        </aside>

        {/* ── B) MAIN WORKSPACE & TAYCO EXECUTIVE MASTHEAD ── */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 overflow-x-hidden">
          {/* ── TAYCO EXECUTIVE TOP MASTHEAD ── */}
          <header
            id="tayco-command-masthead"
            data-response-kind="surface"
            onMouseMove={handleSurfaceMouseMove}
            onMouseLeave={handleSurfaceMouseLeave}
            className={`${cardSurfaceClass} rounded-2xl p-5 sm:p-6 relative overflow-hidden`}
            style={livingCardInlineStyle}
          >
            <div className="response-wash pointer-events-none" aria-hidden="true" />
            <div id="tayco-tenant-bar" className="relative z-10 space-y-5">
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest"
                      style={{
                        background: "rgba(201,168,76,0.22)",
                        color: TAYCO_GOLD_LIGHT,
                        border: `1px solid ${TAYCO_GOLD}`,
                      }}
                    >
                      TAYCO TOTAL MANAGEMENT COMMAND CENTER
                    </span>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
                      style={{
                        background: "rgba(16,185,129,0.16)",
                        color: "#A7F3D0",
                        borderColor: "rgba(16,185,129,0.4)",
                      }}
                    >
                      📐 Live Takeoff Pro v5.0 (:8085) · 6/6 Enterprise Modules Connected
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
                    {snapshot.activeTenant.name}
                  </h1>
                  <p className="text-xs text-slate-200 mt-0.5">
                    {snapshot.activeTenant.subtitle} · Active Role:{" "}
                    <strong style={{ color: TAYCO_GOLD_LIGHT }}>{snapshot.activeInvitation.role}</strong>
                  </p>
                </div>

                {/* Progressive Disclosure Toggle + Interactive Raking Light Angle Scrubber */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center bg-[#09152B]/80 p-1 rounded-xl border border-[#C9A84C]/30">
                    <button
                      type="button"
                      id="btn-density-calm"
                      data-magnetic
                      onClick={() => setDensityMode("calm")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                        densityMode === "calm"
                          ? "text-slate-950 shadow"
                          : "text-slate-200 hover:text-white"
                      }`}
                      style={densityMode === "calm" ? { background: TAYCO_GOLD } : undefined}
                    >
                      🧘 Calm Overview
                    </button>
                    <button
                      type="button"
                      id="btn-density-deep"
                      data-magnetic
                      onClick={() => setDensityMode("deep")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                        densityMode === "deep"
                          ? "text-slate-950 shadow"
                          : "text-slate-200 hover:text-white"
                      }`}
                      style={densityMode === "deep" ? { background: TAYCO_GOLD } : undefined}
                    >
                      🔬 Deep-Dive Tables
                    </button>
                  </div>

                  <div
                    id="tayco-raking-light-control"
                    className="flex items-center gap-2.5 bg-[#09152B]/80 px-3.5 py-2 rounded-xl border border-[#C9A84C]/30"
                  >
                    <label
                      htmlFor="input-raking-light-angle"
                      className="text-xs font-extrabold whitespace-nowrap"
                      style={{ color: TAYCO_GOLD_LIGHT }}
                    >
                      ☀️ Raking Light Angle: {lightAngle}°
                    </label>
                    <input
                      id="input-raking-light-angle"
                      type="range"
                      min={15}
                      max={85}
                      value={lightAngle}
                      onChange={(e) => setLightAngle(Number(e.target.value))}
                      className="w-24 accent-amber-400 cursor-pointer"
                      aria-label="Raking Light Angle"
                    />
                  </div>
                </div>
              </div>

              {/* Second Row: Tenant Selector, Invitation Selector & Quick Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-4 border-t border-white/15 items-end">
                <div className="md:col-span-4">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-200/90 mb-1">
                    🏢 ACTIVE ORGANIZATION / TENANT
                  </label>
                  <select
                    id="select-tayco-tenant"
                    value={snapshot.activeTenant.id}
                    onChange={(e) => handleSwitchTenant(e.target.value)}
                    className="w-full rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-slate-950 bg-white focus:outline-none"
                  >
                    {snapshot.tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} — (${(t.activeGmpUsd / 1e6).toFixed(2)}M Active)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-200/90 mb-1">
                    🎟️ SESSION CREDENTIAL / PARTNER ACCESS TOKEN (FILTERS MODULES LIVE)
                  </label>
                  <select
                    id="select-active-invitation"
                    value={snapshot.activeInvitation.code}
                    onChange={(e) => handleSwitchInvitation(e.target.value)}
                    className="w-full rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-slate-950 bg-white focus:outline-none"
                  >
                    {snapshot.invitations.map((inv) => (
                      <option key={inv.code} value={inv.code}>
                        {inv.label} [{inv.code}]
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    id="btn-open-invite-builder"
                    data-magnetic
                    onClick={() => setShowInviteBuilder(!showInviteBuilder)}
                    className="flex-1 px-3 py-2 rounded-xl text-xs font-black text-slate-950 transition-transform hover:scale-[1.02] shadow-md"
                    style={{ background: TAYCO_GOLD }}
                  >
                    🎟️ {showInviteBuilder ? "Hide Invite Builder" : "Create Scoped Invitation"}
                  </button>
                  <button
                    type="button"
                    id="btn-sync-takeoff-live"
                    data-magnetic
                    onClick={handleSyncTakeoffPro}
                    disabled={syncingBridge}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-white border border-[#C9A84C]/40 hover:bg-white/10"
                  >
                    {syncingBridge ? "🔄..." : "📐 Sync :8085"}
                  </button>
                </div>
              </div>

              {bridgeBannerMsg && (
                <div className="px-4 py-2.5 rounded-xl bg-emerald-950/90 border border-emerald-400/40 text-xs text-emerald-200 font-semibold">
                  {bridgeBannerMsg}
                </div>
              )}
            </div>
          </header>

          {/* ── INTERACTIVE MODULE INVITATION BUILDER ── */}
          {(showInviteBuilder || activeView === "VIEW_02_INVITATIONS") && (
            <section
              id="tayco-invitation-builder-card"
              data-response-kind="surface"
              onMouseMove={handleSurfaceMouseMove}
              onMouseLeave={handleSurfaceMouseLeave}
              className={`${cardSurfaceClass} rounded-2xl p-6 border-2 relative overflow-hidden`}
              style={{ ...livingCardInlineStyle, borderColor: TAYCO_GOLD }}
            >
              <div className="response-wash pointer-events-none" aria-hidden="true" />
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/15">
                <div>
                  <span
                    className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full"
                    style={{ background: "rgba(201,168,76,0.22)", color: TAYCO_GOLD_LIGHT }}
                  >
                    🎟️ B2B MODULE-SCOPED INVITATION GENERATOR
                  </span>
                  <h2 className="text-xl font-black text-white mt-1">
                    Invite a Client, Investor, or CPA to Specific Modules
                  </h2>
                  <p className="text-xs text-slate-200">
                    Select the exact modules you want to authorize for your partner meeting. The invited guest will only see the authorized tabs.
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateAndPreviewInvite} className="relative z-10 mt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1">Guest Name *</label>
                    <input
                      id="invite-input-name"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      required
                      className="w-full rounded-lg px-3 py-2 text-sm font-semibold text-slate-950 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1">Company / Firm *</label>
                    <input
                      id="invite-input-company"
                      value={guestCompany}
                      onChange={(e) => setGuestCompany(e.target.value)}
                      required
                      className="w-full rounded-lg px-3 py-2 text-sm font-semibold text-slate-950 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1">Email Address *</label>
                    <input
                      id="invite-input-email"
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      required
                      className="w-full rounded-lg px-3 py-2 text-sm font-semibold text-slate-950 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1">Role / Expiration</label>
                    <div className="flex gap-2">
                      <input
                        id="invite-input-role"
                        value={guestRole}
                        onChange={(e) => setGuestRole(e.target.value)}
                        className="w-full rounded-lg px-3 py-2 text-sm text-slate-950 bg-white"
                      />
                      <select
                        value={expiresInDays}
                        onChange={(e) => setExpiresInDays(Number(e.target.value))}
                        className="rounded-lg px-2 py-2 text-xs font-bold text-slate-950 bg-white"
                      >
                        <option value={7}>7d</option>
                        <option value={14}>14d</option>
                        <option value={30}>30d</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <label className="text-xs font-extrabold uppercase tracking-wider" style={{ color: TAYCO_GOLD_LIGHT }}>
                      SELECT MODULES TO AUTHORIZE ({selectedModules.length} OF 6 CHECKED):
                    </label>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        data-magnetic
                        onClick={() => setSelectedModules(snapshot.modules.map((m) => m.id))}
                        className="text-xs font-bold underline text-slate-200 hover:text-white"
                      >
                        Select All (6)
                      </button>
                      <button
                        type="button"
                        data-magnetic
                        onClick={() => setSelectedModules(["MOD_TAKEOFF_PRO", "MOD_CRM_BIDS"])}
                        className="text-xs font-bold underline text-amber-300 hover:text-amber-100"
                      >
                        Commercial + Takeoff Only (2)
                      </button>
                      <button
                        type="button"
                        data-magnetic
                        onClick={() =>
                          setSelectedModules([
                            "MOD_PAYROLL_CREW",
                            "MOD_QUICKBOOKS_ERP",
                            "MOD_TAX_COMPLIANCE",
                          ])
                        }
                        className="text-xs font-bold underline text-emerald-300 hover:text-emerald-100"
                      >
                        CPA Finance + Tax (3)
                      </button>
                      <button
                        type="button"
                        data-magnetic
                        onClick={() =>
                          setSelectedModules([
                            "MOD_CRM_BIDS",
                            "MOD_QUICKBOOKS_ERP",
                            "MOD_INVESTOR_PORTAL",
                          ])
                        }
                        className="text-xs font-bold underline text-sky-300 hover:text-sky-100"
                      >
                        Investor &amp; Lender Board (3)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {snapshot.modules.map((mod) => {
                      const checked = selectedModules.includes(mod.id);
                      return (
                        <label
                          key={mod.id}
                          className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                            checked
                              ? "bg-amber-500/15 border-amber-400 shadow-sm"
                              : "bg-white/5 border-white/10 opacity-75"
                          }`}
                        >
                          <input
                            type="checkbox"
                            id={`chk-invite-${mod.id}`}
                            checked={checked}
                            onChange={() => toggleModuleCheckbox(mod.id)}
                            className="mt-1 h-4 w-4 accent-amber-500"
                          />
                          <div className="text-xs">
                            <div className="font-extrabold text-white">{mod.title}</div>
                            <div className="text-slate-200 mt-0.5">{mod.description}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <button
                    type="submit"
                    id="btn-generate-and-preview-invite"
                    data-magnetic
                    className="px-6 py-3 rounded-xl font-black text-sm text-slate-950 shadow-md transition-transform hover:scale-[1.01]"
                    style={{ background: TAYCO_GOLD }}
                  >
                    ✨ Create Scoped Invitation &amp; Activate Partner View
                  </button>

                  {createdInviteBanner && (
                    <div
                      id="generated-invite-result"
                      className="flex flex-wrap items-center gap-3 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-xs text-emerald-100"
                    >
                      <span>
                        Invitation Created: <strong className="font-mono">{createdInviteBanner.code}</strong>
                      </span>
                      <span className="font-mono bg-black/40 px-2 py-1 rounded border border-emerald-400/30">
                        {createdInviteBanner.shareUrl}
                      </span>
                      <span className="font-bold text-emerald-300">
                        ({createdInviteBanner.allowedModules.length} active modules)
                      </span>
                    </div>
                  )}
                </div>
              </form>
            </section>
          )}

          {/* ── C) 4 EXECUTIVE KPI CARDS WITH SPARKLINES & 3D LIVING SPECULAR WASH ── */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div
              data-response-kind="surface"
              onMouseMove={handleSurfaceMouseMove}
              onMouseLeave={handleSurfaceMouseLeave}
              className={`${cardSurfaceClass} rounded-2xl p-5 relative overflow-hidden`}
              style={livingCardInlineStyle}
            >
              <div className="response-wash pointer-events-none" aria-hidden="true" />
              <div className="relative z-10 flex items-start justify-between gap-2">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-200/80">
                    Active Commercial Pipeline
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                    ${(snapshot.crm.pipelineTotalUsd / 1e6).toFixed(2)}M USD
                  </div>
                  <div className="text-xs text-emerald-300 font-semibold mt-1">
                    {snapshot.crm.activeProjectsCount} Active Projects · 9 States
                  </div>
                </div>
                <svg width="110" height="36" className="shrink-0">
                  <polyline
                    fill="none"
                    stroke={TAYCO_GOLD}
                    strokeWidth="2.4"
                    points={buildSparklinePoints(sparklines.pipeline_trend, 110, 36)}
                  />
                </svg>
              </div>
            </div>

            <div
              data-response-kind="surface"
              onMouseMove={handleSurfaceMouseMove}
              onMouseLeave={handleSurfaceMouseLeave}
              className={`${cardSurfaceClass} rounded-2xl p-5 relative overflow-hidden`}
              style={livingCardInlineStyle}
            >
              <div className="response-wash pointer-events-none" aria-hidden="true" />
              <div className="relative z-10 flex items-start justify-between gap-2">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-200/80">
                    Takeoff Pro Flagship GMP
                  </div>
                  <div className="text-2xl sm:text-3xl font-black mt-1" style={{ color: TAYCO_GOLD_LIGHT }}>
                    $855,525.23
                  </div>
                  <div className="text-xs text-slate-200 mt-1">
                    Leveled: $824,875.23 · VE: $798,175.23
                  </div>
                </div>
                <svg width="110" height="36" className="shrink-0">
                  <polyline
                    fill="none"
                    stroke={TAYCO_EMERALD}
                    strokeWidth="2.4"
                    points={buildSparklinePoints(sparklines.cpi_trend, 110, 36)}
                  />
                </svg>
              </div>
            </div>

            <div
              data-response-kind="surface"
              onMouseMove={handleSurfaceMouseMove}
              onMouseLeave={handleSurfaceMouseLeave}
              className={`${cardSurfaceClass} rounded-2xl p-5 relative overflow-hidden`}
              style={livingCardInlineStyle}
            >
              <div className="response-wash pointer-events-none" aria-hidden="true" />
              <div className="relative z-10 flex items-start justify-between gap-2">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-200/80">
                    WH-347 Field Labor Budget
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                    {snapshot.payroll.totalManHours.toLocaleString("en-US", { minimumFractionDigits: 1 })} MH
                  </div>
                  <div className="text-xs text-emerald-300 font-semibold mt-1">
                    ${snapshot.payroll.totalLaborBudgetUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })} Loaded · {snapshot.payroll.totalCrewDays} Days
                  </div>
                </div>
                <svg width="110" height="36" className="shrink-0">
                  <polyline
                    fill="none"
                    stroke={TAYCO_ORANGE}
                    strokeWidth="2.4"
                    points={buildSparklinePoints(sparklines.manhours_trend, 110, 36)}
                  />
                </svg>
              </div>
            </div>

            <div
              data-response-kind="surface"
              onMouseMove={handleSurfaceMouseMove}
              onMouseLeave={handleSurfaceMouseLeave}
              className={`${cardSurfaceClass} rounded-2xl p-5 relative overflow-hidden`}
              style={livingCardInlineStyle}
            >
              <div className="response-wash pointer-events-none" aria-hidden="true" />
              <div className="relative z-10 flex items-start justify-between gap-2">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-200/80">
                    Net AIA G702 Pay App #{snapshot.quickbooks.aiaG702PayAppNumber}
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
                    ${snapshot.quickbooks.aiaCurrentNetPaymentDueUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-slate-200 mt-1">
                    Revised Contract (+4 COs): $882,104.08
                  </div>
                </div>
                <svg width="110" height="36" className="shrink-0">
                  <polyline
                    fill="none"
                    stroke={TAYCO_GOLD_LIGHT}
                    strokeWidth="2.4"
                    points={buildSparklinePoints(sparklines.cashflow_trend, 110, 36)}
                  />
                </svg>
              </div>
            </div>
          </section>

          {/* ── VIEW 01: EXECUTIVE COMMAND & INTERACTIVE SVG CHARTS ── */}
          {activeView === "VIEW_01_COMMAND" && (
            <section id="panel-VIEW_01_COMMAND" className="space-y-6">
              <div
                id="tayco-live-telemetry-marquee"
                data-response-kind="surface"
                onMouseMove={handleSurfaceMouseMove}
                onMouseLeave={handleSurfaceMouseLeave}
                className="tayco-bento-card rounded-2xl px-4 py-3 border border-[#C9A84C]/35 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(15, 32, 64, 0.96) 0%, rgba(27, 58, 107, 0.92) 50%, rgba(15, 32, 64, 0.96) 100%)",
                }}
              >
                <div className="response-wash pointer-events-none" aria-hidden="true" />
                <div className="relative z-10 flex items-center gap-3 overflow-hidden w-full">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0"
                    style={{ background: TAYCO_ORANGE, color: "#09152B" }}
                  >
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    LIVE TELEMETRY
                  </span>
                  <div className="text-xs font-mono font-bold tracking-wide text-amber-100 whitespace-nowrap">
                    ✳ ACTIVE PIPELINE $5.88M ✳ SON OF A STAR GMP $855,525.23 → LEVELED $824,875.23 → VE $798,175.23 ✳ 6,536.0 MH WH-347 ✳ 8 POs ($375,012.51) &amp; 4 COs (+$26,578.85) ✳
                  </div>
                </div>

                <div
                  id="tayco-orbital-seal-badge"
                  className="relative z-10 flex items-center gap-2.5 shrink-0 px-3 py-1 rounded-full border border-[#C9A84C]/40 bg-[#09152B]/80"
                >
                  <svg
                    viewBox="0 0 80 80"
                    className="w-9 h-9 animate-spin"
                    style={{ animationDuration: "18s" }}
                    aria-label="TAYCO EXECUTIVE ERP · LIVE SYNC ·"
                  >
                    <defs>
                      <path
                        id="taycoSealCirclePath"
                        d="M 40, 40 m -29, 0 a 29,29 0 1,1 58,0 a 29,29 0 1,1 -58,0"
                      />
                    </defs>
                    <circle cx="40" cy="40" r="34" fill="none" stroke={TAYCO_GOLD} strokeWidth="1" strokeDasharray="3 3" />
                    <circle cx="40" cy="40" r="10" fill={TAYCO_GOLD} fillOpacity="0.2" stroke={TAYCO_GOLD} strokeWidth="1.5" />
                    <text fill={TAYCO_GOLD_LIGHT} fontSize="6.3" fontWeight="800" letterSpacing="1.2">
                      <textPath href="#taycoSealCirclePath">
                        TAYCO EXECUTIVE ERP · LIVE SYNC ·
                      </textPath>
                    </text>
                  </svg>
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: TAYCO_GOLD_LIGHT }}>
                    TAYCO EXECUTIVE ERP · LIVE SYNC ·
                  </span>
                </div>
              </div>

              {/* Row 1 of Charts: Interactive S-Curve + Interactive CSI-32 Cost Ring */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div
                  data-response-kind="surface"
                  onMouseMove={handleSurfaceMouseMove}
                  onMouseLeave={handleSurfaceMouseLeave}
                  className={`${cardSurfaceClass} xl:col-span-7 rounded-2xl p-6 relative overflow-hidden`}
                  style={livingCardInlineStyle}
                >
                  <div className="response-wash pointer-events-none" aria-hidden="true" />
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/15">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                        📈 EARNED VALUE MANAGEMENT (EVM) &amp; AIA G702 CASHFLOW
                      </span>
                      <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                        S-Curve 24-Week EVM: Planned vs. Earned Value vs. Actual Cost
                      </h2>
                    </div>
                    <div className="flex items-center gap-2 bg-[#09152B]/70 px-3 py-1.5 rounded-xl border border-[#C9A84C]/30">
                      <span className="text-xs text-slate-200 font-semibold">Cutoff Week:</span>
                      <input
                        type="range"
                        min={0}
                        max={Math.max(0, scurveSeries.length - 1)}
                        value={scurveWeekIdx}
                        onChange={(e) => setScurveWeekIdx(Number(e.target.value))}
                        className="w-24 accent-amber-400 cursor-pointer"
                      />
                      <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-amber-400/20 text-amber-300">
                        {activeScurvePoint.weekLabel} ({activeScurvePoint.completionPct}%)
                      </span>
                    </div>
                  </div>

                  <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-[10px] uppercase text-slate-300 font-bold">Planned Value (PV)</div>
                      <div className="text-sm sm:text-base font-mono font-black text-slate-100 mt-0.5">
                        ${activeScurvePoint.planned_value_usd.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-400/35">
                      <div className="text-[10px] uppercase text-amber-300 font-bold">Earned Value (EV)</div>
                      <div className="text-sm sm:text-base font-mono font-black text-amber-200 mt-0.5">
                        ${activeScurvePoint.earned_value_usd.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/35">
                      <div className="text-[10px] uppercase text-emerald-300 font-bold">Actual Cost (AC)</div>
                      <div className="text-sm sm:text-base font-mono font-black text-emerald-200 mt-0.5">
                        ${activeScurvePoint.actual_cost_usd.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-orange-500/15 border border-orange-400/35">
                      <div className="text-[10px] uppercase text-orange-300 font-bold">EVM Indices</div>
                      <div className="text-sm sm:text-base font-mono font-black text-orange-200 mt-0.5">
                        CPI {activeScurvePoint.cpi} · SPI {activeScurvePoint.spi}
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10">
                    <svg
                      id="chart-scurve-svg"
                      viewBox="0 0 640 230"
                      className="w-full h-56 overflow-visible"
                    >
                      <defs>
                        <linearGradient id="evAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={TAYCO_GOLD} stopOpacity="0.42" />
                          <stop offset="100%" stopColor={TAYCO_GOLD} stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                        const y = 195 - ratio * 165;
                        const labelUsd = Math.round((855525 * ratio) / 1000);
                        return (
                          <g key={idx}>
                            <line
                              x1="48"
                              y1={y}
                              x2="620"
                              y2={y}
                              stroke="rgba(255,255,255,0.1)"
                              strokeDasharray="3 3"
                            />
                            <text x="6" y={y + 4} fill="#CBD5E1" fontSize="10" fontFamily="monospace">
                              ${labelUsd}K
                            </text>
                          </g>
                        );
                      })}

                      {scurveSeries.length > 1 && (
                        <polyline
                          fill="none"
                          stroke="#94A3B8"
                          strokeWidth="2"
                          strokeDasharray="5 4"
                          points={scurveSeries
                            .map((pt, i) => {
                              const x = 54 + (i / (scurveSeries.length - 1)) * 556;
                              const y = 195 - (pt.planned_value_usd / 855525.23) * 165;
                              return `${x.toFixed(1)},${y.toFixed(1)}`;
                            })
                            .join(" ")}
                        />
                      )}

                      {scurveSeries.length > 1 && (
                        <polygon
                          fill="url(#evAreaGrad)"
                          points={[
                            `54,195`,
                            ...scurveSeries.map((pt, i) => {
                              const x = 54 + (i / (scurveSeries.length - 1)) * 556;
                              const y = 195 - (pt.earned_value_usd / 855525.23) * 165;
                              return `${x.toFixed(1)},${y.toFixed(1)}`;
                            }),
                            `610,195`,
                          ].join(" ")}
                        />
                      )}

                      {scurveSeries.length > 1 && (
                        <polyline
                          fill="none"
                          stroke={TAYCO_GOLD}
                          strokeWidth="3"
                          points={scurveSeries
                            .map((pt, i) => {
                              const x = 54 + (i / (scurveSeries.length - 1)) * 556;
                              const y = 195 - (pt.earned_value_usd / 855525.23) * 165;
                              return `${x.toFixed(1)},${y.toFixed(1)}`;
                            })
                            .join(" ")}
                        />
                      )}

                      {scurveSeries.length > 1 && (
                        <polyline
                          fill="none"
                          stroke={TAYCO_EMERALD}
                          strokeWidth="2.2"
                          points={scurveSeries
                            .map((pt, i) => {
                              const x = 54 + (i / (scurveSeries.length - 1)) * 556;
                              const y = 195 - (pt.actual_cost_usd / 855525.23) * 165;
                              return `${x.toFixed(1)},${y.toFixed(1)}`;
                            })
                            .join(" ")}
                        />
                      )}

                      {scurveSeries.map((pt, i) => {
                        const x = 54 + (i / Math.max(1, scurveSeries.length - 1)) * 556;
                        const yEv = 195 - (pt.earned_value_usd / 855525.23) * 165;
                        const isSelected = i === scurveWeekIdx;
                        return (
                          <g
                            key={pt.weekLabel}
                            className="cursor-pointer"
                            onClick={() => setScurveWeekIdx(i)}
                          >
                            {isSelected && (
                              <line
                                x1={x}
                                y1="24"
                                x2={x}
                                y2="195"
                                stroke={TAYCO_GOLD}
                                strokeWidth="1.2"
                                strokeDasharray="2 2"
                              />
                            )}
                            <circle
                              cx={x}
                              cy={yEv}
                              r={isSelected ? 6 : 4}
                              fill={isSelected ? "#FFFFFF" : TAYCO_GOLD}
                              stroke={TAYCO_DARK_NAVY}
                              strokeWidth="2"
                            />
                            <text
                              x={x}
                              y="214"
                              textAnchor="middle"
                              fill={isSelected ? TAYCO_GOLD_LIGHT : "#CBD5E1"}
                              fontSize="10"
                              fontWeight={isSelected ? "800" : "500"}
                            >
                              {pt.weekLabel}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>

                {/* 2. Interactive CSI-32 Cost Ring Chart */}
                <div
                  data-response-kind="surface"
                  onMouseMove={handleSurfaceMouseMove}
                  onMouseLeave={handleSurfaceMouseLeave}
                  className={`${cardSurfaceClass} xl:col-span-5 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden`}
                  style={livingCardInlineStyle}
                >
                  <div className="response-wash pointer-events-none" aria-hidden="true" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between gap-2 pb-4 border-b border-white/15">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                          🍩 CSI-32 COST RING &amp; CREW DISTRIBUTION
                        </span>
                        <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                          CSI-32 Cost Ring ($855.5K GMP)
                        </h2>
                      </div>
                      <div className="flex bg-[#09152B]/70 p-1 rounded-xl border border-[#C9A84C]/30 text-[11px] font-bold">
                        <button
                          type="button"
                          data-magnetic
                          onClick={() => {
                            setDonutLayerMode("divisions");
                            setSelectedDonutIdx(0);
                          }}
                          className={`px-2.5 py-1 rounded-lg ${
                            donutLayerMode === "divisions" ? "bg-amber-400 text-slate-950" : "text-slate-200"
                          }`}
                        >
                          7 CSI Divs
                        </button>
                        <button
                          type="button"
                          data-magnetic
                          onClick={() => {
                            setDonutLayerMode("components");
                            setSelectedDonutIdx(0);
                          }}
                          className={`px-2.5 py-1 rounded-lg ${
                            donutLayerMode === "components" ? "bg-amber-400 text-slate-950" : "text-slate-200"
                          }`}
                        >
                          Cost Tiers
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center mt-4">
                      <div className="sm:col-span-6 flex justify-center">
                        <svg
                          id="chart-csi-donut-svg"
                          viewBox="0 0 200 200"
                          className="w-44 h-44"
                        >
                          {(() => {
                            const radius = 72;
                            const circumference = 2 * Math.PI * radius;
                            const total = activeDonutSegments.reduce((acc, s) => acc + s.amountUsd, 0) || 1;
                            let cumulativeAngle = 0;
                            return activeDonutSegments.map((seg, idx) => {
                              const fraction = seg.amountUsd / total;
                              const dash = fraction * circumference;
                              const rotateDeg = cumulativeAngle * 360 - 90;
                              cumulativeAngle += fraction;
                              const isSelected = idx === selectedDonutIdx;
                              return (
                                <circle
                                  key={seg.id}
                                  cx="100"
                                  cy="100"
                                  r={radius}
                                  fill="transparent"
                                  stroke={seg.colorHex}
                                  strokeWidth={isSelected ? "24" : "18"}
                                  strokeDasharray={`${dash} ${circumference}`}
                                  transform={`rotate(${rotateDeg} 100 100)`}
                                  className="cursor-pointer transition-all"
                                  onClick={() => setSelectedDonutIdx(idx)}
                                />
                              );
                            });
                          })()}
                          <circle cx="100" cy="100" r="52" fill={TAYCO_DARK_NAVY} />
                          <text x="100" y="94" textAnchor="middle" fill={TAYCO_GOLD_LIGHT} fontSize="9" fontWeight="700">
                            {selectedSegment?.code || "CSI-32"}
                          </text>
                          <text x="100" y="110" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="900">
                            ${selectedSegment ? (selectedSegment.amountUsd / 1000).toFixed(1) : "855.5"}K
                          </text>
                        </svg>
                      </div>

                      <div className="sm:col-span-6 space-y-1.5">
                        {activeDonutSegments.map((seg, idx) => {
                          const isSelected = idx === selectedDonutIdx;
                          return (
                            <button
                              key={seg.id}
                              type="button"
                              data-magnetic
                              onClick={() => setSelectedDonutIdx(idx)}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-all ${
                                isSelected ? "bg-white/15 font-black text-white" : "text-slate-200 hover:bg-white/5"
                              }`}
                            >
                              <span className="flex items-center gap-2 truncate">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ background: seg.colorHex }}
                                />
                                <span className="truncate">{seg.code}</span>
                              </span>
                              <span className="font-mono text-[11px] shrink-0">
                                ${(seg.amountUsd / 1000).toFixed(1)}K
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {selectedSegment && (
                    <div className="relative z-10 mt-4 p-3.5 rounded-xl bg-[#09152B]/70 border border-[#C9A84C]/25 text-xs">
                      <div className="font-black text-white">{selectedSegment.label}</div>
                      <div className="flex flex-wrap justify-between gap-2 text-slate-200 mt-1">
                        <span>
                          Budget: <strong className="text-amber-300">${selectedSegment.amountUsd.toLocaleString()}</strong>
                        </span>
                        {selectedSegment.manHours > 0 && (
                          <span>
                            Field Labor: <strong className="text-emerald-300">{selectedSegment.manHours.toLocaleString()} MH</strong>
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5">
                        Assigned: {selectedSegment.crewAssigned}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Row 2 of Charts: 3. 9-State Pipeline & Tax Matrix + 4. WH-347 Crew Radial Gauges */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div
                  data-response-kind="surface"
                  onMouseMove={handleSurfaceMouseMove}
                  onMouseLeave={handleSurfaceMouseLeave}
                  className={`${cardSurfaceClass} xl:col-span-7 rounded-2xl p-6 relative overflow-hidden`}
                  style={livingCardInlineStyle}
                >
                  <div className="response-wash pointer-events-none" aria-hidden="true" />
                  <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-white/15">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                        🗺️ 9-STATE PIPELINE &amp; TAX MATRIX
                      </span>
                      <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                        9-State Pipeline &amp; Tax Matrix (Click Any State Bar)
                      </h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs text-slate-200">
                        Active Tax State:{" "}
                        <strong className="text-amber-300">
                          {snapshot.taxCompliance.stateCode} ({snapshot.taxCompliance.effectiveRatePct}%)
                        </strong>{" "}
                        · Est. Material Tax:{" "}
                        <strong className="text-emerald-300">
                          ${snapshot.taxCompliance.estimatedSalesUseTaxUsd.toLocaleString()}
                        </strong>
                      </span>
                      <button
                        type="button"
                        data-magnetic
                        onClick={() => setActiveView("VIEW_06_TAX")}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white"
                      >
                        Open Tax &amp; 1099-NEC →
                      </button>
                    </div>
                  </div>

                  <div className="relative z-10 mt-4">
                    <svg
                      id="chart-states-bar-svg"
                      viewBox="0 0 720 185"
                      className="w-full h-44 overflow-visible"
                    >
                      {stateFootprint.map((st, idx) => {
                        const barWidth = 52;
                        const gap = 26;
                        const x = 24 + idx * (barWidth + gap);
                        const maxPipeline = 2500000;
                        const barH = Math.max(18, (st.active_pipeline_usd / maxPipeline) * 115);
                        const y = 145 - barH;
                        const isSelected = st.stateCode === snapshot.taxCompliance.stateCode;
                        return (
                          <g
                            key={st.stateCode}
                            className="cursor-pointer"
                            onClick={() =>
                              handleTaxStateChange(st.stateCode, snapshot.taxCompliance.taxExempt)
                            }
                          >
                            <rect
                              x={x}
                              y={y}
                              width={barWidth}
                              height={barH}
                              rx="8"
                              fill={isSelected ? TAYCO_GOLD : "rgba(249, 115, 22, 0.55)"}
                              stroke={isSelected ? "#FFFFFF" : "rgba(201,168,76,0.45)"}
                              strokeWidth={isSelected ? "2" : "1"}
                            />
                            <text
                              x={x + barWidth / 2}
                              y={y - 6}
                              textAnchor="middle"
                              fill="#F8FAFC"
                              fontSize="9.5"
                              fontFamily="monospace"
                              fontWeight="700"
                            >
                              ${(st.active_pipeline_usd / 1e6).toFixed(2)}M
                            </text>
                            <text
                              x={x + barWidth / 2}
                              y="162"
                              textAnchor="middle"
                              fill={isSelected ? TAYCO_GOLD_LIGHT : "#FFFFFF"}
                              fontSize="11"
                              fontWeight="900"
                            >
                              {st.stateCode}
                            </text>
                            <text
                              x={x + barWidth / 2}
                              y="176"
                              textAnchor="middle"
                              fill="#CBD5E1"
                              fontSize="9.5"
                            >
                              {st.combined_tax_rate_pct}% Tax
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>

                {/* 4. Interactive WH-347 Crew Radial Gauges */}
                <div
                  data-response-kind="surface"
                  onMouseMove={handleSurfaceMouseMove}
                  onMouseLeave={handleSurfaceMouseLeave}
                  className={`${cardSurfaceClass} xl:col-span-5 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden`}
                  style={livingCardInlineStyle}
                >
                  <div className="response-wash pointer-events-none" aria-hidden="true" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between gap-2 pb-4 border-b border-white/15">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-300">
                          👷 DAVIS-BACON CERTIFIED PAYROLL TELEMETRY
                        </span>
                        <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                          WH-347 Crew Radial Gauges ({snapshot.payroll.totalManHours.toFixed(1)} MH)
                        </h2>
                      </div>
                      <button
                        type="button"
                        data-magnetic
                        onClick={() => setActiveView("VIEW_04_PAYROLL")}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white"
                      >
                        WH-347 Ledger →
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                      {snapshot.payroll.crews.slice(0, 4).map((crew, idx) => {
                        const pct = Math.min(100, Math.round((crew.totalManHours / 1700) * 100));
                        const r = 30;
                        const circ = 2 * Math.PI * r;
                        const dash = (pct / 100) * circ;
                        const strokeColors = [TAYCO_GOLD, TAYCO_ORANGE, TAYCO_EMERALD, TAYCO_GOLD_LIGHT];
                        const ringColor = strokeColors[idx % strokeColors.length];
                        return (
                          <div
                            key={crew.crewCode}
                            className="p-2.5 rounded-xl bg-[#09152B]/65 border border-[#C9A84C]/25 flex flex-col items-center text-center"
                          >
                            <svg
                              id={idx === 0 ? "chart-wh347-radial-svg" : undefined}
                              viewBox="0 0 80 80"
                              className="w-16 h-16"
                            >
                              <circle
                                cx="40"
                                cy="40"
                                r={r}
                                fill="none"
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth="7"
                              />
                              <circle
                                cx="40"
                                cy="40"
                                r={r}
                                fill="none"
                                stroke={ringColor}
                                strokeWidth="7"
                                strokeLinecap="round"
                                strokeDasharray={`${dash} ${circ}`}
                                transform="rotate(-90 40 40)"
                              />
                              <text
                                x="40"
                                y="43"
                                textAnchor="middle"
                                fill="#FFFFFF"
                                fontSize="11"
                                fontWeight="900"
                                fontFamily="monospace"
                              >
                                {Math.round(crew.totalManHours)}h
                              </text>
                            </svg>
                            <div className="text-[11px] font-black text-amber-200 mt-1">
                              {crew.crewCode}
                            </div>
                            <div className="text-[10px] text-slate-300 truncate w-full">
                              {crew.workersCount} Workers · ${(crew.totalLoadedLaborUsd / 1000).toFixed(1)}K
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="relative z-10 mt-4 p-3 rounded-xl bg-[#09152B]/70 border border-[#C9A84C]/25 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-slate-200">
                      Weighted Rate: <strong className="text-amber-300">${snapshot.payroll.weightedAvgHourlyRateUsd}/hr</strong>
                    </span>
                    <span className="text-slate-200">
                      FICA + WC Fringe: <strong className="text-emerald-300">${(snapshot.payroll.fica765Usd + snapshot.payroll.workersCompAndFringeUsd).toLocaleString()}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 3: 6 Executive Module Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div
                  data-response-kind="surface"
                  onMouseMove={handleSurfaceMouseMove}
                  onMouseLeave={handleSurfaceMouseLeave}
                  className={`${cardSurfaceClass} rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden`}
                  style={livingCardInlineStyle}
                >
                  <div className="response-wash pointer-events-none" aria-hidden="true" />
                  <div className="relative z-10">
                    <div className="text-xs font-black uppercase" style={{ color: TAYCO_GOLD_LIGHT }}>
                      03 · 1. Commercial CRM &amp; 3-Bid Leveling
                    </div>
                    <h3 className="text-base font-black text-white mt-1">
                      $855.5K GMP → $824.9K Leveled (-$30,650)
                    </h3>
                    <p className="text-xs text-slate-200 mt-1">
                      5 CSI Trades × 3 Subcontractor Bids (15 bids), 3 Scope Gaps flagged, and $798,175.23 VE target.
                    </p>
                  </div>
                  <button
                    type="button"
                    data-magnetic
                    onClick={() => setActiveView("VIEW_03_CRM")}
                    className="relative z-10 mt-4 w-full py-2 rounded-xl text-xs font-extrabold bg-white/10 hover:bg-white/20 text-white"
                  >
                    Open CRM &amp; 3-Bid Leveling →
                  </button>
                </div>

                <div
                  data-response-kind="surface"
                  onMouseMove={handleSurfaceMouseMove}
                  onMouseLeave={handleSurfaceMouseLeave}
                  className={`${cardSurfaceClass} rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden`}
                  style={livingCardInlineStyle}
                >
                  <div className="response-wash pointer-events-none" aria-hidden="true" />
                  <div className="relative z-10">
                    <div className="text-xs font-black uppercase text-emerald-300">
                      04 · 2. Davis-Bacon Payroll &amp; WH-347
                    </div>
                    <h3 className="text-base font-black text-white mt-1">
                      {snapshot.payroll.totalManHours.toFixed(1)} MH · ${snapshot.payroll.totalLaborBudgetUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </h3>
                    <p className="text-xs text-slate-200 mt-1">
                      7 CSI field crews (436.3 MH/Cabin) with live field crew hour logger and certified WH-347 export.
                    </p>
                  </div>
                  <button
                    type="button"
                    data-magnetic
                    onClick={() => setActiveView("VIEW_04_PAYROLL")}
                    className="relative z-10 mt-4 w-full py-2 rounded-xl text-xs font-extrabold bg-white/10 hover:bg-white/20 text-white"
                  >
                    Open WH-347 Payroll →
                  </button>
                </div>

                <div
                  data-response-kind="surface"
                  onMouseMove={handleSurfaceMouseMove}
                  onMouseLeave={handleSurfaceMouseLeave}
                  className={`${cardSurfaceClass} rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden`}
                  style={livingCardInlineStyle}
                >
                  <div className="response-wash pointer-events-none" aria-hidden="true" />
                  <div className="relative z-10">
                    <div className="text-xs font-black uppercase text-orange-300">
                      05 · 3. QuickBooks, 8 POs &amp; 4 COs
                    </div>
                    <h3 className="text-base font-black text-white mt-1">
                      $375,012.51 POs · $882,104.08 Revised
                    </h3>
                    <p className="text-xs text-slate-200 mt-1">
                      8 Material POs (3 Critical Arctic Long-Lead), 4 Change Orders (+$26,578.85), and AIA G702 Pay App #3.
                    </p>
                  </div>
                  <button
                    type="button"
                    data-magnetic
                    onClick={() => setActiveView("VIEW_05_QUICKBOOKS")}
                    className="relative z-10 mt-4 w-full py-2 rounded-xl text-xs font-extrabold bg-white/10 hover:bg-white/20 text-white"
                  >
                    Open QuickBooks &amp; 8 POs →
                  </button>
                </div>

                <div
                  data-response-kind="surface"
                  onMouseMove={handleSurfaceMouseMove}
                  onMouseLeave={handleSurfaceMouseLeave}
                  className={`${cardSurfaceClass} rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden`}
                  style={livingCardInlineStyle}
                >
                  <div className="response-wash pointer-events-none" aria-hidden="true" />
                  <div className="relative z-10">
                    <div className="text-xs font-black uppercase text-amber-300">
                      06 · 4. 9-State Tax &amp; Tribal TERO 2.5%
                    </div>
                    <h3 className="text-base font-black text-white mt-1">
                      ND TERO $21,388.13 &amp; IRS 1099-NEC
                    </h3>
                    <p className="text-xs text-slate-200 mt-1">
                      $375,012.51 Taxable Material Base across 9 states, MHA Nation TERO 2.5%, and live W-9/COI gate.
                    </p>
                  </div>
                  <button
                    type="button"
                    data-magnetic
                    onClick={() => setActiveView("VIEW_06_TAX")}
                    className="relative z-10 mt-4 w-full py-2 rounded-xl text-xs font-extrabold bg-white/10 hover:bg-white/20 text-white"
                  >
                    Open Tax &amp; TERO Compliance →
                  </button>
                </div>

                <div
                  data-response-kind="surface"
                  onMouseMove={handleSurfaceMouseMove}
                  onMouseLeave={handleSurfaceMouseLeave}
                  className={`${cardSurfaceClass} rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden`}
                  style={livingCardInlineStyle}
                >
                  <div className="response-wash pointer-events-none" aria-hidden="true" />
                  <div className="relative z-10">
                    <div className="text-xs font-black uppercase text-sky-300">
                      07 · 📊 5. Investor &amp; Lender Dossier
                    </div>
                    <h3 className="text-base font-black text-white mt-1">
                      DOSSIER-SON_OF_STAR-V28 (7 Sections)
                    </h3>
                    <p className="text-xs text-slate-200 mt-1">
                      $106,940.65/cabin · $151.69/sq.ft. · 369 SHA-256 Line Items · Pareto Top 5 Blueprint Sheets.
                    </p>
                  </div>
                  <button
                    type="button"
                    data-magnetic
                    onClick={() => setActiveView("VIEW_08_INVESTOR")}
                    className="relative z-10 mt-4 w-full py-2 rounded-xl text-xs font-extrabold bg-white/10 hover:bg-white/20 text-white"
                  >
                    Open Investor Dossier →
                  </button>
                </div>

                <div
                  data-response-kind="surface"
                  onMouseMove={handleSurfaceMouseMove}
                  onMouseLeave={handleSurfaceMouseLeave}
                  className={`${cardSurfaceClass} rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden`}
                  style={livingCardInlineStyle}
                >
                  <div className="response-wash pointer-events-none" aria-hidden="true" />
                  <div className="relative z-10">
                    <div className="text-xs font-black uppercase text-emerald-300">
                      08 · 📐 Takeoff Pro Bridge (:8085)
                    </div>
                    <h3 className="text-base font-black text-white mt-1">
                      32 ARCH-D Sheets · 21 Rust Kernels
                    </h3>
                    <p className="text-xs text-slate-200 mt-1">
                      99.4% Triple AI Consensus, 0 Double Counting, and Monte Carlo P80 ($898,301.49).
                    </p>
                  </div>
                  <button
                    type="button"
                    data-magnetic
                    onClick={() => setActiveView("VIEW_07_TAKEOFF")}
                    className="relative z-10 mt-4 w-full py-2 rounded-xl text-xs font-extrabold bg-white/10 hover:bg-white/20 text-white"
                  >
                    Open Takeoff Pro Bridge →
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* ── VIEW 03: COMMERCIAL CRM, 3-BID LEVELING & SUBCONTRACTOR REGISTRY ── */}
          {activeView === "VIEW_03_CRM" && (
            <section id="panel-MOD_CRM_BIDS" className="space-y-6">
              {/* EXPLICIT TAKEOFF PRO (:8085) CONNECTION BANNER */}
              <div className="rounded-2xl p-4 sm:p-5 border-2 border-[#C9A84C]/60 bg-gradient-to-r from-[#09152B] via-[#1B3A6B] to-[#0F2040] shadow-xl">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-[11px] font-black uppercase tracking-wider text-emerald-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      📐 CONNECTED TO TAKEOFF PRO v5.0 (:8085) — BID LEVELING &amp; CSI-32 ESTIMATE FEED — rust_critical_bid_and_dedup_gate
                    </div>
                    <p className="text-xs sm:text-sm text-slate-100">
                      Synchronized across <strong>32 ARCH-D Sheets / 87 Sub-Views</strong>: <strong>$855,525.23 Base GMP</strong> →{" "}
                      <strong className="text-emerald-300">$824,875.23 Leveled Bid (-$30,650.00 across 15 bids)</strong> →{" "}
                      <strong className="text-amber-300">$798,175.23 VE Target (-$26,700.00 via 3 RFIs)</strong> · <strong>3 Scope Gaps Flagged</strong>.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      data-magnetic
                      onClick={handleSyncTakeoffPro}
                      className="px-3.5 py-2 rounded-xl text-xs font-black text-slate-950 shadow"
                      style={{ background: TAYCO_GOLD }}
                    >
                      🔄 Sync Live from Takeoff Pro (:8085)
                    </button>
                    <a
                      href={snapshot.takeoffBridge.url}
                      target="_blank"
                      rel="noreferrer"
                      data-magnetic
                      className="px-3.5 py-2 rounded-xl text-xs font-bold border border-[#C9A84C]/50 text-amber-100 hover:bg-white/10"
                    >
                      🚀 Open Blueprint in Takeoff Pro (:8085) ↗
                    </a>
                  </div>
                </div>
              </div>

              {/* REAL 3-SUBCONTRACTOR BID LEVELING MATRIX */}
              {bidMatrix && (
                <div
                  data-response-kind="surface"
                  onMouseMove={handleSurfaceMouseMove}
                  onMouseLeave={handleSurfaceMouseLeave}
                  className={`${cardSurfaceClass} rounded-2xl p-6 relative overflow-hidden`}
                  style={livingCardInlineStyle}
                >
                  <div className="response-wash pointer-events-none" aria-hidden="true" />
                  <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/15">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                        ⚖️ 5 CSI TRADES × 3 SUBCONTRACTORS (15 BIDS) · KERNEL: {bidMatrix.engineKernel}
                      </span>
                      <h3 className="text-lg sm:text-xl font-black text-white mt-0.5">
                        3-Subcontractor Bid Leveling &amp; Value Engineering Matrix (Son of a Star)
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 font-mono">
                        Base GMP: <strong>${bidMatrix.baseGmpUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>
                      </span>
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 font-mono text-emerald-200">
                        Leveled Bid: <strong>${bidMatrix.leveledBidUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })} (-$30,650.00)</strong>
                      </span>
                      <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 font-mono text-amber-200">
                        VE Target: <strong>${bidMatrix.veTargetUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })} (-$26,700.00)</strong>
                      </span>
                    </div>
                  </div>

                  <div className="relative z-10 overflow-x-auto mt-4 bg-white rounded-xl text-slate-900 p-2">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b bg-slate-100 text-slate-600 uppercase text-[10px]">
                          <th className="py-2.5 px-2.5">CSI Trade &amp; Sheet</th>
                          <th className="py-2.5 px-2.5 text-right">Engineer GMP</th>
                          <th className="py-2.5 px-2.5">Sub A Bid</th>
                          <th className="py-2.5 px-2.5">Sub B Bid</th>
                          <th className="py-2.5 px-2.5">Sub C Bid</th>
                          <th className="py-2.5 px-2.5 text-right">Leveled Award</th>
                          <th className="py-2.5 px-2.5 text-right">VE Target (RFI)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {bidMatrix.rows.map((row) => (
                          <tr key={row.csiPackage} className="hover:bg-slate-50">
                            <td className="py-2.5 px-2.5">
                              <div className="font-black text-slate-900">
                                {row.csiPackage} · {row.tradeTitle}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                Sheet: <code className="font-bold text-indigo-800">{row.blueprintSheet}</code> · Awarded:{" "}
                                <strong className="text-emerald-800">{row.awardedVendor}</strong>
                              </div>
                              {row.scopeGapDetected && (
                                <div className="mt-1 px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
                                  ⚠️ {row.scopeGapDetected}
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-2.5 text-right font-mono font-semibold text-slate-700">
                              ${row.engineerGmpUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-2.5">
                              <div className="font-mono font-bold text-emerald-800">
                                ${row.subABid.amountUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </div>
                              <div className="text-[10px] text-slate-500">{row.subABid.vendor}</div>
                            </td>
                            <td className="py-2.5 px-2.5">
                              <div className="font-mono font-semibold text-slate-800">
                                ${row.subBBid.amountUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </div>
                              <div className="text-[10px] text-slate-500">{row.subBBid.note}</div>
                            </td>
                            <td className="py-2.5 px-2.5">
                              <div className="font-mono font-semibold text-slate-800">
                                ${row.subCBid.amountUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </div>
                              <div className="text-[10px] text-amber-800 font-semibold">{row.subCBid.note}</div>
                            </td>
                            <td className="py-2.5 px-2.5 text-right font-mono">
                              <div className="font-black text-emerald-800">
                                ${row.leveledAwardUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </div>
                              <div className="text-[10px] text-emerald-700 font-bold">
                                {row.levelingSavingsUsd.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                              </div>
                            </td>
                            <td className="py-2.5 px-2.5 text-right font-mono">
                              <div className="font-black text-indigo-900">
                                ${row.veFinalTargetUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </div>
                              {row.veRfiDescription && (
                                <div className="text-[10px] text-indigo-700">{row.veRfiDescription}</div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* COMMERCIAL CRM PIPELINE WITH LIVE STAGE MUTATION */}
              <div
                data-response-kind="surface"
                onMouseMove={handleSurfaceMouseMove}
                onMouseLeave={handleSurfaceMouseLeave}
                className={`${cardSurfaceClass} rounded-2xl p-6 relative overflow-hidden`}
                style={livingCardInlineStyle}
              >
                <div className="response-wash pointer-events-none" aria-hidden="true" />
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/15">
                  <div>
                    <h2 className="text-xl font-black text-white">
                      🤝 1. Commercial CRM Bid Pipeline &amp; Live Stage Governance ($5.88M)
                    </h2>
                    <p className="text-xs text-slate-200">
                      Connected to <Link href="/estimate" className="underline font-bold">/estimate</Link>, <Link href="/investor" className="underline font-bold">/investor</Link>, and Takeoff Pro (:8085). Change any opportunity stage live below.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {["ALL", "Takeoff Synced", "Contract Awarded", "Bidding", "Due Diligence", "New Website Lead"].map((st) => (
                      <button
                        key={st}
                        type="button"
                        data-magnetic
                        onClick={() => setCrmStageFilter(st)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold ${
                          crmStageFilter === st
                            ? "text-slate-950"
                            : "bg-white/10 text-slate-200 hover:bg-white/20"
                        }`}
                        style={crmStageFilter === st ? { background: TAYCO_GOLD } : undefined}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {crmUpdateNotice && (
                  <div className="relative z-10 mt-3 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-xs text-emerald-200 font-bold">
                    {crmUpdateNotice}
                  </div>
                )}

                <form onSubmit={handleCreateQuickLead} className="relative z-10 flex flex-wrap items-center gap-2 mt-4">
                  <input
                    placeholder="New Project / Bid Title..."
                    value={newLeadTitle}
                    onChange={(e) => setNewLeadTitle(e.target.value)}
                    className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-950 bg-white flex-1 min-w-[180px]"
                  />
                  <input
                    placeholder="Client / REIT"
                    value={newLeadClient}
                    onChange={(e) => setNewLeadClient(e.target.value)}
                    className="rounded-lg px-3 py-2 text-xs text-slate-950 bg-white w-40"
                  />
                  <input
                    placeholder="City, State"
                    value={newLeadLocation}
                    onChange={(e) => setNewLeadLocation(e.target.value)}
                    className="rounded-lg px-3 py-2 text-xs text-slate-950 bg-white w-36"
                  />
                  <input
                    type="number"
                    placeholder="Value USD"
                    value={newLeadValue}
                    onChange={(e) => setNewLeadValue(e.target.value)}
                    className="rounded-lg px-3 py-2 text-xs font-bold text-slate-950 bg-white w-32"
                  />
                  <button
                    type="submit"
                    id="btn-add-crm-opportunity"
                    data-magnetic
                    className="px-4 py-2 rounded-lg text-xs font-black text-slate-950"
                    style={{ background: TAYCO_GOLD }}
                  >
                    + Add Commercial Bid
                  </button>
                </form>

                <div className="relative z-10 overflow-x-auto mt-5 bg-white rounded-xl text-slate-900 p-2">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b bg-slate-100 text-slate-600 uppercase text-[11px]">
                        <th className="py-3 px-3">Code</th>
                        <th className="py-3 px-3">Project / Opportunity</th>
                        <th className="py-3 px-3">Client / Contact</th>
                        <th className="py-3 px-3">Location</th>
                        <th className="py-3 px-3 text-right">Area (SqFt)</th>
                        <th className="py-3 px-3 text-right">GMP Estimate</th>
                        <th className="py-3 px-3">Live Stage Control</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredOpportunities.map((opp) => (
                        <tr key={opp.id} className="hover:bg-slate-50">
                          <td className="py-3 px-3 font-mono font-bold text-slate-700">{opp.projectCode}</td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">{opp.title}</div>
                            <div className="text-[11px] text-slate-500">
                              {opp.division} · {opp.csiDivisionsCount} CSI Divs · Source: {opp.source}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-800">{opp.clientName}</div>
                            <div className="text-[11px] text-slate-500">
                              {opp.contactEmail} · {opp.contactPhone}
                            </div>
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-700">{opp.location}</td>
                          <td className="py-3 px-3 text-right font-mono">{opp.sqft.toLocaleString()}</td>
                          <td className="py-3 px-3 text-right font-mono font-black text-slate-900">
                            ${opp.estimatedValueUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-3">
                            <select
                              aria-label={`Stage for ${opp.title}`}
                              value={opp.stage}
                              onChange={(e) => handleUpdateOpportunityStage(opp.id, e.target.value)}
                              className="rounded-lg border border-slate-300 bg-emerald-50 text-emerald-950 font-bold text-xs px-2.5 py-1.5 cursor-pointer"
                            >
                              {CRM_STAGE_OPTIONS.map((stageOpt) => (
                                <option key={stageOpt} value={stageOpt}>
                                  {stageOpt}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Subcontractor Directory */}
              <div
                data-response-kind="surface"
                onMouseMove={handleSurfaceMouseMove}
                onMouseLeave={handleSurfaceMouseLeave}
                className={`${cardSurfaceClass} rounded-2xl p-6 relative overflow-hidden`}
                style={livingCardInlineStyle}
              >
                <div className="response-wash pointer-events-none" aria-hidden="true" />
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-black text-white">
                      🛠️ Pre-Qualified Subcontractor Registry (29 Trades · W-9 &amp; COI Gate)
                    </h3>
                    <p className="text-xs text-slate-200">
                      {snapshot.crm.subcontractors.length} Master Vendors across 8 states synced with <Link href="/vendor-application" className="underline font-bold">/vendor-application</Link>.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      data-magnetic
                      onClick={() => toggleTableExpand("crm_subs")}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white"
                    >
                      {isTableVisible("crm_subs") ? "Collapse Vendor Ledger ▴" : "Expand Full Ledger Table ▾"}
                    </button>
                    <Link
                      href="/vendor-application"
                      data-magnetic
                      className="px-4 py-2 rounded-xl text-xs font-black text-slate-950"
                      style={{ background: TAYCO_GOLD }}
                    >
                      + Onboard Subcontractor
                    </Link>
                  </div>
                </div>

                {isTableVisible("crm_subs") && (
                  <div className="relative z-10 overflow-x-auto mt-4 bg-white rounded-xl text-slate-900 p-2">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b bg-slate-100 text-slate-600 uppercase text-[11px]">
                          <th className="py-2.5 px-3">Subcontractor Business</th>
                          <th className="py-2.5 px-3">State / Cities</th>
                          <th className="py-2.5 px-3">Qualified Trades</th>
                          <th className="py-2.5 px-3 text-center">Crew Size</th>
                          <th className="py-2.5 px-3 text-center">W-9</th>
                          <th className="py-2.5 px-3 text-center">COI Insurance</th>
                          <th className="py-2.5 px-3 text-right">YTD Paid</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {snapshot.crm.subcontractors.map((sub) => (
                          <tr key={sub.id} className="hover:bg-slate-50">
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-900">{sub.businessName}</div>
                              <div className="text-[11px] text-slate-500">
                                {sub.contactName} · {sub.phone}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-bold text-slate-900">{sub.stateServed}</span>
                              <span className="text-[11px] text-slate-500 block">{sub.citiesServed}</span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex flex-wrap gap-1">
                                {sub.trades.map((t) => (
                                  <span
                                    key={t}
                                    className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] font-semibold"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center font-bold">{sub.crewSize} techs</td>
                            <td className="py-3 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                                {sub.w9Status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                                {sub.coiStatus}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                              ${sub.ytdPaidUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── VIEW 04: CONSTRUCTION PAYROLL, FIELD CREWS & DAVIS-BACON WH-347 ── */}
          {activeView === "VIEW_04_PAYROLL" && (
            <section id="panel-MOD_PAYROLL_CREW" className="space-y-6">
              {/* EXPLICIT TAKEOFF PRO (:8085) CONNECTION BANNER */}
              <div className="rounded-2xl p-4 sm:p-5 border-2 border-[#C9A84C]/60 bg-gradient-to-r from-[#09152B] via-[#1B3A6B] to-[#0F2040] shadow-xl">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-[11px] font-black uppercase tracking-wider text-emerald-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      📐 CONNECTED TO TAKEOFF PRO v5.0 (:8085) — APU LABOR &amp; CREW ENGINE FEED — rust_critical_apu_exact_cents (6,536.0 MH · 436.3 MH/Cabin)
                    </div>
                    <p className="text-xs sm:text-sm text-slate-100">
                      Synchronized across <strong>32 ARCH-D Sheets / 87 Sub-Views</strong>: <strong>{snapshot.payroll.totalManHours.toFixed(1)} Total Man-Hours</strong> (4,845.2 Direct Field MH · 436.3 MH/Cabin) · <strong>7 CSI Field Crews</strong> · <strong>${snapshot.payroll.totalLaborBudgetUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })} Loaded WH-347 Payroll</strong>.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      data-magnetic
                      onClick={handleSyncTakeoffPro}
                      className="px-3.5 py-2 rounded-xl text-xs font-black text-slate-950 shadow"
                      style={{ background: TAYCO_GOLD }}
                    >
                      🔄 Sync Live from Takeoff Pro (:8085)
                    </button>
                    <a
                      href={snapshot.takeoffBridge.url}
                      target="_blank"
                      rel="noreferrer"
                      data-magnetic
                      className="px-3.5 py-2 rounded-xl text-xs font-bold border border-[#C9A84C]/50 text-amber-100 hover:bg-white/10"
                    >
                      🚀 Open Blueprint in Takeoff Pro (:8085) ↗
                    </a>
                  </div>
                </div>
              </div>

              <div
                data-response-kind="surface"
                onMouseMove={handleSurfaceMouseMove}
                onMouseLeave={handleSurfaceMouseLeave}
                className={`${cardSurfaceClass} rounded-2xl p-6 relative overflow-hidden`}
                style={livingCardInlineStyle}
              >
                <div className="response-wash pointer-events-none" aria-hidden="true" />
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/15">
                  <div>
                    <h2 className="text-xl font-black text-white">
                      👷 2. Construction Payroll, Field Crews &amp; Davis-Bacon Form WH-347
                    </h2>
                    <p className="text-xs text-slate-200">
                      {snapshot.payroll.totalManHours.toFixed(1)} Total Man-Hours · {snapshot.payroll.totalCrewDays} Crew-Days · ${snapshot.payroll.weightedAvgHourlyRateUsd}/hr Weighted Rate · ${snapshot.payroll.totalLaborBudgetUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })} Total Labor Budget.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      data-magnetic
                      onClick={() => toggleTableExpand("wh347_table")}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white"
                    >
                      {isTableVisible("wh347_table") ? "Collapse WH-347 Ledger ▴" : "Expand Full Ledger Table ▾"}
                    </button>
                    <button
                      type="button"
                      data-magnetic
                      onClick={() =>
                        downloadFile(
                          "TAYCO_Davis_Bacon_WH347_SonOfStar.json",
                          JSON.stringify(snapshot.payroll, null, 2),
                          "application/json"
                        )
                      }
                      className="px-4 py-2 rounded-xl text-xs font-black text-slate-950"
                      style={{ background: TAYCO_GOLD }}
                    >
                      ⬇️ Export WH-347 (JSON/CSV)
                    </button>
                  </div>
                </div>

                {/* INTERACTIVE FIELD CREW HOURS LOGGER */}
                <form
                  onSubmit={handleLogCrewPayrollHours}
                  className="relative z-10 mt-4 p-4 rounded-xl bg-[#09152B]/75 border border-[#C9A84C]/35 flex flex-col md:flex-row md:items-end justify-between gap-4"
                >
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider" style={{ color: TAYCO_GOLD_LIGHT }}>
                      ⏱️ Log Real Field Crew Hours to WH-347
                    </div>
                    <p className="text-xs text-slate-200 mt-0.5">
                      Record daily field man-hours to recalculate gross wages, FICA (7.65%), FUTA/SUTA, Workers&apos; Comp, and total WH-347 payroll live.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      aria-label="Select Field Crew"
                      value={selectedCrewCode}
                      onChange={(e) => setSelectedCrewCode(e.target.value)}
                      className="rounded-lg px-3 py-2 text-xs font-bold text-slate-950 bg-white"
                    >
                      {snapshot.payroll.crews.map((c) => (
                        <option key={c.crewCode} value={c.crewCode}>
                          {c.crewCode} — {c.tradeClassification} ({c.totalManHours.toFixed(1)} MH)
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step="0.5"
                      value={crewHoursToAdd}
                      onChange={(e) => setCrewHoursToAdd(e.target.value)}
                      className="w-24 rounded-lg px-3 py-2 text-xs font-bold text-slate-950 bg-white"
                      aria-label="Additional Man-Hours"
                    />
                    <button
                      type="submit"
                      id="btn-log-crew-hours"
                      data-magnetic
                      className="px-4 py-2 rounded-lg text-xs font-black text-slate-950 shadow"
                      style={{ background: TAYCO_GOLD }}
                    >
                      + Log Field Hours to WH-347
                    </button>
                  </div>
                </form>

                {payrollLogNotice && (
                  <div className="relative z-10 mt-3 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-xs text-emerald-200 font-bold">
                    {payrollLogNotice}
                  </div>
                )}

                {/* Visual Man-Hour Bars by Crew */}
                <div className="relative z-10 space-y-3 mt-5">
                  {snapshot.payroll.crews.map((c) => {
                    const widthPct = Math.min(100, Math.round((c.totalManHours / 1700) * 100));
                    return (
                      <div key={c.crewCode} className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex flex-wrap justify-between text-xs mb-1.5">
                          <span className="font-bold text-white">
                            <code className="text-amber-300 mr-2">{c.crewCode}</code>
                            {c.csiDivision}
                          </span>
                          <span className="font-mono text-emerald-300 font-bold">
                            {c.totalManHours.toFixed(1)} MH · {c.workersCount} Workers · $
                            {c.totalLoadedLaborUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-black/40 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${widthPct}%`, background: TAYCO_GOLD }}
                          />
                        </div>
                        <div className="text-[11px] text-slate-300 mt-1">
                          {c.crewComposition || c.tradeClassification}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Full WH-347 Table */}
                {isTableVisible("wh347_table") && (
                  <div className="relative z-10 overflow-x-auto mt-6 bg-white rounded-xl text-slate-900 p-2">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b bg-slate-100 text-slate-600 uppercase text-[11px]">
                          <th className="py-3 px-3">Crew Code</th>
                          <th className="py-3 px-3">CSI Division &amp; Davis-Bacon Classification</th>
                          <th className="py-3 px-3 text-center">Workers</th>
                          <th className="py-3 px-3 text-right">Hours (MH)</th>
                          <th className="py-3 px-3 text-right">Base Wages</th>
                          <th className="py-3 px-3 text-right">FICA (7.65%)</th>
                          <th className="py-3 px-3 text-right">FUTA/SUTA</th>
                          <th className="py-3 px-3 text-right">WC &amp; Fringe</th>
                          <th className="py-3 px-3 text-right">Total Loaded</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {snapshot.payroll.crews.map((c) => (
                          <tr key={c.crewCode} className="hover:bg-slate-50">
                            <td className="py-3 px-3 font-mono font-bold text-slate-800">{c.crewCode}</td>
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-900">{c.csiDivision}</div>
                              <div className="text-[11px] text-slate-500">
                                {c.crewComposition || c.tradeClassification}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center font-bold">{c.workersCount}</td>
                            <td className="py-3 px-3 text-right font-mono">{c.totalManHours.toFixed(1)}</td>
                            <td className="py-3 px-3 text-right font-mono">${c.grossWagesUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                            <td className="py-3 px-3 text-right font-mono">${c.ficaUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                            <td className="py-3 px-3 text-right font-mono">${c.futaSutaUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                            <td className="py-3 px-3 text-right font-mono">${c.workersCompFringeUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                            <td className="py-3 px-3 text-right font-mono font-black text-slate-900">
                              ${c.totalLoadedLaborUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── VIEW 05: QUICKBOOKS ACCOUNTING SYNC, 8 MATERIAL POs, 4 COs & AIA G702/G703 ── */}
          {activeView === "VIEW_05_QUICKBOOKS" && (
            <section id="panel-MOD_QUICKBOOKS_ERP" className="space-y-6">
              {/* EXPLICIT TAKEOFF PRO (:8085) CONNECTION BANNER */}
              <div className="rounded-2xl p-4 sm:p-5 border-2 border-[#C9A84C]/60 bg-gradient-to-r from-[#09152B] via-[#1B3A6B] to-[#0F2040] shadow-xl">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-[11px] font-black uppercase tracking-wider text-emerald-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      📐 CONNECTED TO TAKEOFF PRO v5.0 (:8085) — AIA G702/G703 &amp; PROCUREMENT FEED — rust_critical_aia_g702_audit_cents (0¢ Drift)
                    </div>
                    <p className="text-xs sm:text-sm text-slate-100">
                      Synchronized across <strong>32 ARCH-D Sheets / 87 Sub-Views</strong>: <strong>8 Material POs ($375,012.51)</strong> ·{" "}
                      <strong>4 Change Orders (+$26,578.85 Net → $882,104.08 Revised Contract)</strong> ·{" "}
                      <strong className="text-emerald-300">Pay App #3 Net Due $184,892.70 ($51,501.13 Retainage)</strong>.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      data-magnetic
                      onClick={handleSyncTakeoffPro}
                      className="px-3.5 py-2 rounded-xl text-xs font-black text-slate-950 shadow"
                      style={{ background: TAYCO_GOLD }}
                    >
                      🔄 Sync Live from Takeoff Pro (:8085)
                    </button>
                    <a
                      href={snapshot.takeoffBridge.url}
                      target="_blank"
                      rel="noreferrer"
                      data-magnetic
                      className="px-3.5 py-2 rounded-xl text-xs font-bold border border-[#C9A84C]/50 text-amber-100 hover:bg-white/10"
                    >
                      🚀 Open Blueprint in Takeoff Pro (:8085) ↗
                    </a>
                  </div>
                </div>
              </div>

              <div
                data-response-kind="surface"
                onMouseMove={handleSurfaceMouseMove}
                onMouseLeave={handleSurfaceMouseLeave}
                className={`${cardSurfaceClass} rounded-2xl p-6 relative overflow-hidden`}
                style={livingCardInlineStyle}
              >
                <div className="response-wash pointer-events-none" aria-hidden="true" />
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/15">
                  <div>
                    <h2 className="text-xl font-black text-white">
                      📗 3. QuickBooks Accounting Sync, 8 Material POs, 4 COs &amp; AIA G702/G703
                    </h2>
                    <p className="text-xs text-slate-200">
                      Simulate and commit progress billing draw certificates to QuickBooks Desktop (`.IIF`) or QuickBooks Online (`.QBO`).
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      id="btn-toggle-iif-preview"
                      data-magnetic
                      onClick={() => setShowIifModal(!showIifModal)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white"
                    >
                      {showIifModal ? "Hide .IIF / .QBO Preview" : "👁️ Preview .IIF / .QBO"}
                    </button>
                    <button
                      type="button"
                      data-magnetic
                      onClick={() =>
                        downloadFile(
                          "TAYCO_SonOfStar_QuickBooks.iif",
                          snapshot.quickbooks.iifExportPreview,
                          "text/plain"
                        )
                      }
                      className="px-4 py-2 rounded-xl text-xs font-black text-slate-950"
                      style={{ background: TAYCO_GOLD }}
                    >
                      ⬇️ Download .IIF
                    </button>
                    <button
                      type="button"
                      data-magnetic
                      onClick={() =>
                        downloadFile(
                          "TAYCO_SonOfStar_QBO_Journal.json",
                          JSON.stringify(snapshot.quickbooks, null, 2),
                          "application/json"
                        )
                      }
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950"
                    >
                      ⬇️ Download .QBO JSON
                    </button>
                  </div>
                </div>

                {/* Interactive AIA G702/G703 Progress Simulator + Commit Button */}
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 mt-5 p-4 rounded-xl bg-[#09152B]/65 border border-[#C9A84C]/25">
                  <div className="lg:col-span-5 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-black uppercase tracking-wider" style={{ color: TAYCO_GOLD_LIGHT }}>
                        🎛️ AIA G702/G703 Pay Application Simulator
                      </div>
                      <button
                        type="button"
                        id="btn-commit-g702-draw"
                        data-magnetic
                        onClick={handleCommitQuickBooksDraw}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-black text-slate-950 shadow"
                        style={{ background: TAYCO_GOLD }}
                      >
                        💾 Commit Pay App Draw to QuickBooks Ledger
                      </button>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Physical Completion (% Progress)</span>
                        <strong className="font-mono text-amber-300">{aiaProgressPct.toFixed(1)}%</strong>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={100}
                        step={0.2}
                        value={aiaProgressPct}
                        onChange={(e) => setAiaProgressPct(Number(e.target.value))}
                        className="w-full accent-amber-400"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Statutory Retainage Held (Account 1210)</span>
                        <strong className="font-mono text-emerald-300">{aiaRetainagePct.toFixed(1)}%</strong>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={15}
                        step={0.5}
                        value={aiaRetainagePct}
                        onChange={(e) => setAiaRetainagePct(Number(e.target.value))}
                        className="w-full accent-emerald-400"
                      />
                    </div>
                  </div>

                  <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-[10px] text-slate-300 uppercase font-bold">Total Completed &amp; Stored</div>
                      <div className="text-base font-mono font-black text-white mt-1">
                        ${simGrossCompleted.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-400/30">
                      <div className="text-[10px] text-amber-300 uppercase font-bold">Retainage (Acct 1210)</div>
                      <div className="text-base font-mono font-black text-amber-200 mt-1">
                        ${simRetainageHeld.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/40">
                      <div className="text-[10px] text-emerald-300 uppercase font-bold">Current Net Payment Due</div>
                      <div className="text-base font-mono font-black text-emerald-200 mt-1">
                        ${simCurrentNetPayment.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>

                {aiaCommitNotice && (
                  <div className="relative z-10 mt-3 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-xs text-emerald-200 font-bold">
                    {aiaCommitNotice}
                  </div>
                )}

                {showIifModal && (
                  <pre className="relative z-10 mt-4 p-4 rounded-xl bg-black/80 text-emerald-300 font-mono text-xs overflow-x-auto border border-emerald-500/30">
                    {snapshot.quickbooks.iifExportPreview}
                  </pre>
                )}

                {/* 8 COMMITTED MATERIAL PURCHASE ORDERS (PO-001..PO-008) */}
                <div className="relative z-10 mt-6">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <h3 className="text-base font-black text-white">
                      📦 8 Committed Material Purchase Orders (PO-001..PO-008 · Total $375,012.51)
                    </h3>
                    <span className="text-xs font-bold text-amber-300">
                      3 Critical Arctic Long-Lead Packages Flagged (6–8 Weeks)
                    </span>
                  </div>
                  <div className="overflow-x-auto bg-white rounded-xl text-slate-900 p-2">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b bg-slate-100 text-slate-600 uppercase text-[10px]">
                          <th className="py-2.5 px-2.5">PO #</th>
                          <th className="py-2.5 px-2.5">CSI &amp; Material Package</th>
                          <th className="py-2.5 px-2.5">Vendor</th>
                          <th className="py-2.5 px-2.5">Sheet</th>
                          <th className="py-2.5 px-2.5">Lead Time</th>
                          <th className="py-2.5 px-2.5 text-right">Committed Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {purchaseOrders.map((po) => (
                          <tr key={po.poNumber} className="hover:bg-slate-50">
                            <td className="py-2.5 px-2.5 font-mono font-black text-slate-900">{po.poNumber}</td>
                            <td className="py-2.5 px-2.5">
                              <span className="font-bold text-slate-900">{po.title}</span>{" "}
                              <span className="text-[10px] text-slate-500">({po.csiDivision})</span>
                            </td>
                            <td className="py-2.5 px-2.5 text-slate-700 font-semibold">{po.vendorName}</td>
                            <td className="py-2.5 px-2.5 font-mono text-indigo-800 font-bold">{po.blueprintSheet}</td>
                            <td className="py-2.5 px-2.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                  po.isCriticalLongLead
                                    ? "bg-red-100 text-red-900"
                                    : "bg-emerald-100 text-emerald-900"
                                }`}
                              >
                                {po.leadTimeBadge}
                              </span>
                            </td>
                            <td className="py-2.5 px-2.5 text-right font-mono font-black text-slate-900">
                              ${po.amountUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 4 APPROVED CHANGE ORDERS (CO-001..CO-004) */}
                <div className="relative z-10 mt-6">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <h3 className="text-base font-black text-white">
                      📝 4 Approved Change Orders (CO-001..CO-004 · Net +$26,578.85 → $882,104.08 Revised Contract)
                    </h3>
                    <span className="text-xs font-bold text-emerald-300">
                      Reconciled with AIA G702 Line 2
                    </span>
                  </div>
                  <div className="overflow-x-auto bg-white rounded-xl text-slate-900 p-2">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b bg-slate-100 text-slate-600 uppercase text-[10px]">
                          <th className="py-2.5 px-2.5">CO #</th>
                          <th className="py-2.5 px-2.5">Change Order Scope</th>
                          <th className="py-2.5 px-2.5">Engineering Justification</th>
                          <th className="py-2.5 px-2.5">Sheet</th>
                          <th className="py-2.5 px-2.5 text-right">Net Impact</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {changeOrders.map((co) => (
                          <tr key={co.coNumber} className="hover:bg-slate-50">
                            <td className="py-2.5 px-2.5 font-mono font-black text-slate-900">{co.coNumber}</td>
                            <td className="py-2.5 px-2.5 font-bold text-slate-900">
                              {co.title} <span className="text-[10px] text-slate-500">({co.csiDivision})</span>
                            </td>
                            <td className="py-2.5 px-2.5 text-slate-600">{co.reasonCode}</td>
                            <td className="py-2.5 px-2.5 font-mono font-bold text-indigo-800">{co.blueprintSheet}</td>
                            <td
                              className={`py-2.5 px-2.5 text-right font-mono font-black ${
                                co.amountUsd < 0 ? "text-emerald-700" : "text-amber-900"
                              }`}
                            >
                              {co.amountUsd >= 0 ? "+" : "-"}$
                              {Math.abs(co.amountUsd).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* QuickBooks Chart of Accounts Mapping */}
                <div className="relative z-10 overflow-x-auto mt-6 bg-white rounded-xl text-slate-900 p-2">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b bg-slate-100 text-slate-600 uppercase text-[11px]">
                        <th className="py-3 px-3">CSI Division</th>
                        <th className="py-3 px-3">CSI-32 Scope Description</th>
                        <th className="py-3 px-3">QuickBooks Account</th>
                        <th className="py-3 px-3 text-right">GMP Budget</th>
                        <th className="py-3 px-3 text-right">Committed POs</th>
                        <th className="py-3 px-3 text-right">Billed to Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {snapshot.quickbooks.chartOfAccountsMapping.map((row) => (
                        <tr key={row.csiDivision} className="hover:bg-slate-50">
                          <td className="py-3 px-3 font-mono font-bold text-slate-800">{row.csiDivision}</td>
                          <td className="py-3 px-3 font-semibold text-slate-900">{row.csiTitle}</td>
                          <td className="py-3 px-3">
                            <span className="font-mono font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded">
                              #{row.qbAccountNumber}
                            </span>{" "}
                            <span className="text-xs text-slate-700">{row.qbAccountName}</span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono">${row.budgetedUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-amber-800">
                            ${row.committedPosUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-black text-emerald-800">
                            ${row.billedToDateUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* ── VIEW 06: MULTI-STATE TAX ENGINE, TRIBAL TERO 2.5% & IRS 1099-NEC ── */}
          {activeView === "VIEW_06_TAX" && (
            <section id="panel-MOD_TAX_COMPLIANCE" className="space-y-6">
              {/* EXPLICIT TAKEOFF PRO (:8085) CONNECTION BANNER */}
              <div className="rounded-2xl p-4 sm:p-5 border-2 border-[#C9A84C]/60 bg-gradient-to-r from-[#09152B] via-[#1B3A6B] to-[#0F2040] shadow-xl">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-[11px] font-black uppercase tracking-wider text-emerald-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      📐 CONNECTED TO TAKEOFF PRO v5.0 (:8085) — CSI-32 TAXABLE MATERIAL SEPARATION &amp; ND TERO FEED — rust_critical_regional_cost_index_cents
                    </div>
                    <p className="text-xs sm:text-sm text-slate-100">
                      Synchronized across <strong>32 ARCH-D Sheets / 87 Sub-Views</strong>: <strong>$375,012.51 Taxable Material Base</strong> ·{" "}
                      <strong>$213,299.26 Exempt Field Labor (WH-347)</strong> ·{" "}
                      <strong className="text-amber-300">MHA Nation Tribal TERO 2.5% Fee ($21,388.13) + North Dakota Material Tax ($24,375.81)</strong>.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      data-magnetic
                      onClick={handleSyncTakeoffPro}
                      className="px-3.5 py-2 rounded-xl text-xs font-black text-slate-950 shadow"
                      style={{ background: TAYCO_GOLD }}
                    >
                      🔄 Sync Live from Takeoff Pro (:8085)
                    </button>
                    <a
                      href={snapshot.takeoffBridge.url}
                      target="_blank"
                      rel="noreferrer"
                      data-magnetic
                      className="px-3.5 py-2 rounded-xl text-xs font-bold border border-[#C9A84C]/50 text-amber-100 hover:bg-white/10"
                    >
                      🚀 Open Blueprint in Takeoff Pro (:8085) ↗
                    </a>
                  </div>
                </div>
              </div>

              <div
                data-response-kind="surface"
                onMouseMove={handleSurfaceMouseMove}
                onMouseLeave={handleSurfaceMouseLeave}
                className={`${cardSurfaceClass} rounded-2xl p-6 relative overflow-hidden`}
                style={livingCardInlineStyle}
              >
                <div className="response-wash pointer-events-none" aria-hidden="true" />
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/15">
                  <div>
                    <h2 className="text-xl font-black text-white">
                      🏛️ 4. Multi-State Tax Engine (9 States), MHA Nation TERO 2.5% &amp; IRS 1099-NEC
                    </h2>
                    <p className="text-xs text-slate-200">
                      Automatically separates Taxable Construction Materials ($375,012.51) from Exempt Field Labor ($213,299.26) and calculates Tribal TERO compliance.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-amber-200/90 mb-1">
                        Project Tax Jurisdiction
                      </label>
                      <select
                        id="select-tayco-tax-state"
                        value={snapshot.taxCompliance.stateCode}
                        onChange={(e) =>
                          handleTaxStateChange(e.target.value, snapshot.taxCompliance.taxExempt)
                        }
                        className="rounded-xl px-3.5 py-2 text-xs sm:text-sm font-black text-slate-950 bg-white"
                      >
                        {snapshot.taxCompliance.availableStates.map((st) => (
                          <option key={st.stateCode} value={st.stateCode}>
                            {st.stateCode} — {st.stateName} ({st.combinedSalesUseTaxPct}% Sales/Use Tax)
                          </option>
                        ))}
                      </select>
                    </div>

                    <label className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 cursor-pointer mt-4 lg:mt-0">
                      <input
                        type="checkbox"
                        id="toggle-tax-exempt"
                        checked={snapshot.taxCompliance.taxExempt}
                        onChange={(e) =>
                          handleTaxStateChange(snapshot.taxCompliance.stateCode, e.target.checked)
                        }
                        className="h-4 w-4 accent-emerald-500"
                      />
                      <span className="text-xs font-extrabold text-white">
                        Tax-Exempt Certificate ({snapshot.taxCompliance.exemptionCertificateNumber})
                      </span>
                    </label>
                  </div>
                </div>

                {/* 5 KPI Cards including MHA Nation Tribal TERO Compliance Fee */}
                <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-5">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-xs font-bold text-slate-300">Taxable Materials (8 POs)</div>
                    <div className="text-xl font-black text-white mt-1">
                      ${snapshot.taxCompliance.taxableMaterialsUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[11px] text-slate-200 mt-1">
                      Applied Rate ({snapshot.taxCompliance.stateCode}):{" "}
                      <strong>{snapshot.taxCompliance.effectiveRatePct}%</strong>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-400/30">
                    <div className="text-xs font-bold text-emerald-300">Exempt Field Labor (WH-347)</div>
                    <div className="text-xl font-black text-white mt-1">
                      ${snapshot.taxCompliance.exemptLaborUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[11px] text-emerald-200 font-semibold mt-1">
                      100% Sales Tax Exempt in {snapshot.taxCompliance.stateCode}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-400/40">
                    <div className="text-xs font-bold text-amber-300">
                      Estimated Sales &amp; Use Tax ({snapshot.taxCompliance.stateCode})
                    </div>
                    <div id="tax-estimated-amount" className="text-xl font-black text-amber-200 mt-1">
                      ${snapshot.taxCompliance.estimatedSalesUseTaxUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[11px] text-amber-100 mt-1">
                      {snapshot.taxCompliance.taxExempt
                        ? `Exemption Savings: $${snapshot.taxCompliance.taxSavingsIfExemptUsd.toLocaleString()}`
                        : `State SUTA Base Rate: ${snapshot.taxCompliance.sutaBaseRatePct}%`}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-sky-500/15 border border-sky-400/40">
                    <div className="text-xs font-bold text-sky-300">
                      MHA Nation Tribal TERO (2.5%)
                    </div>
                    <div className="text-xl font-black text-sky-200 mt-1">
                      $21,388.13
                    </div>
                    <div className="text-[11px] text-sky-100 mt-1">
                      ND Material Tax ($24,375.81) + Fort Berthold TERO
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-orange-500/15 border border-orange-400/30">
                    <div className="text-xs font-bold text-orange-300">Quarterly IRS Form 941 Deposit</div>
                    <div className="text-xl font-black text-white mt-1">
                      ${snapshot.taxCompliance.form941QuarterlySummary.totalForm941DepositUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[11px] text-slate-200 mt-1">
                      Employer FICA + Withholding ({snapshot.taxCompliance.form941QuarterlySummary.quarter})
                    </div>
                  </div>
                </div>

                <div className="relative z-10 mt-4 p-3.5 rounded-xl bg-[#09152B]/70 border border-[#C9A84C]/25 text-xs text-slate-100">
                  <strong>Construction Tax Rule ({snapshot.taxCompliance.stateName}):</strong>{" "}
                  {snapshot.taxCompliance.constructionRule}
                </div>

                {taxVerifyNotice && (
                  <div className="relative z-10 mt-3 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-xs text-emerald-200 font-bold">
                    {taxVerifyNotice}
                  </div>
                )}

                {/* 1099-NEC Table with Live W-9 & COI Verification */}
                <div className="relative z-10 overflow-x-auto mt-5 bg-white rounded-xl text-slate-900 p-2">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b bg-slate-100 text-slate-600 uppercase text-[11px]">
                        <th className="py-2.5 px-3">Subcontractor</th>
                        <th className="py-2.5 px-3">State</th>
                        <th className="py-2.5 px-3">EIN / TIN</th>
                        <th className="py-2.5 px-3 text-right">YTD Payments</th>
                        <th className="py-2.5 px-3 text-center">W-9</th>
                        <th className="py-2.5 px-3 text-center">COI</th>
                        <th className="py-2.5 px-3">1099-NEC E-File Status &amp; Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {snapshot.taxCompliance.vendors1099Nec.map((v) => {
                        const needsVerification =
                          v.w9Status !== "VERIFIED" || v.coiStatus !== "ACTIVE";
                        return (
                          <tr key={v.id} className="hover:bg-slate-50">
                            <td className="py-3 px-3 font-bold text-slate-900">{v.businessName}</td>
                            <td className="py-3 px-3 font-semibold">{v.stateServed}</td>
                            <td className="py-3 px-3 font-mono text-slate-600">{v.tinMasked}</td>
                            <td className="py-3 px-3 text-right font-mono font-bold">
                              ${v.ytdPaidUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                  v.w9Status === "VERIFIED"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-amber-100 text-amber-900"
                                }`}
                              >
                                {v.w9Status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                  v.coiStatus === "ACTIVE"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-amber-100 text-amber-900"
                                }`}
                              >
                                {v.coiStatus}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                    v.filingStatus === "READY_TO_EFILE_1099"
                                      ? "bg-emerald-100 text-emerald-900"
                                      : "bg-amber-100 text-amber-900"
                                  }`}
                                >
                                  {v.filingStatus}
                                </span>
                                {needsVerification && (
                                  <button
                                    type="button"
                                    data-magnetic
                                    onClick={() =>
                                      handleVerifyVendorCompliance(v.id, v.businessName)
                                    }
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-black text-slate-950 shadow"
                                    style={{ background: TAYCO_GOLD }}
                                  >
                                    ✅ Verify W-9 &amp; COI
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* ── VIEW 08: EXECUTIVE INVESTOR PORTAL, LENDER DRAWS & 7-SECTION MASTER DOSSIER ── */}
          {activeView === "VIEW_08_INVESTOR" && (
            <section id="panel-MOD_INVESTOR_PORTAL" className="space-y-6">
              {/* EXPLICIT TAKEOFF PRO (:8085) CONNECTION BANNER */}
              <div className="rounded-2xl p-4 sm:p-5 border-2 border-[#C9A84C]/60 bg-gradient-to-r from-[#09152B] via-[#1B3A6B] to-[#0F2040] shadow-xl">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-[11px] font-black uppercase tracking-wider text-emerald-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      📐 CONNECTED TO TAKEOFF PRO v5.0 (:8085) — MASTER DOSSIER &amp; STOCHASTIC MONTE CARLO P80 FEED — 369 SHA-256 Line Items
                    </div>
                    <p className="text-xs sm:text-sm text-slate-100">
                      Synchronized across <strong>32 ARCH-D Sheets / 87 Sub-Views</strong>: <strong>DOSSIER-SON_OF_STAR-V28 (7 Certified Sections)</strong> ·{" "}
                      <strong>$106,940.65 / cabin · $151.69 / sq.ft.</strong> ·{" "}
                      <strong className="text-amber-300">99.4% Triple AI Consensus · 0 Double Counting</strong>.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      data-magnetic
                      onClick={handleSyncTakeoffPro}
                      className="px-3.5 py-2 rounded-xl text-xs font-black text-slate-950 shadow"
                      style={{ background: TAYCO_GOLD }}
                    >
                      🔄 Sync Live from Takeoff Pro (:8085)
                    </button>
                    <a
                      href={snapshot.takeoffBridge.url}
                      target="_blank"
                      rel="noreferrer"
                      data-magnetic
                      className="px-3.5 py-2 rounded-xl text-xs font-bold border border-[#C9A84C]/50 text-amber-100 hover:bg-white/10"
                    >
                      🚀 Open Blueprint in Takeoff Pro (:8085) ↗
                    </a>
                  </div>
                </div>
              </div>

              {/* 7 CERTIFIED SECTIONS OF THE MASTER DOSSIER (DOSSIER-SON_OF_STAR-V28) */}
              {dossier && (
                <div
                  data-response-kind="surface"
                  onMouseMove={handleSurfaceMouseMove}
                  onMouseLeave={handleSurfaceMouseLeave}
                  className={`${cardSurfaceClass} rounded-2xl p-6 relative overflow-hidden`}
                  style={livingCardInlineStyle}
                >
                  <div className="response-wash pointer-events-none" aria-hidden="true" />
                  <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/15">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                        📊 CERTIFIED BANK &amp; REIT UNDERWRITING PACKAGE · {dossier.dossierId}
                      </span>
                      <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                        📊 5. Executive Investor Portal, Lender Draws &amp; 7-Section Master Dossier
                      </h2>
                      <p className="text-xs text-slate-200 mt-0.5">
                        {dossier.projectTitle} · {dossier.location} · {dossier.cabinsCount} Cabins ({dossier.totalSqFt.toLocaleString()} Sq.Ft.)
                      </p>
                    </div>
                    <button
                      type="button"
                      data-magnetic
                      onClick={() =>
                        downloadFile(
                          "TAYCO_DOSSIER_SON_OF_STAR_V28.json",
                          JSON.stringify(dossier, null, 2),
                          "application/json"
                        )
                      }
                      className="px-4 py-2.5 rounded-xl text-xs font-black text-slate-950 shrink-0 shadow"
                      style={{ background: TAYCO_GOLD }}
                    >
                      ⬇️ Download Certified 7-Section Dossier (JSON)
                    </button>
                  </div>

                  {/* 7 Dossier Cards Grid */}
                  <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-5">
                    {dossier.sections.map((sec) => (
                      <div
                        key={sec.code}
                        className="p-4 rounded-2xl bg-[#09152B]/80 border border-[#C9A84C]/30 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 text-[10px] font-mono font-bold text-amber-300">
                            <span>
                              SECTION 0{sec.sectionNumber} · {sec.code}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-white/10 text-emerald-300">
                              {sec.blueprintRef}
                            </span>
                          </div>
                          <h3 className="text-base font-black text-white mt-1.5">
                            {sec.sectionNumber}. {sec.title}
                          </h3>
                          <div className="text-xs font-bold text-amber-200 mt-1">
                            {sec.headlineKpi}
                          </div>
                          <p className="text-xs text-slate-300 mt-1.5">{sec.summary}</p>
                        </div>

                        <div className="mt-3 pt-3 border-t border-white/10 space-y-1">
                          {sec.metrics.map((m) => (
                            <div
                              key={m.label}
                              className="flex items-center justify-between text-[11px] gap-2"
                            >
                              <span className="text-slate-300">{m.label}:</span>
                              <strong className="font-mono text-white text-right">{m.value}</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* PARETO TOP 5 BLUEPRINT HIGHLIGHTS */}
                  <div className="relative z-10 mt-6 pt-6 border-t border-white/15">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                          📐 PARETO TOP 5 BLUEPRINT SHEETS (86.9% OF DIRECT CONSTRUCTION COST)
                        </span>
                        <h3 className="text-lg font-black text-white">
                          Direct Sheet-to-Cost Traceability in Takeoff Pro (:8085)
                        </h3>
                      </div>
                      <a
                        href={snapshot.takeoffBridge.url}
                        target="_blank"
                        rel="noreferrer"
                        data-magnetic
                        className="px-3.5 py-2 rounded-xl text-xs font-black text-slate-950"
                        style={{ background: TAYCO_GOLD }}
                      >
                        🚀 Inspect All 32 Sheets in Takeoff Pro (:8085) ↗
                      </a>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                      {dossier.paretoHighlights.map((ph) => (
                        <div
                          key={ph.sheetCode}
                          className="p-3.5 rounded-xl bg-white/5 border border-[#C9A84C]/35 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className="px-2 py-0.5 rounded font-mono text-xs font-black text-slate-950"
                                style={{ background: TAYCO_GOLD }}
                              >
                                {ph.sheetCode}
                              </span>
                              <span className="font-mono text-xs font-bold text-emerald-300">
                                {ph.shareOfDirectCostPct}% Direct
                              </span>
                            </div>
                            <div className="text-sm font-black text-white mt-2">
                              {ph.sheetTitle}
                            </div>
                            <div className="text-base font-mono font-black text-amber-300 mt-1">
                              ${ph.allocatedBudgetUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </div>
                            <p className="text-[11px] text-slate-300 mt-1">{ph.engineeringSpec}</p>
                          </div>
                          <a
                            href={ph.takeoffViewerUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-block text-[11px] font-extrabold text-amber-200 underline hover:text-white"
                          >
                            Open {ph.sheetCode} in :8085 ↗
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ── VIEW 07: TAKEOFF PRO 2D/3D BRIDGE & MONTE CARLO P80 TELEMETRY ── */}
          {activeView === "VIEW_07_TAKEOFF" && (
            <section id="panel-MOD_TAKEOFF_PRO" className="space-y-6">
              {/* EXPLICIT TAKEOFF PRO (:8085) CONNECTION BANNER */}
              <div className="rounded-2xl p-4 sm:p-5 border-2 border-[#C9A84C]/60 bg-gradient-to-r from-[#09152B] via-[#1B3A6B] to-[#0F2040] shadow-xl">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-[11px] font-black uppercase tracking-wider text-emerald-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      📐 CONNECTED TO TAKEOFF PRO v5.0 (:8085) — MULTI-ENDPOINT RUST ENGINE BRIDGE — 21 Deterministic Kernels
                    </div>
                    <p className="text-xs sm:text-sm text-slate-100">
                      Live synchronization with <code>/suite-bridge-preview</code>, <code>/master-dossier</code>, and <code>/e2e-critical-audit</code> across{" "}
                      <strong>32 ARCH-D Sheets / 87 Sub-Views</strong> (<strong>7/7 GO FOR BID</strong> · <strong>99.4% Triple AI Consensus</strong>).
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      data-magnetic
                      onClick={handleSyncTakeoffPro}
                      className="px-3.5 py-2 rounded-xl text-xs font-black text-slate-950 shadow"
                      style={{ background: TAYCO_GOLD }}
                    >
                      🔄 Sync Live from Takeoff Pro (:8085)
                    </button>
                    <a
                      href={snapshot.takeoffBridge.url}
                      target="_blank"
                      rel="noreferrer"
                      data-magnetic
                      className="px-3.5 py-2 rounded-xl text-xs font-bold border border-[#C9A84C]/50 text-amber-100 hover:bg-white/10"
                    >
                      🚀 Open Blueprint in Takeoff Pro (:8085) ↗
                    </a>
                  </div>
                </div>
              </div>

              <div
                data-response-kind="surface"
                onMouseMove={handleSurfaceMouseMove}
                onMouseLeave={handleSurfaceMouseLeave}
                className={`${cardSurfaceClass} rounded-2xl p-6 sm:p-8 relative overflow-hidden`}
                style={livingCardInlineStyle}
              >
                <div className="response-wash pointer-events-none" aria-hidden="true" />
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <span
                      className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider"
                      style={{ background: "rgba(201,168,76,0.22)", color: TAYCO_GOLD_LIGHT }}
                    >
                      📐 LIVE TAKEOFF PRO BRIDGE v{snapshot.takeoffBridge.rustEngineVersion} · 21 RUST KERNELS
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
                      2D/3D CAD Workstation, CSI-32 Budget &amp; Monte Carlo P80 Telemetry
                    </h2>
                    <p className="text-sm text-slate-200 mt-1 max-w-2xl">
                      Connected directly to <code className="text-amber-300">{snapshot.takeoffBridge.url}</code>. All vector blueprint takeoffs drive purchase orders, certified WH-347 payroll, 3-Bid Leveling, and AIA G702/G703 payment applications for TAYCO LLC.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <a
                      href={snapshot.takeoffBridge.url}
                      target="_blank"
                      rel="noreferrer"
                      data-magnetic
                      className="px-5 py-3 rounded-xl font-black text-xs sm:text-sm text-slate-950 shadow-md"
                      style={{ background: TAYCO_GOLD }}
                    >
                      🚀 Open Blueprint in Takeoff Pro (:8085) ↗
                    </a>
                    <button
                      type="button"
                      data-magnetic
                      onClick={handleSyncTakeoffPro}
                      className="px-4 py-3 rounded-xl font-bold text-xs sm:text-sm border border-[#C9A84C]/40 hover:bg-white/10 text-white"
                    >
                      🔄 Sync Live from Takeoff Pro (:8085)
                    </button>
                  </div>
                </div>

                {/* Monte Carlo P50 / P80 / P95 Confidence Interval Visual Bar */}
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/15">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-xs text-slate-300 font-bold">Monte Carlo P50 (Base Deterministic)</div>
                    <div className="text-xl font-black text-white mt-1">$855,525.23</div>
                    <div className="text-xs text-emerald-300 mt-1">16 CSI Divisions · 369 SHA-256 Line Items</div>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-400/40">
                    <div className="text-xs text-amber-300 font-bold">Monte Carlo P80 (+5.0% Contingency)</div>
                    <div className="text-xl font-black text-amber-200 mt-1">$898,301.49</div>
                    <div className="text-xs text-amber-100 mt-1">+$42,776.26 Recommended Risk Reserve</div>
                  </div>
                  <div className="p-4 rounded-xl bg-orange-500/15 border border-orange-400/30">
                    <div className="text-xs text-orange-300 font-bold">Monte Carlo P95 (Extreme Weather/Supply)</div>
                    <div className="text-xl font-black text-white mt-1">$928,244.87</div>
                    <div className="text-xs text-slate-200 mt-1">2,000 Stochastic Iterations Verified</div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
