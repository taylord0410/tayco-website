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

interface SuiteSnapshot {
  activeTenant: TaycoTenant;
  activeInvitation: TaycoInvitation;
  tenants: TaycoTenant[];
  modules: TaycoModuleDef[];
  allowedModules: TaycoModuleDef[];
  invitations: TaycoInvitation[];
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
    aiaG702PayAppNumber: number;
    aiaGrossCompletedToDateUsd: number;
    aiaRetainage10PctUsd: number;
    aiaPreviousCertificatesUsd: number;
    aiaCurrentNetPaymentDueUsd: number;
    committedMaterialPosCount: number;
    committedMaterialPosTotalUsd: number;
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
  takeoffBridge: {
    online: boolean;
    url: string;
    lastSyncAt: string;
    rustEngineVersion: string;
    activeKernelsCount: number;
    featuredProjectSlug: string;
    featuredProjectGmpUsd: number;
    evmCpi: number;
    evmSpi: number;
    monteCarloP80ContingencyUsd: number;
  };
}

export default function TaycoMultiTenantPortalPage() {
  const [snapshot, setSnapshot] = useState<SuiteSnapshot | null>(null);
  const [activeTab, setActiveTab] = useState<TaycoModuleId>("MOD_CRM_BIDS");
  const [showInviteBuilder, setShowInviteBuilder] = useState(false);
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

  const fetchSuite = useCallback(async (inviteCode?: string, tenantId?: string) => {
    const params = new URLSearchParams();
    if (inviteCode) params.set("invite", inviteCode);
    if (tenantId) params.set("tenant", tenantId);
    const res = await fetch(`/api/erp-suite?${params.toString()}`);
    if (res.ok) {
      const data: SuiteSnapshot = await res.json();
      setSnapshot(data);
      const allowedIds = data.allowedModules.map((m) => m.id);
      if (allowedIds.length > 0 && !allowedIds.includes(activeTab)) {
        if (allowedIds.includes("MOD_CRM_BIDS")) {
          setActiveTab("MOD_CRM_BIDS");
        } else {
          setActiveTab(allowedIds[0]);
        }
      }
    }
  }, [activeTab]);

  useEffect(() => {
    const search = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const inviteParam = search?.get("invite") || undefined;
    const tabParam = search?.get("tab") as TaycoModuleId | null;
    if (tabParam) {
      setActiveTab(tabParam);
    }
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
      const allowedIds = data.allowedModules.map((m) => m.id);
      if (allowedIds.length > 0 && !allowedIds.includes(activeTab)) {
        setActiveTab(allowedIds[0]);
      }
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
      const allowedIds: TaycoModuleId[] = data.allowedModules.map((m: TaycoModuleDef) => m.id);
      if (allowedIds.length > 0 && !allowedIds.includes(activeTab)) {
        setActiveTab(allowedIds[0]);
      }
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
          `✅ Live Synced with Takeoff Pro (${data.bridgeResult?.source || "CSI-32 Bridge"}): Son of a Star $855,525.23 GMP · 6,536 MH · 8 POs ($375,012.51)`
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
      <main className="min-h-screen pt-20 flex items-center justify-center" style={{ background: "#08121F" }}>
        <div className="text-center text-white">
          <div className="text-3xl font-black mb-2" style={{ color: "#C9A84C" }}>
            TAYCO LLC — ENTERPRISE SUITE
          </div>
          <p className="text-sm text-gray-300">Loading Multi-Tenant Portal &amp; Takeoff Pro Bridge...</p>
        </div>
      </main>
    );
  }

  const allowedIds = snapshot.allowedModules.map((m) => m.id);
  const isGuestRestricted = snapshot.activeInvitation.code !== "INV-TAYCO-MASTER";

  return (
    <main className="min-h-screen pt-16 pb-16" style={{ background: "#F1F5F9" }}>
      {/* ── 1. MULTI-TENANT & INVITATION EXECUTIVE BAR (#tayco-tenant-bar) ── */}
      <section
        id="tayco-tenant-bar"
        className="text-white border-b shadow-lg"
        style={{
          background: "linear-gradient(135deg, #08121F 0%, #0F2040 55%, #142B54 100%)",
          borderColor: "rgba(201,168,76,0.4)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span
                  className="px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider"
                  style={{ background: "rgba(201,168,76,0.2)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.45)" }}
                >
                  🔐 TAYCO MULTI-TENANT PORTAL &amp; MODULE INVITATIONS
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  ● Takeoff Pro v{snapshot.takeoffBridge.rustEngineVersion} ({snapshot.takeoffBridge.activeKernelsCount} Rust Kernels)
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {snapshot.activeTenant.name}
              </h1>
              <p className="text-xs sm:text-sm text-gray-300 mt-0.5">
                {snapshot.activeTenant.subtitle} · Active Role:{" "}
                <strong style={{ color: "#C9A84C" }}>{snapshot.activeInvitation.role}</strong>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                id="btn-open-invite-builder"
                onClick={() => setShowInviteBuilder(!showInviteBuilder)}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-transform hover:scale-105 shadow-md"
                style={{ background: "#C9A84C", color: "#0F2040" }}
              >
                🎟️ {showInviteBuilder ? "Hide Invitation Builder" : "Create Module Invitation"}
              </button>

              <button
                type="button"
                id="btn-sync-takeoff-live"
                onClick={handleSyncTakeoffPro}
                disabled={syncingBridge}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white border transition-colors hover:bg-white/10"
                style={{ borderColor: "rgba(201,168,76,0.55)" }}
              >
                {syncingBridge ? "🔄 Syncing :8085..." : "📐 Live Sync with Takeoff Pro (:8085)"}
              </button>
            </div>
          </div>

          {/* Selectors Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 pt-4 border-t border-white/10">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1">
                🏢 ACTIVE ORGANIZATION / TENANT
              </label>
              <select
                id="select-tayco-tenant"
                value={snapshot.activeTenant.id}
                onChange={(e) => handleSwitchTenant(e.target.value)}
                className="w-full rounded-lg px-3.5 py-2 text-sm font-bold text-slate-900 bg-white focus:outline-none"
              >
                {snapshot.tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} — (${(t.activeGmpUsd / 1e6).toFixed(2)}M Active)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1">
                🎟️ SESSION PROFILE / GUEST INVITATION PREVIEW (FILTERS MODULES LIVE)
              </label>
              <select
                id="select-active-invitation"
                value={snapshot.activeInvitation.code}
                onChange={(e) => handleSwitchInvitation(e.target.value)}
                className="w-full rounded-lg px-3.5 py-2 text-sm font-bold text-slate-900 bg-white focus:outline-none"
              >
                {snapshot.invitations.map((inv) => (
                  <option key={inv.code} value={inv.code}>
                    {inv.label} [{inv.code}]
                  </option>
                ))}
              </select>
            </div>
          </div>

          {bridgeBannerMsg && (
            <div className="mt-4 px-4 py-2.5 rounded-xl bg-emerald-950/90 border border-emerald-400/40 text-xs sm:text-sm text-emerald-200 font-semibold">
              {bridgeBannerMsg}
            </div>
          )}
        </div>
      </section>

      {/* ── GUEST PREVIEW BANNER (WHEN VIEWING AS AN INVITED CLIENT/CPA/INVESTOR) ── */}
      {isGuestRestricted && (
        <div
          id="tayco-guest-preview-banner"
          className="border-b px-4 py-3"
          style={{ background: "#FFFBEB", borderColor: "#F59E0B" }}
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs sm:text-sm text-amber-950">
              <strong>👁️ Guest Preview Active ({snapshot.activeInvitation.guestCompany}):</strong>{" "}
              Showing{" "}
              <strong>
                {snapshot.allowedModules.length} of {snapshot.modules.length} authorized modules
              </strong>{" "}
              under invitation code <code className="font-mono font-bold px-1.5 py-0.5 bg-amber-200/70 rounded">{snapshot.activeInvitation.code}</code>.
            </div>
            <button
              type="button"
              id="btn-restore-master-admin"
              onClick={() => handleSwitchInvitation("INV-TAYCO-MASTER")}
              className="px-3.5 py-1.5 rounded-lg text-xs font-extrabold text-white shrink-0"
              style={{ background: "#0F2040" }}
            >
              🔓 Restore Full Admin View (6/6)
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* ── 2. INTERACTIVE MODULE INVITATION BUILDER (#tayco-invitation-builder-card) ── */}
        {showInviteBuilder && (
          <section
            id="tayco-invitation-builder-card"
            className="bg-white rounded-2xl shadow-lg border-2 p-6 sm:p-8"
            style={{ borderColor: "#C9A84C" }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
              <div>
                <span
                  className="text-[11px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full"
                  style={{ background: "rgba(201,168,76,0.2)", color: "#0F2040" }}
                >
                  🎟️ B2B MODULE-SCOPED INVITATION GENERATOR
                </span>
                <h2 className="text-xl sm:text-2xl font-black mt-1" style={{ color: "#0F2040" }}>
                  Invite a Client, Investor, or CPA to Specific Modules
                </h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  Select the exact modules you want to showcase in your meeting. The invited guest will only see the authorized tabs.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateAndPreviewInvite} className="mt-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Guest Name *
                  </label>
                  <input
                    id="invite-input-name"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    required
                    className="w-full border rounded-lg px-3 py-2 text-sm font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Company / Firm *
                  </label>
                  <input
                    id="invite-input-company"
                    value={guestCompany}
                    onChange={(e) => setGuestCompany(e.target.value)}
                    required
                    className="w-full border rounded-lg px-3 py-2 text-sm font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    id="invite-input-email"
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    required
                    className="w-full border rounded-lg px-3 py-2 text-sm font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Role / Expiration
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="invite-input-role"
                      value={guestRole}
                      onChange={(e) => setGuestRole(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm text-slate-900"
                    />
                    <select
                      value={expiresInDays}
                      onChange={(e) => setExpiresInDays(Number(e.target.value))}
                      className="border rounded-lg px-2 py-2 text-xs font-bold text-slate-900 bg-slate-50"
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
                  <label className="text-xs font-extrabold uppercase tracking-wider" style={{ color: "#0F2040" }}>
                    SELECT MODULES TO PRESENT ({selectedModules.length} OF 6 CHECKED):
                  </label>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedModules(snapshot.modules.map((m) => m.id))}
                      className="text-xs font-bold underline text-slate-600 hover:text-slate-900"
                    >
                      Select All (6)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedModules(["MOD_TAKEOFF_PRO", "MOD_CRM_BIDS"])}
                      className="text-xs font-bold underline text-amber-700 hover:text-amber-900"
                    >
                      Commercial + Takeoff Only (2)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedModules([
                          "MOD_PAYROLL_CREW",
                          "MOD_QUICKBOOKS_ERP",
                          "MOD_TAX_COMPLIANCE",
                        ])
                      }
                      className="text-xs font-bold underline text-emerald-700 hover:text-emerald-900"
                    >
                      CPA Finance + Tax (3)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {snapshot.modules.map((mod) => {
                    const checked = selectedModules.includes(mod.id);
                    return (
                      <label
                        key={mod.id}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                          checked
                            ? "bg-amber-50/70 border-amber-500 shadow-sm"
                            : "bg-slate-50 border-slate-200 opacity-75"
                        }`}
                      >
                        <input
                          type="checkbox"
                          id={`chk-invite-${mod.id}`}
                          checked={checked}
                          onChange={() => toggleModuleCheckbox(mod.id)}
                          className="mt-1 h-4 w-4 accent-amber-600"
                        />
                        <div className="text-xs">
                          <div className="font-extrabold text-slate-900">{mod.title}</div>
                          <div className="text-slate-600 mt-0.5">{mod.description}</div>
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
                  className="px-6 py-3 rounded-xl font-black text-sm shadow-md transition-transform hover:scale-[1.01]"
                  style={{ background: "#0F2040", color: "#C9A84C" }}
                >
                  ✨ Generate Invitation Link &amp; Preview Guest View Now
                </button>

                {createdInviteBanner && (
                  <div
                    id="generated-invite-result"
                    className="flex flex-wrap items-center gap-3 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-950"
                  >
                    <span>
                      Invitation Created: <strong className="font-mono">{createdInviteBanner.code}</strong>
                    </span>
                    <span className="font-mono bg-white px-2 py-1 rounded border border-emerald-200">
                      {createdInviteBanner.shareUrl}
                    </span>
                    <span className="font-bold text-emerald-700">
                      ({createdInviteBanner.allowedModules.length} active modules)
                    </span>
                  </div>
                )}
              </div>
            </form>
          </section>
        )}

        {/* ── 3. MODULE NAVIGATION TABS (FILTERED BY INVITATION PERMISSIONS) ── */}
        <div
          id="tayco-portal-module-tabs"
          className="flex flex-wrap gap-2 bg-white p-2.5 rounded-2xl shadow-sm border border-slate-200"
        >
          {snapshot.modules.map((mod) => {
            const isAllowed = allowedIds.includes(mod.id);
            if (!isAllowed) return null;
            const isActive = activeTab === mod.id;
            return (
              <button
                key={mod.id}
                type="button"
                id={`tab-btn-${mod.id}`}
                onClick={() => setActiveTab(mod.id)}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 ${
                  isActive
                    ? "shadow-md scale-[1.01]"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
                style={
                  isActive
                    ? { background: "#0F2040", color: "#C9A84C" }
                    : undefined
                }
              >
                <span>{mod.shortTitle}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? "bg-amber-400/20 text-amber-200"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {mod.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── TAB 1: MOD_CRM_BIDS (COMMERCIAL CRM, BID PIPELINE & SUBCONTRACTOR REGISTRY) ── */}
        {activeTab === "MOD_CRM_BIDS" && allowedIds.includes("MOD_CRM_BIDS") && (
          <section id="panel-MOD_CRM_BIDS" className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="text-xs font-bold uppercase text-slate-500">Total Commercial Pipeline</div>
                <div className="text-2xl sm:text-3xl font-black mt-1" style={{ color: "#0F2040" }}>
                  ${(snapshot.crm.pipelineTotalUsd / 1e6).toFixed(2)}M USD
                </div>
                <div className="text-xs text-emerald-700 font-semibold mt-1">
                  ${snapshot.crm.pipelineTotalUsd.toLocaleString()} in active bids &amp; contracts
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="text-xs font-bold uppercase text-slate-500">Active Projects &amp; Web Leads</div>
                <div className="text-2xl sm:text-3xl font-black mt-1" style={{ color: "#0F2040" }}>
                  {snapshot.crm.activeProjectsCount} Projects
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Connected to <code className="font-mono">/estimate</code> &amp; <code className="font-mono">/investor</code>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="text-xs font-bold uppercase text-slate-500">Takeoff Pro CAD Bridge</div>
                <div className="text-2xl sm:text-3xl font-black mt-1" style={{ color: "#C9A84C" }}>
                  {snapshot.crm.takeoffSyncedCount} Synced
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Son of a Star ($855.5K) + Park Tower
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="text-xs font-bold uppercase text-slate-500">Subcontractor Network</div>
                <div className="text-2xl sm:text-3xl font-black mt-1" style={{ color: "#0F2040" }}>
                  {snapshot.crm.subcontractors.length} Vendors
                </div>
                <div className="text-xs text-emerald-700 font-semibold mt-1">
                  29 Trades Across 8 States (W-9 &amp; COI Audited)
                </div>
              </div>
            </div>

            {/* Opportunities Table + Quick Add */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <h2 className="text-xl font-black" style={{ color: "#0F2040" }}>
                    🤝 1. Commercial Bid Pipeline &amp; CSI-32 Estimates
                  </h2>
                  <p className="text-xs text-slate-600">
                    Every submission from <Link href="/estimate" className="underline font-bold">/estimate</Link> or <Link href="/investor" className="underline font-bold">/investor</Link> automatically populates this pipeline and links to Takeoff Pro.
                  </p>
                </div>

                <form onSubmit={handleCreateQuickLead} className="flex flex-wrap items-center gap-2">
                  <input
                    placeholder="New Project / Bid Title..."
                    value={newLeadTitle}
                    onChange={(e) => setNewLeadTitle(e.target.value)}
                    className="border rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-900"
                  />
                  <input
                    placeholder="Client / REIT"
                    value={newLeadClient}
                    onChange={(e) => setNewLeadClient(e.target.value)}
                    className="border rounded-lg px-3 py-1.5 text-xs text-slate-900 w-36"
                  />
                  <input
                    placeholder="City, State"
                    value={newLeadLocation}
                    onChange={(e) => setNewLeadLocation(e.target.value)}
                    className="border rounded-lg px-2.5 py-1.5 text-xs text-slate-900 w-32"
                  />
                  <input
                    type="number"
                    placeholder="Value USD"
                    value={newLeadValue}
                    onChange={(e) => setNewLeadValue(e.target.value)}
                    className="border rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 w-28"
                  />
                  <button
                    type="submit"
                    id="btn-add-crm-opportunity"
                    className="px-3.5 py-1.5 rounded-lg text-xs font-extrabold text-white"
                    style={{ background: "#0F2040" }}
                  >
                    + Add Commercial Bid
                  </button>
                </form>
              </div>

              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50 text-slate-600 uppercase text-[11px]">
                      <th className="py-3 px-3">Code</th>
                      <th className="py-3 px-3">Project / Opportunity</th>
                      <th className="py-3 px-3">Client / Owner</th>
                      <th className="py-3 px-3">Location</th>
                      <th className="py-3 px-3 text-right">Area (SqFt)</th>
                      <th className="py-3 px-3 text-right">GMP Estimate</th>
                      <th className="py-3 px-3">Stage / Takeoff</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {snapshot.crm.opportunities.map((opp) => (
                      <tr key={opp.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-3 font-mono font-bold text-slate-700">{opp.projectCode}</td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{opp.title}</div>
                          <div className="text-[11px] text-slate-500">
                            {opp.division} · {opp.csiDivisionsCount} CSI Divs · Source: {opp.source}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800">{opp.clientName}</div>
                          <div className="text-[11px] text-slate-500">{opp.contactEmail}</div>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-700">{opp.location}</td>
                        <td className="py-3 px-3 text-right font-mono">{opp.sqft.toLocaleString()}</td>
                        <td className="py-3 px-3 text-right font-mono font-black text-slate-900">
                          ${opp.estimatedValueUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900">
                            {opp.stage}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Subcontractor Directory Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
                <div>
                  <h3 className="text-lg font-black" style={{ color: "#0F2040" }}>
                    🛠️ Pre-Qualified Subcontractor Registry (29 Trades · W-9 &amp; COI Gate)
                  </h3>
                  <p className="text-xs text-slate-600">
                    Synced with <Link href="/vendor-application" className="underline font-bold">/vendor-application</Link> and the IRS 1099-NEC Tax Engine.
                  </p>
                </div>
                <Link
                  href="/vendor-application"
                  className="px-4 py-2 rounded-xl text-xs font-extrabold w-fit"
                  style={{ background: "#C9A84C", color: "#0F2040" }}
                >
                  + Onboard New Subcontractor (/vendor-application)
                </Link>
              </div>

              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50 text-slate-600 uppercase text-[11px]">
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
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              sub.w9Status === "VERIFIED"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {sub.w9Status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              sub.coiStatus === "ACTIVE"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
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
            </div>
          </section>
        )}

        {/* ── TAB 2: MOD_PAYROLL_CREW (CONSTRUCTION PAYROLL, FIELD CREWS & DAVIS-BACON WH-347) ── */}
        {activeTab === "MOD_PAYROLL_CREW" && allowedIds.includes("MOD_PAYROLL_CREW") && (
          <section id="panel-MOD_PAYROLL_CREW" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="text-xs font-bold uppercase text-slate-500">Total Labor Budget (Takeoff APU)</div>
                <div className="text-2xl sm:text-3xl font-black mt-1" style={{ color: "#0F2040" }}>
                  ${snapshot.payroll.totalLaborBudgetUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-emerald-700 font-semibold mt-1">
                  Synced with Son of a Star CSI-32
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="text-xs font-bold uppercase text-slate-500">Total Field Man-Hours</div>
                <div className="text-2xl sm:text-3xl font-black mt-1" style={{ color: "#0F2040" }}>
                  {snapshot.payroll.totalManHours.toLocaleString("en-US", { minimumFractionDigits: 1 })} MH
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  {snapshot.payroll.totalCrewDays} Scheduled Crew-Days
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="text-xs font-bold uppercase text-slate-500">Weighted Loaded Hourly Rate</div>
                <div className="text-2xl sm:text-3xl font-black mt-1" style={{ color: "#C9A84C" }}>
                  ${snapshot.payroll.weightedAvgHourlyRateUsd.toFixed(2)} / hr
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Includes Base Wage + Fringe + Employer Burden
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="text-xs font-bold uppercase text-slate-500">Total Employer Tax &amp; Burden</div>
                <div className="text-2xl sm:text-3xl font-black mt-1" style={{ color: "#0F2040" }}>
                  $41,974.55
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  FICA $13,106.34 · FUTA/SUTA $5,825.04 · WC $23,043.17
                </div>
              </div>
            </div>

            {/* Labor Burden Breakdown Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <h2 className="text-xl font-black" style={{ color: "#0F2040" }}>
                    👷 2. Federal Certified Davis-Bacon Payroll (Form WH-347) &amp; CSI Field Crews
                  </h2>
                  <p className="text-xs text-slate-600">
                    Exact breakdown of Base Wages ($171,324.71), FICA 7.65% ($13,106.34), FUTA/SUTA ($5,825.04), and Workers&apos; Comp &amp; Fringe ($23,043.17).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    downloadFile(
                      "TAYCO_Davis_Bacon_WH347_SonOfStar.json",
                      JSON.stringify(snapshot.payroll, null, 2),
                      "application/json"
                    )
                  }
                  className="px-4 py-2 rounded-xl text-xs font-extrabold shrink-0"
                  style={{ background: "#0F2040", color: "#C9A84C" }}
                >
                  ⬇️ Export Certified WH-347 Payroll (JSON/CSV)
                </button>
              </div>

              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50 text-slate-600 uppercase text-[11px]">
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
            </div>
          </section>
        )}

        {/* ── TAB 3: MOD_QUICKBOOKS_ERP (QUICKBOOKS ACCOUNTING SYNC & AIA G702/G703) ── */}
        {activeTab === "MOD_QUICKBOOKS_ERP" && allowedIds.includes("MOD_QUICKBOOKS_ERP") && (
          <section id="panel-MOD_QUICKBOOKS_ERP" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="text-xs font-bold uppercase text-slate-500">Active GMP Contract Sum</div>
                <div className="text-2xl sm:text-3xl font-black mt-1" style={{ color: "#0F2040" }}>
                  ${snapshot.quickbooks.contractGmpUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-slate-600 mt-1">QuickBooks Account 4100 Income</div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="text-xs font-bold uppercase text-slate-500">AIA G702/G703 Pay App #{snapshot.quickbooks.aiaG702PayAppNumber} Net</div>
                <div className="text-2xl sm:text-3xl font-black mt-1 text-emerald-700">
                  ${snapshot.quickbooks.aiaCurrentNetPaymentDueUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Gross Completed to Date: ${snapshot.quickbooks.aiaGrossCompletedToDateUsd.toLocaleString()}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="text-xs font-bold uppercase text-slate-500">10% Retainage (Account 1210)</div>
                <div className="text-2xl sm:text-3xl font-black mt-1" style={{ color: "#C9A84C" }}>
                  ${snapshot.quickbooks.aiaRetainage10PctUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-slate-600 mt-1">Held in Retainage Receivable Asset</div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="text-xs font-bold uppercase text-slate-500">8 Material POs (Account 5200)</div>
                <div className="text-2xl sm:text-3xl font-black mt-1" style={{ color: "#0F2040" }}>
                  ${snapshot.quickbooks.committedMaterialPosTotalUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-emerald-700 font-semibold mt-1">
                  8 Committed Purchase Orders Synced
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <h2 className="text-xl font-black" style={{ color: "#0F2040" }}>
                    📗 3. CSI-32 ↔ QuickBooks Chart of Accounts Mapping &amp; Job Costing
                  </h2>
                  <p className="text-xs text-slate-600">
                    Deterministic synchronization of Takeoff Pro budgets with QuickBooks Desktop (`.IIF`) and QuickBooks Online (`.QBO JSON`).
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    id="btn-toggle-iif-preview"
                    onClick={() => setShowIifModal(!showIifModal)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 text-slate-800 hover:bg-slate-100"
                  >
                    {showIifModal ? "Hide .IIF Journal Entry" : "👁️ Preview QuickBooks .IIF"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      downloadFile(
                        "TAYCO_SonOfStar_QuickBooks.iif",
                        snapshot.quickbooks.iifExportPreview,
                        "text/plain"
                      )
                    }
                    className="px-4 py-2 rounded-xl text-xs font-extrabold"
                    style={{ background: "#C9A84C", color: "#0F2040" }}
                  >
                    ⬇️ Download QuickBooks .IIF
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      downloadFile(
                        "TAYCO_SonOfStar_QBO_Journal.json",
                        JSON.stringify(snapshot.quickbooks, null, 2),
                        "application/json"
                      )
                    }
                    className="px-4 py-2 rounded-xl text-xs font-extrabold text-white"
                    style={{ background: "#0F2040" }}
                  >
                    ⬇️ Download .QBO JSON
                  </button>
                </div>
              </div>

              {showIifModal && (
                <pre className="mt-4 p-4 rounded-xl bg-slate-900 text-emerald-300 font-mono text-xs overflow-x-auto">
                  {snapshot.quickbooks.iifExportPreview}
                </pre>
              )}

              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50 text-slate-600 uppercase text-[11px]">
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

        {/* ── TAB 4: MOD_TAX_COMPLIANCE (MULTI-STATE TAX ENGINE & IRS 1099-NEC) ── */}
        {activeTab === "MOD_TAX_COMPLIANCE" && allowedIds.includes("MOD_TAX_COMPLIANCE") && (
          <section id="panel-MOD_TAX_COMPLIANCE" className="space-y-6">
            {/* State Selector & Tax-Exempt Toggle */}
            <div className="bg-white rounded-2xl border-2 p-6 shadow-sm" style={{ borderColor: "#0F2040" }}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <h2 className="text-xl font-black" style={{ color: "#0F2040" }}>
                    🏛️ 4. Multi-State Tax Engine (WI · IL · IA · IN · MN · MI · MO · TX · ND) &amp; IRS 1099-NEC
                  </h2>
                  <p className="text-xs text-slate-600">
                    Automatically separates Taxable Construction Materials ($375,012.51) from Exempt Field Labor ($213,299.26) according to jobsite state law.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Project Tax Jurisdiction
                    </label>
                    <select
                      id="select-tayco-tax-state"
                      value={snapshot.taxCompliance.stateCode}
                      onChange={(e) =>
                        handleTaxStateChange(e.target.value, snapshot.taxCompliance.taxExempt)
                      }
                      className="border-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-black text-slate-900 bg-amber-50/60"
                      style={{ borderColor: "#C9A84C" }}
                    >
                      {snapshot.taxCompliance.availableStates.map((st) => (
                        <option key={st.stateCode} value={st.stateCode}>
                          {st.stateCode} — {st.stateName} ({st.combinedSalesUseTaxPct}% Sales/Use Tax)
                        </option>
                      ))}
                    </select>
                  </div>

                  <label className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-300 cursor-pointer mt-4 lg:mt-0">
                    <input
                      type="checkbox"
                      id="toggle-tax-exempt"
                      checked={snapshot.taxCompliance.taxExempt}
                      onChange={(e) =>
                        handleTaxStateChange(snapshot.taxCompliance.stateCode, e.target.checked)
                      }
                      className="h-4 w-4 accent-emerald-600"
                    />
                    <span className="text-xs font-extrabold text-slate-900">
                      Tax-Exempt Certificate ({snapshot.taxCompliance.exemptionCertificateNumber})
                    </span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold text-slate-500">Taxable Materials (8 POs)</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    ${snapshot.taxCompliance.taxableMaterialsUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1">
                    Applied Rate ({snapshot.taxCompliance.stateCode}):{" "}
                    <strong>{snapshot.taxCompliance.effectiveRatePct}%</strong>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <div className="text-xs font-bold text-emerald-800">Exempt Field Labor (WH-347)</div>
                  <div className="text-2xl font-black text-emerald-950 mt-1">
                    ${snapshot.taxCompliance.exemptLaborUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                    100% Sales Tax Exempt in {snapshot.taxCompliance.stateCode}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-300">
                  <div className="text-xs font-bold text-amber-900">
                    Estimated Sales &amp; Use Tax ({snapshot.taxCompliance.stateCode})
                  </div>
                  <div id="tax-estimated-amount" className="text-2xl font-black text-amber-950 mt-1">
                    ${snapshot.taxCompliance.estimatedSalesUseTaxUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-amber-800 mt-1">
                    {snapshot.taxCompliance.taxExempt
                      ? `Exemption Savings: $${snapshot.taxCompliance.taxSavingsIfExemptUsd.toLocaleString()}`
                      : `State SUTA Base Rate: ${snapshot.taxCompliance.sutaBaseRatePct}%`}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 text-white">
                  <div className="text-xs font-bold text-amber-300">Quarterly IRS Form 941 Deposit</div>
                  <div className="text-2xl font-black mt-1">
                    ${snapshot.taxCompliance.form941QuarterlySummary.totalForm941DepositUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-gray-300 mt-1">
                    Employer FICA + Federal Withholding ({snapshot.taxCompliance.form941QuarterlySummary.quarter})
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3.5 rounded-xl bg-slate-100 text-xs text-slate-700">
                <strong>Construction Tax Rule ({snapshot.taxCompliance.stateName}):</strong>{" "}
                {snapshot.taxCompliance.constructionRule}
              </div>
            </div>

            {/* 1099-NEC Compliance Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-black mb-1" style={{ color: "#0F2040" }}>
                📋 Annual IRS Form 1099-NEC Compliance &amp; Preventive W-9 / COI Hold Gate
              </h3>
              <p className="text-xs text-slate-600 mb-4">
                Automatically flags subcontractors exceeding the $600 USD threshold and places payment holds if a verified W-9 or active COI is missing.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50 text-slate-600 uppercase text-[11px]">
                      <th className="py-2.5 px-3">Subcontractor</th>
                      <th className="py-2.5 px-3">State</th>
                      <th className="py-2.5 px-3">EIN / TIN</th>
                      <th className="py-2.5 px-3 text-right">YTD Payments</th>
                      <th className="py-2.5 px-3 text-center">W-9</th>
                      <th className="py-2.5 px-3 text-center">COI</th>
                      <th className="py-2.5 px-3">1099-NEC E-File Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {snapshot.taxCompliance.vendors1099Nec.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-bold text-slate-900">{v.businessName}</td>
                        <td className="py-3 px-3 font-semibold">{v.stateServed}</td>
                        <td className="py-3 px-3 font-mono text-slate-600">{v.tinMasked}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold">
                          ${v.ytdPaidUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                            {v.w9Status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                            {v.coiStatus}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              v.filingStatus === "READY_TO_EFILE_1099"
                                ? "bg-emerald-100 text-emerald-900"
                                : "bg-amber-100 text-amber-900"
                            }`}
                          >
                            {v.filingStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ── TAB 5 / 6: MOD_TAKEOFF_PRO & MOD_INVESTOR_PORTAL ── */}
        {(activeTab === "MOD_TAKEOFF_PRO" || activeTab === "MOD_INVESTOR_PORTAL") && (
          <section id="panel-MOD_TAKEOFF_PRO" className="space-y-6">
            <div
              className="rounded-2xl p-6 sm:p-8 text-white shadow-xl border"
              style={{
                background: "linear-gradient(145deg, #08121F 0%, #0F2040 60%, #142B54 100%)",
                borderColor: "#C9A84C",
              }}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <span
                    className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider"
                    style={{ background: "rgba(201,168,76,0.2)", color: "#C9A84C" }}
                  >
                    📐 LIVE TAKEOFF PRO BRIDGE v{snapshot.takeoffBridge.rustEngineVersion} · 21 RUST KERNELS
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black mt-2">
                    2D/3D CAD Workstation, CSI-32 Budget &amp; Executive Investor Dossier
                  </h2>
                  <p className="text-sm text-gray-300 mt-1 max-w-2xl">
                    Connected directly to <code className="text-amber-300">{snapshot.takeoffBridge.url}</code>. All vector blueprint takeoffs drive purchase orders, certified WH-347 payroll, and AIA G702/G703 payment applications for TAYCO LLC.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <a
                    href={snapshot.takeoffBridge.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-3 rounded-xl font-black text-xs sm:text-sm shadow-md"
                    style={{ background: "#C9A84C", color: "#0F2040" }}
                  >
                    🚀 Launch Takeoff Pro Workstation (:8085) ↗
                  </a>
                  <button
                    type="button"
                    onClick={handleSyncTakeoffPro}
                    className="px-4 py-3 rounded-xl font-bold text-xs sm:text-sm border border-white/30 hover:bg-white/10"
                  >
                    🔄 Re-Sync CSI-32 Data
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-xs text-gray-400">Flagship Synced Project</div>
                  <div className="text-xl font-black mt-1" style={{ color: "#C9A84C" }}>
                    Son of a Star ($855,525.23)
                  </div>
                  <div className="text-xs text-emerald-300 mt-1">16 CSI Divisions · 369 SHA-256 Line Items</div>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-xs text-gray-400">EVM Performance (Earned Value)</div>
                  <div className="text-xl font-black text-white mt-1">
                    CPI {snapshot.takeoffBridge.evmCpi} · SPI {snapshot.takeoffBridge.evmSpi}
                  </div>
                  <div className="text-xs text-gray-300 mt-1">Under budget &amp; on critical path</div>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-xs text-gray-400">Monte Carlo Contingency (P80)</div>
                  <div className="text-xl font-black text-amber-300 mt-1">
                    ${snapshot.takeoffBridge.monteCarloP80ContingencyUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-gray-300 mt-1">2,000-iteration stochastic simulation</div>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-xs text-gray-400">Hybrid Web Architecture</div>
                  <div className="text-xl font-black text-emerald-300 mt-1">
                    Astro 5 + Next.js 16
                  </div>
                  <div className="text-xs text-gray-300 mt-1">
                    <a href="/astro-preview/index.html" className="underline">View Static Astro 5 Build →</a>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
