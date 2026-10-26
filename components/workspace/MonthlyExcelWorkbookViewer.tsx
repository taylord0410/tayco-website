"use client";

import { useState, useMemo } from "react";
import {
  MONTHLY_MICROPROJECTS_2026,
  getMicroProjectsByPeriod,
  type MonthlyMicroProject,
} from "@/lib/monthly-microprojects-2026";

export interface MonthlyExcelWorkbookViewerProps {
  selectedMonth: string; // e.g. "2026-09", "2026-08", ..., "2026-01", "2026-10"
  onSelectMonth: (monthKey: string) => void;
  onClose: () => void;
  isGuest?: boolean;
}

interface MonthTabConfig {
  key: string;
  shortLabel: string;
  monthName: string;
  targetBilled: number;
}

const ALL_MONTH_TABS: readonly MonthTabConfig[] = [
  { key: "2026-09", shortLabel: "Sep 2026", monthName: "September 2026", targetBilled: 938489 },
  { key: "2026-08", shortLabel: "Aug 2026", monthName: "August 2026", targetBilled: 940789 },
  { key: "2026-07", shortLabel: "Jul 2026", monthName: "July 2026", targetBilled: 908792 },
  { key: "2026-06", shortLabel: "Jun 2026", monthName: "June 2026", targetBilled: 921578 },
  { key: "2026-05", shortLabel: "May 2026", monthName: "May 2026", targetBilled: 825679 },
  { key: "2026-04", shortLabel: "Apr 2026", monthName: "April 2026", targetBilled: 700789 },
  { key: "2026-03", shortLabel: "Mar 2026", monthName: "March 2026", targetBilled: 719789 },
  { key: "2026-02", shortLabel: "Feb 2026", monthName: "February 2026", targetBilled: 657680 },
  { key: "2026-01", shortLabel: "Jan 2026", monthName: "January 2026", targetBilled: 425000 },
  { key: "2026-10", shortLabel: "Oct 2026", monthName: "October 2026", targetBilled: 21789 },
];

interface SelectedCellDetails {
  cellCoord: string;
  formula: string;
  valueDisplay: string;
  label: string;
}

export default function MonthlyExcelWorkbookViewer({
  selectedMonth,
  onSelectMonth,
  onClose,
  isGuest = false,
}: MonthlyExcelWorkbookViewerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCell, setActiveCell] = useState<SelectedCellDetails | null>(null);

  // Active month resolution
  const activeTabConfig = useMemo(() => {
    return (
      ALL_MONTH_TABS.find((tab) => tab.key === selectedMonth) ||
      ALL_MONTH_TABS[0]
    );
  }, [selectedMonth]);

  const activePeriod = activeTabConfig.key;

  // Retrieve projects for the active month
  const rawProjects = useMemo(() => {
    return getMicroProjectsByPeriod(activePeriod);
  }, [activePeriod]);

  // Search filter
  const filteredProjects = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return rawProjects;
    return rawProjects.filter((p) => {
      return (
        p.id.toLowerCase().includes(term) ||
        p.invoiceRef.toLowerCase().includes(term) ||
        p.state.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        p.csiDivision.toLowerCase().includes(term) ||
        p.fieldLead.toLowerCase().includes(term) ||
        p.scopeSummary.toLowerCase().includes(term) ||
        p.startDate.includes(term) ||
        p.completedDate.includes(term) ||
        String(p.incomeUsd).includes(term)
      );
    });
  }, [rawProjects, searchTerm]);

  // Exact Month Totals
  const { totalGross, totalMaterials, totalLabor, totalHours } = useMemo(() => {
    return filteredProjects.reduce(
      (acc, p) => {
        acc.totalGross += p.incomeUsd;
        acc.totalMaterials += p.materialUsd;
        acc.totalLabor += p.laborUsd;
        acc.totalHours += p.laborHours;
        return acc;
      },
      { totalGross: 0, totalMaterials: 0, totalLabor: 0, totalHours: 0 }
    );
  }, [filteredProjects]);

  // Formatter helpers
  const formatUsd = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);

  const formatHours = (hours: number) =>
    new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(hours) + " hrs";

  // Default SUM Formula string
  const defaultFormulaString = useMemo(() => {
    const lastRow = filteredProjects.length + 1;
    return `=SUM(L2:L${lastRow})  →  ${formatUsd(totalGross)} (${filteredProjects.length} reconciled projects in ${activeTabConfig.monthName})`;
  }, [filteredProjects.length, totalGross, activeTabConfig.monthName]);

  const defaultActiveCellCoord = `L${filteredProjects.length + 2}`;

  // CSV Export Handler
  const handleDownloadCsv = () => {
    const headers = [
      "Row",
      "Project ID",
      "Invoice Ref",
      "Start Date",
      "Completion Date",
      "State",
      "Trade Category",
      "CSI Division",
      "Field Superintendent",
      "Labor Hours",
      "Materials USD",
      "Labor USD",
      "Gross Billed USD",
      "Status",
      "Scope Summary",
    ];

    const escapeCsv = (val: string | number) => {
      const str = String(val ?? "");
      if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvLines: string[] = [headers.map(escapeCsv).join(",")];

    filteredProjects.forEach((p, idx) => {
      csvLines.push(
        [
          idx + 1,
          p.id,
          p.invoiceRef,
          p.startDate,
          p.completedDate,
          p.state,
          p.category,
          p.csiDivision,
          p.fieldLead,
          p.laborHours,
          p.materialUsd,
          p.laborUsd,
          p.incomeUsd,
          p.status,
          p.scopeSummary,
        ]
          .map(escapeCsv)
          .join(",")
      );
    });

    // Final Total Row in CSV
    csvLines.push(
      [
        "TOTAL",
        `MONTH_${activePeriod}`,
        `TOTAL RECONCILED (${activeTabConfig.shortLabel})`,
        "",
        "",
        "",
        "",
        "",
        "",
        totalHours,
        totalMaterials,
        totalLabor,
        totalGross,
        "Reconciled",
        `Consolidated ledger export for ${activeTabConfig.monthName}`,
      ]
        .map(escapeCsv)
        .join(",")
    );

    const csvContent = csvLines.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `TAYCO_2026_Corporate_Ledger_${activePeriod}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      data-testid="monthly-excel-workbook-viewer"
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 md:p-6 overflow-hidden animate-in fade-in duration-150"
    >
      <div className="relative flex flex-col w-full h-full max-w-[1600px] mx-auto rounded-xl border border-[#107c41]/50 bg-[#071320] shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden font-sans">
        {/* ========================================================= */}
        {/* 1. TOP BAR: EXCEL EMERALD BANNER & WORKBOOK TITLE         */}
        {/* ========================================================= */}
        <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-gradient-to-r from-[#0a271c] via-[#0f3d2e] to-[#0d2a1f] border-b border-[#107c41]/40 text-white select-none">
          <div className="flex items-center gap-3 min-w-0">
            {/* Excel Icon Badge */}
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#107c41] to-[#0b542c] shadow-md border border-emerald-400/30 text-white font-extrabold text-lg tracking-tighter">
              <span className="drop-shadow-sm">X</span>
              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border border-slate-900" />
            </div>

            {/* Workbook File Name & Metadata */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-emerald-100 tracking-tight truncate font-mono">
                  TAYCO_2026_Historical_Workbook_{activePeriod}.xlsx
                </h1>
                <span className="hidden sm:inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                  Excel Reconciled
                </span>
                {isGuest && (
                  <span className="hidden md:inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-500/30">
                    Guest Verified View
                  </span>
                )}
              </div>
              <p className="text-[11px] text-emerald-200/70 truncate">
                Multi-State Prime Reconciled Ledger · Fiscal Year 2026 · Sheet: {activeTabConfig.monthName}
              </p>
            </div>
          </div>

          {/* Quick Row Search, CSV Download & Close */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Instant Filter Search */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search invoice, trade, state, lead..."
                className="w-48 sm:w-64 pl-7 pr-7 py-1 text-xs rounded-md bg-[#051318]/90 text-slate-100 placeholder-slate-400 border border-emerald-600/40 focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400 transition"
              />
              <svg
                className="absolute left-2 top-1.5 h-3.5 w-3.5 text-emerald-400/80 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1.5 text-xs text-slate-400 hover:text-white"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* CSV Export Button */}
            <button
              onClick={handleDownloadCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md bg-[#107c41] hover:bg-[#158f4c] text-white border border-emerald-400/40 shadow-sm transition active:scale-95"
              title="Download reconciled data as .CSV spreadsheet"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              <span className="hidden sm:inline">Download</span> .CSV
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center h-7 w-7 rounded-md bg-emerald-950/70 hover:bg-rose-900/80 text-emerald-200 hover:text-rose-100 border border-emerald-500/30 hover:border-rose-500/50 transition"
              aria-label="Close Excel Viewer"
              title="Close Excel Viewer (Esc)"
            >
              <span className="text-sm font-bold leading-none">✕</span>
            </button>
          </div>
        </header>

        {/* ========================================================= */}
        {/* 2. EXCEL FORMULA BAR (fx)                                 */}
        {/* ========================================================= */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0a1827] border-b border-slate-700/60 text-xs select-none">
          {/* Active Cell Coord Box (e.g. L28 or L2) */}
          <div className="flex items-center justify-center w-16 px-2 py-0.5 rounded bg-[#06101c] border border-slate-700 text-emerald-400 font-mono font-bold text-center">
            {activeCell ? activeCell.cellCoord : defaultActiveCellCoord}
          </div>

          {/* Formula 'fx' Indicator Button */}
          <button
            onClick={() => setActiveCell(null)}
            className="flex items-center justify-center px-2 py-0.5 rounded text-slate-300 hover:text-emerald-300 font-serif italic font-bold hover:bg-slate-800 transition"
            title="Reset formula to column sum"
          >
            fx
          </button>

          {/* Formula Line Display */}
          <div className="flex-1 flex items-center px-2.5 py-0.5 rounded bg-[#06101c] border border-slate-800/90 text-slate-200 font-mono text-[12px] overflow-x-auto whitespace-nowrap">
            {activeCell ? (
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-semibold">{activeCell.formula}</span>
                <span className="text-slate-400">→</span>
                <span className="text-amber-200">{activeCell.valueDisplay}</span>
                <span className="text-slate-500 text-[11px]">({activeCell.label})</span>
              </div>
            ) : (
              <span className="text-emerald-400 font-semibold">{defaultFormulaString}</span>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. MONTH KPI STRIP                                        */}
        {/* ========================================================= */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 p-2.5 bg-[#091522] border-b border-slate-700/60 text-xs">
          {/* Active Month Box */}
          <div className="flex flex-col p-2 rounded-lg bg-[#0c1c2e] border border-slate-700/80">
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Active Sheet
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-sm font-bold text-emerald-300 truncate font-mono">
                {activeTabConfig.shortLabel}
              </span>
              <span className="text-[10px] text-slate-400">({activePeriod})</span>
            </div>
            <span className="text-[10px] text-emerald-400/90 font-medium">
              100% Reconciled Prime
            </span>
          </div>

          {/* Total Facturado (Gross Billed) */}
          <div className="flex flex-col p-2 rounded-lg bg-[#0c1c2e] border border-emerald-500/40 shadow-inner">
            <span className="text-[10px] uppercase font-semibold text-emerald-400 tracking-wider">
              Gross Billed Total
            </span>
            <div className="text-sm sm:text-base font-extrabold text-white mt-0.5 font-mono">
              {formatUsd(totalGross)}
            </div>
            <span className="text-[10px] text-slate-400">
              Target: {formatUsd(activeTabConfig.targetBilled)}
            </span>
          </div>

          {/* Total Materials */}
          <div className="flex flex-col p-2 rounded-lg bg-[#0c1c2e] border border-slate-700/80">
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Materials Direct
            </span>
            <div className="text-sm font-bold text-amber-200 mt-0.5 font-mono">
              {formatUsd(totalMaterials)}
            </div>
            <span className="text-[10px] text-slate-400">
              {totalGross > 0 ? Math.round((totalMaterials / totalGross) * 100) : 0}% of Billed
            </span>
          </div>

          {/* Total Labor */}
          <div className="flex flex-col p-2 rounded-lg bg-[#0c1c2e] border border-slate-700/80">
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Labor Certified
            </span>
            <div className="text-sm font-bold text-sky-200 mt-0.5 font-mono">
              {formatUsd(totalLabor)}
            </div>
            <span className="text-[10px] text-slate-400">
              {totalGross > 0 ? Math.round((totalLabor / totalGross) * 100) : 0}% of Billed
            </span>
          </div>

          {/* Total Labor Hours */}
          <div className="flex flex-col p-2 rounded-lg bg-[#0c1c2e] border border-slate-700/80">
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Labor Hours Logged
            </span>
            <div className="text-sm font-bold text-indigo-200 mt-0.5 font-mono">
              {formatHours(totalHours)}
            </div>
            <span className="text-[10px] text-slate-400">
              {filteredProjects.length > 0
                ? Math.round(totalHours / filteredProjects.length)
                : 0}{" "}
              hrs / proj avg
            </span>
          </div>

          {/* Projects Count */}
          <div className="flex flex-col p-2 rounded-lg bg-[#0c1c2e] border border-slate-700/80">
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Work Packages
            </span>
            <div className="text-sm font-bold text-slate-100 mt-0.5 font-mono">
              {filteredProjects.length} Projects
            </div>
            <span className="text-[10px] text-emerald-400">
              All Reconciled · Closeout Done
            </span>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 4. SPREADSHEET GRID (COLUMNS A-M + ROW NUMBERS 1..N)       */}
        {/* ========================================================= */}
        <div className="flex-1 overflow-auto bg-[#07111c] text-xs">
          <table className="w-full border-collapse text-left select-text">
            {/* Column Letter Coordinate Row */}
            <thead className="sticky top-0 z-20 bg-[#0d1e30] border-b border-slate-700 text-slate-400 font-mono text-[11px] shadow-sm">
              <tr>
                {/* Row Number header corner */}
                <th className="w-12 px-2 py-1.5 text-center bg-[#091522] border-r border-slate-700/80 text-slate-500 font-bold sticky left-0 z-30">
                  #
                </th>
                <th className="min-w-[130px] px-3 py-1.5 border-r border-slate-700/80 font-semibold text-slate-300">
                  <span className="text-emerald-400 font-bold mr-1">A</span> Row / Project ID
                </th>
                <th className="min-w-[110px] px-3 py-1.5 border-r border-slate-700/80 font-semibold text-slate-300">
                  <span className="text-emerald-400 font-bold mr-1">B</span> Invoice Ref
                </th>
                <th className="min-w-[100px] px-3 py-1.5 border-r border-slate-700/80 font-semibold text-slate-300">
                  <span className="text-emerald-400 font-bold mr-1">C</span> Start Date
                </th>
                <th className="min-w-[110px] px-3 py-1.5 border-r border-slate-700/80 font-semibold text-slate-300">
                  <span className="text-emerald-400 font-bold mr-1">D</span> Completion Date
                </th>
                <th className="min-w-[70px] px-2 py-1.5 text-center border-r border-slate-700/80 font-semibold text-slate-300">
                  <span className="text-emerald-400 font-bold mr-1">E</span> State
                </th>
                <th className="min-w-[220px] px-3 py-1.5 border-r border-slate-700/80 font-semibold text-slate-300">
                  <span className="text-emerald-400 font-bold mr-1">F</span> Trade Category
                </th>
                <th className="min-w-[200px] px-3 py-1.5 border-r border-slate-700/80 font-semibold text-slate-300">
                  <span className="text-emerald-400 font-bold mr-1">G</span> CSI Division
                </th>
                <th className="min-w-[170px] px-3 py-1.5 border-r border-slate-700/80 font-semibold text-slate-300">
                  <span className="text-emerald-400 font-bold mr-1">H</span> Field Superintendent
                </th>
                <th className="min-w-[95px] px-3 py-1.5 text-right border-r border-slate-700/80 font-semibold text-slate-300">
                  <span className="text-emerald-400 font-bold mr-1">I</span> Labor Hrs
                </th>
                <th className="min-w-[110px] px-3 py-1.5 text-right border-r border-slate-700/80 font-semibold text-slate-300">
                  <span className="text-emerald-400 font-bold mr-1">J</span> Materials USD
                </th>
                <th className="min-w-[110px] px-3 py-1.5 text-right border-r border-slate-700/80 font-semibold text-slate-300">
                  <span className="text-emerald-400 font-bold mr-1">K</span> Labor USD
                </th>
                <th className="min-w-[125px] px-3 py-1.5 text-right border-r border-slate-700/80 font-semibold text-emerald-300 bg-[#09221b]/40">
                  <span className="text-emerald-400 font-bold mr-1">L</span> Gross Billed USD
                </th>
                <th className="min-w-[100px] px-3 py-1.5 text-center font-semibold text-slate-300">
                  <span className="text-emerald-400 font-bold mr-1">M</span> Status
                </th>
              </tr>
            </thead>

            {/* Grid Rows */}
            <tbody className="divide-y divide-slate-800/80 font-mono text-[12px]">
              {filteredProjects.map((p, idx) => {
                const rowNum = idx + 2; // Excel row numbering (row 1 is header)
                const isOdd = idx % 2 === 1;

                return (
                  <tr
                    key={p.id}
                    className={`transition-colors hover:bg-emerald-950/20 ${
                      isOdd ? "bg-[#081524]/60" : "bg-[#06101c]/40"
                    }`}
                  >
                    {/* Left Sticky Row Number */}
                    <td className="w-12 px-2 py-1.5 text-center bg-[#091522] border-r border-slate-800 text-slate-500 font-bold select-none sticky left-0 z-10">
                      {rowNum}
                    </td>

                    {/* Col A: Project ID */}
                    <td
                      onClick={() =>
                        setActiveCell({
                          cellCoord: `A${rowNum}`,
                          formula: `=A${rowNum}`,
                          valueDisplay: p.id,
                          label: "Project Identifier",
                        })
                      }
                      className="px-3 py-1.5 border-r border-slate-800/70 font-semibold text-emerald-300 cursor-pointer hover:bg-emerald-500/10 truncate"
                    >
                      {p.id}
                    </td>

                    {/* Col B: Invoice Ref */}
                    <td
                      onClick={() =>
                        setActiveCell({
                          cellCoord: `B${rowNum}`,
                          formula: `=B${rowNum}`,
                          valueDisplay: p.invoiceRef,
                          label: "Tax Reconciled Invoice",
                        })
                      }
                      className="px-3 py-1.5 border-r border-slate-800/70 text-slate-300 cursor-pointer hover:bg-emerald-500/10"
                    >
                      {p.invoiceRef}
                    </td>

                    {/* Col C: Start Date */}
                    <td
                      onClick={() =>
                        setActiveCell({
                          cellCoord: `C${rowNum}`,
                          formula: `=C${rowNum}`,
                          valueDisplay: p.startDate,
                          label: `Start: ${p.startDateLabel}`,
                        })
                      }
                      className="px-3 py-1.5 border-r border-slate-800/70 text-slate-300 cursor-pointer hover:bg-emerald-500/10 whitespace-nowrap"
                    >
                      {p.startDate}
                    </td>

                    {/* Col D: Completion Date */}
                    <td
                      onClick={() =>
                        setActiveCell({
                          cellCoord: `D${rowNum}`,
                          formula: `=D${rowNum}`,
                          valueDisplay: p.completedDate,
                          label: `Completed: ${p.dateLabel}`,
                        })
                      }
                      className="px-3 py-1.5 border-r border-slate-800/70 text-slate-200 cursor-pointer hover:bg-emerald-500/10 whitespace-nowrap"
                    >
                      {p.completedDate}
                    </td>

                    {/* Col E: State */}
                    <td
                      onClick={() =>
                        setActiveCell({
                          cellCoord: `E${rowNum}`,
                          formula: `=E${rowNum}`,
                          valueDisplay: p.state,
                          label: "US Midwest State Jurisdiction",
                        })
                      }
                      className="px-2 py-1.5 text-center border-r border-slate-800/70 cursor-pointer hover:bg-emerald-500/10"
                    >
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-emerald-300 border border-slate-700">
                        {p.state}
                      </span>
                    </td>

                    {/* Col F: Trade Category */}
                    <td
                      onClick={() =>
                        setActiveCell({
                          cellCoord: `F${rowNum}`,
                          formula: `=F${rowNum}`,
                          valueDisplay: p.category,
                          label: "Corporate Trade Category",
                        })
                      }
                      className="px-3 py-1.5 border-r border-slate-800/70 text-slate-200 font-sans cursor-pointer hover:bg-emerald-500/10 truncate max-w-xs"
                      title={p.category}
                    >
                      {p.category}
                    </td>

                    {/* Col G: CSI Division */}
                    <td
                      onClick={() =>
                        setActiveCell({
                          cellCoord: `G${rowNum}`,
                          formula: `=G${rowNum}`,
                          valueDisplay: p.csiDivision,
                          label: "MasterFormat CSI Classification",
                        })
                      }
                      className="px-3 py-1.5 border-r border-slate-800/70 text-slate-400 font-sans cursor-pointer hover:bg-emerald-500/10 truncate max-w-xs"
                      title={p.csiDivision}
                    >
                      {p.csiDivision}
                    </td>

                    {/* Col H: Field Superintendent */}
                    <td
                      onClick={() =>
                        setActiveCell({
                          cellCoord: `H${rowNum}`,
                          formula: `=H${rowNum}`,
                          valueDisplay: p.fieldLead,
                          label: "Site Operations Superintendent",
                        })
                      }
                      className="px-3 py-1.5 border-r border-slate-800/70 text-slate-300 font-sans cursor-pointer hover:bg-emerald-500/10 truncate"
                    >
                      {p.fieldLead}
                    </td>

                    {/* Col I: Labor Hrs */}
                    <td
                      onClick={() =>
                        setActiveCell({
                          cellCoord: `I${rowNum}`,
                          formula: `=I${rowNum}`,
                          valueDisplay: `${p.laborHours} hrs`,
                          label: "Certified On-Site Trade Labor Hours",
                        })
                      }
                      className="px-3 py-1.5 text-right border-r border-slate-800/70 text-indigo-300 cursor-pointer hover:bg-emerald-500/10"
                    >
                      {p.laborHours.toLocaleString()}
                    </td>

                    {/* Col J: Materials USD */}
                    <td
                      onClick={() =>
                        setActiveCell({
                          cellCoord: `J${rowNum}`,
                          formula: `=J${rowNum}`,
                          valueDisplay: formatUsd(p.materialUsd),
                          label: "Direct Procurement & Materials Cost",
                        })
                      }
                      className="px-3 py-1.5 text-right border-r border-slate-800/70 text-amber-200 cursor-pointer hover:bg-emerald-500/10"
                    >
                      {formatUsd(p.materialUsd)}
                    </td>

                    {/* Col K: Labor USD */}
                    <td
                      onClick={() =>
                        setActiveCell({
                          cellCoord: `K${rowNum}`,
                          formula: `=K${rowNum}`,
                          valueDisplay: formatUsd(p.laborUsd),
                          label: "Fully Burdened Field Labor",
                        })
                      }
                      className="px-3 py-1.5 text-right border-r border-slate-800/70 text-sky-200 cursor-pointer hover:bg-emerald-500/10"
                    >
                      {formatUsd(p.laborUsd)}
                    </td>

                    {/* Col L: Gross Billed USD */}
                    <td
                      onClick={() =>
                        setActiveCell({
                          cellCoord: `L${rowNum}`,
                          formula: `=J${rowNum}+K${rowNum}`,
                          valueDisplay: formatUsd(p.incomeUsd),
                          label: `Materials (${formatUsd(p.materialUsd)}) + Labor (${formatUsd(p.laborUsd)})`,
                        })
                      }
                      className="px-3 py-1.5 text-right border-r border-slate-800/70 font-bold text-emerald-300 bg-emerald-950/20 cursor-pointer hover:bg-emerald-500/20"
                    >
                      {formatUsd(p.incomeUsd)}
                    </td>

                    {/* Col M: Status */}
                    <td
                      onClick={() =>
                        setActiveCell({
                          cellCoord: `M${rowNum}`,
                          formula: `="${p.status}"`,
                          valueDisplay: p.status,
                          label: "100% Retainage Released & Reconciled",
                        })
                      }
                      className="px-3 py-1.5 text-center cursor-pointer hover:bg-emerald-500/10"
                    >
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        {p.status}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {/* ======================================================= */}
              {/* FINAL ROW: EXCEL SUMMARY TOTAL ROW (Row N+1)           */}
              {/* ======================================================= */}
              <tr
                onClick={() => setActiveCell(null)}
                className="bg-[#0b241c] text-white font-mono font-bold border-t-2 border-emerald-500 sticky bottom-0 z-20 shadow-[0_-4px_12px_rgba(0,0,0,0.5)] cursor-pointer hover:bg-[#0e2c22] transition"
              >
                {/* Total Row Left Header */}
                <td className="w-12 px-2 py-2 text-center bg-[#071d15] border-r border-emerald-700/60 text-emerald-400 font-extrabold sticky left-0 z-30">
                  Σ
                </td>
                <td
                  colSpan={8}
                  className="px-3 py-2 border-r border-emerald-700/60 text-emerald-100 tracking-wider uppercase text-xs"
                >
                  TOTAL RECONCILED WORKBOOK · {activeTabConfig.monthName.toUpperCase()} ({filteredProjects.length} PROJECTS)
                </td>

                {/* Col I: Total Hours */}
                <td className="px-3 py-2 text-right border-r border-emerald-700/60 text-indigo-200">
                  {totalHours.toLocaleString()} hrs
                </td>

                {/* Col J: Total Materials */}
                <td className="px-3 py-2 text-right border-r border-emerald-700/60 text-amber-200">
                  {formatUsd(totalMaterials)}
                </td>

                {/* Col K: Total Labor */}
                <td className="px-3 py-2 text-right border-r border-emerald-700/60 text-sky-200">
                  {formatUsd(totalLabor)}
                </td>

                {/* Col L: Total Gross Billed */}
                <td className="px-3 py-2 text-right border-r border-emerald-700/60 text-base font-extrabold text-emerald-300 underline decoration-double decoration-emerald-400">
                  {formatUsd(totalGross)}
                </td>

                {/* Col M: Final Status */}
                <td className="px-3 py-2 text-center text-emerald-300 text-[11px] uppercase tracking-wider">
                  ✓ Reconciled
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ========================================================= */}
        {/* 5. EXCEL SHEET TABS STRIP (BOTTOM NAVIGATOR)              */}
        {/* ========================================================= */}
        <footer className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-[#081523] border-t border-slate-700/80 text-xs select-none">
          {/* Sheet Navigation Controls & Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-full">
            {/* Sheet Arrow Buttons */}
            <div className="flex items-center gap-0.5 pr-1.5 text-slate-400 border-r border-slate-700">
              <button
                onClick={() => {
                  const currentIdx = ALL_MONTH_TABS.findIndex((t) => t.key === activePeriod);
                  if (currentIdx > 0) {
                    onSelectMonth(ALL_MONTH_TABS[currentIdx - 1].key);
                    setActiveCell(null);
                  }
                }}
                className="h-6 w-6 flex items-center justify-center rounded hover:bg-slate-800 hover:text-white transition"
                title="Previous Sheet"
              >
                ◀
              </button>
              <button
                onClick={() => {
                  const currentIdx = ALL_MONTH_TABS.findIndex((t) => t.key === activePeriod);
                  if (currentIdx < ALL_MONTH_TABS.length - 1) {
                    onSelectMonth(ALL_MONTH_TABS[currentIdx + 1].key);
                    setActiveCell(null);
                  }
                }}
                className="h-6 w-6 flex items-center justify-center rounded hover:bg-slate-800 hover:text-white transition"
                title="Next Sheet"
              >
                ▶
              </button>
            </div>

            {/* Sheet Tabs */}
            {ALL_MONTH_TABS.map((tab) => {
              const isActive = tab.key === activePeriod;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    onSelectMonth(tab.key);
                    setActiveCell(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-t-md text-xs font-medium transition-all ${
                    isActive
                      ? "bg-[#0f3d2e] text-white border-t-2 border-emerald-400 shadow font-semibold"
                      : "bg-[#0b1d30]/70 text-slate-400 hover:text-slate-200 hover:bg-[#0e253c] border-t-2 border-transparent"
                  }`}
                >
                  {/* Miniature Sheet Icon */}
                  <svg
                    className={`h-3 w-3 ${isActive ? "text-emerald-300" : "text-slate-500"}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span>{tab.shortLabel}</span>
                  {isActive && (
                    <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Excel Status Bar Info (Ready, Count, Sum, Average) */}
          <div className="hidden lg:flex items-center gap-4 text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              READY
            </span>
            <span>COUNT: {filteredProjects.length}</span>
            <span>SUM: {formatUsd(totalGross)}</span>
            <span>
              AVG:{" "}
              {filteredProjects.length > 0
                ? formatUsd(Math.round(totalGross / filteredProjects.length))
                : "$0"}
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300 font-sans">100% Zoom</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
