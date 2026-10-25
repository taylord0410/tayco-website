"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  VERIFIED_OCTOBER_2026_OPPORTUNITIES,
  type VerifiedBiddingOpportunity,
} from "@/lib/verified-bidding-opportunities";
import TakeoffProjectReader from "./TakeoffProjectReader";

export function VerifiedOpportunitiesTable({
  defaultLimit = 12,
  isGuest = false,
}: {
  defaultLimit?: number;
  isGuest?: boolean;
}) {
  const [statusFilter, setStatusFilter] = useState<
    "all" | "Overdue" | "Pending company information"
  >("all");
  const [infraFilter, setInfraFilter] = useState<"all" | "Public" | "Private">(
    "all"
  );
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(defaultLimit >= 48);
  const [activeViewerId, setActiveViewerId] = useState<string | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeViewerId && drawerRef.current) {
      drawerRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeViewerId]);

  const counts = useMemo(() => {
    const overdue = VERIFIED_OCTOBER_2026_OPPORTUNITIES.filter(
      (item) => item.status === "Overdue"
    ).length;
    const pending = VERIFIED_OCTOBER_2026_OPPORTUNITIES.filter(
      (item) => item.status === "Pending company information"
    ).length;
    const withDrawings = VERIFIED_OCTOBER_2026_OPPORTUNITIES.filter((item) =>
      Boolean(item.viewerHref)
    ).length;
    const publicCount = VERIFIED_OCTOBER_2026_OPPORTUNITIES.filter(
      (item) => item.infrastructureType === "Public"
    ).length;
    const privateCount = VERIFIED_OCTOBER_2026_OPPORTUNITIES.filter(
      (item) => item.infrastructureType === "Private"
    ).length;
    return {
      total: VERIFIED_OCTOBER_2026_OPPORTUNITIES.length,
      overdue,
      pending,
      withDrawings,
      publicCount,
      privateCount,
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return VERIFIED_OCTOBER_2026_OPPORTUNITIES.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }
      if (infraFilter !== "all" && item.infrastructureType !== infraFilter) {
        return false;
      }
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.contractor.toLowerCase().includes(q) ||
        item.infrastructureType.toLowerCase().includes(q) ||
        item.estimatedPrice.toLowerCase().includes(q) ||
        (item.reportedDeadline ?? "").toLowerCase().includes(q) ||
        String(item.number).includes(q)
      );
    });
  }, [statusFilter, infraFilter, search]);

  const displayed = useMemo(() => {
    if (
      showAll ||
      search.trim().length > 0 ||
      statusFilter !== "all" ||
      infraFilter !== "all"
    ) {
      return filtered;
    }
    return filtered.slice(0, defaultLimit);
  }, [filtered, showAll, search, statusFilter, infraFilter, defaultLimit]);

  const activeItem: VerifiedBiddingOpportunity | null = useMemo(() => {
    if (activeViewerId === null) return null;
    return (
      VERIFIED_OCTOBER_2026_OPPORTUNITIES.find(
        (item) => item.id === activeViewerId
      ) ?? null
    );
  }, [activeViewerId]);

  return (
    <section
      className="dcc-card dcc-opportunities-card"
      data-testid="verified-opportunities-panel"
    >
      <div className="dcc-card-head dcc-opportunities-head">
        <div>
          <p className="dcc-kicker dcc-eyebrow">
            {isGuest
              ? "OCTOBER 2026 CORPORATE INTAKE · PENDING & CANCELLED OPPORTUNITIES"
              : "NEW OPPORTUNITIES · OCTOBER 2026 CORPORATE INTAKE"}
          </p>
          <h3 className="dcc-section-title">
            New Opportunities — October 2026 ({counts.total} Verified Bidding
            Opportunities)
          </h3>
          <p className="dcc-row-meta">
            All {counts.total} verified commercial, public and private
            infrastructure bidding packages (#2–#19, #21–#49 ·{" "}
            {counts.publicCount} Public · {counts.privateCount} Private).{" "}
            {counts.withDrawings} packages include protected PDF drawing sheets
            ready for high-speed in-place CAD inspection; zero invented or
            sample pricing is displayed prior to quote completion.
          </p>
        </div>

        <div className="dcc-opportunities-controls">
          <div
            className="dcc-opportunities-pills"
            role="group"
            aria-label="Filter bidding opportunities"
          >
            <button
              type="button"
              onClick={() => {
                setStatusFilter("all");
                setInfraFilter("all");
              }}
              className={`dcc-filter-pill ${
                statusFilter === "all" && infraFilter === "all"
                  ? "is-active"
                  : ""
              }`}
            >
              All ({counts.total})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("Pending company information")}
              className={`dcc-filter-pill ${
                statusFilter === "Pending company information"
                  ? "is-active"
                  : ""
              }`}
            >
              {isGuest
                ? `Pending (${counts.pending})`
                : `Pending Info (${counts.pending})`}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("Overdue")}
              className={`dcc-filter-pill ${
                statusFilter === "Overdue" ? "is-active" : ""
              }`}
            >
              {isGuest
                ? `Cancelled (${counts.overdue})`
                : `Overdue (${counts.overdue})`}
            </button>
            <button
              type="button"
              onClick={() =>
                setInfraFilter((prev) =>
                  prev === "Public" ? "all" : "Public"
                )
              }
              className={`dcc-filter-pill ${
                infraFilter === "Public" ? "is-active" : ""
              }`}
            >
              Public ({counts.publicCount})
            </button>
            <button
              type="button"
              onClick={() =>
                setInfraFilter((prev) =>
                  prev === "Private" ? "all" : "Private"
                )
              }
              className={`dcc-filter-pill ${
                infraFilter === "Private" ? "is-active" : ""
              }`}
            >
              Private ({counts.privateCount})
            </button>
          </div>

          <div className="dcc-opportunities-search-row">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search general contractor, project, public/private, deadline or #ID..."
              aria-label="Search verified bidding opportunities"
              className="dcc-opportunities-search"
            />
            {statusFilter === "all" &&
              infraFilter === "all" &&
              !search.trim() && (
                <button
                  type="button"
                  onClick={() => setShowAll((prev) => !prev)}
                  className="dcc-action-btn"
                >
                  {showAll
                    ? `Show top ${defaultLimit}`
                    : `Show all ${counts.total} opportunities`}
                </button>
              )}
          </div>
        </div>
      </div>

      {activeItem && activeItem.viewerHref && (
        <div
          ref={drawerRef}
          className="dcc-opportunities-viewer-drawer"
          data-testid="verified-opportunity-viewer-drawer"
        >
          <TakeoffProjectReader
            source={activeItem.viewerHref}
            projectName={activeItem.name}
            privacyNotice={false}
            badgeText={`Opportunity #${activeItem.number} · ${activeItem.infrastructureType} Infrastructure · Protected Drawing Sheet`}
            subtitle={`General Contractor: ${activeItem.contractor} · Price: ${activeItem.estimatedPrice} · (${activeItem.planFilesCount ?? 1} plan files)`}
            onClose={() => setActiveViewerId(null)}
            onPrevProject={() => {
              const drawable = VERIFIED_OCTOBER_2026_OPPORTUNITIES.filter((o) => Boolean(o.viewerHref));
              const idx = drawable.findIndex((o) => o.id === activeItem.id);
              if (idx > 0) setActiveViewerId(drawable[idx - 1].id);
            }}
            onNextProject={() => {
              const drawable = VERIFIED_OCTOBER_2026_OPPORTUNITIES.filter((o) => Boolean(o.viewerHref));
              const idx = drawable.findIndex((o) => o.id === activeItem.id);
              if (idx >= 0 && idx < drawable.length - 1) setActiveViewerId(drawable[idx + 1].id);
            }}
          />
        </div>
      )}

      <div className="dcc-opportunities-table-wrap">
        <table className="dcc-opportunities-table">
          <thead>
            <tr>
              <th>General Contractor</th>
              <th>Project</th>
              <th>Infrastructure</th>
              <th>Price</th>
              <th>Deadline</th>
              <th>Plans / Drawings</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((row) => {
              const isViewerOpen = activeViewerId === row.id;
              const isOverdue = row.status === "Overdue";
              const isPublic = row.infrastructureType === "Public";
              return (
                <tr key={row.id} data-opportunity-id={row.number}>
                  <td>
                    <div className="dcc-opp-project-cell">
                      <span className="dcc-opp-id">#{row.number}</span>
                      <div>
                        <p className="dcc-row-title">{row.contractor}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <p className="dcc-row-title">{row.name}</p>
                    </div>
                  </td>
                  <td>
                    <span
                      className="dcc-badge"
                      data-tone={isPublic ? "sky" : "indigo"}
                    >
                      {isPublic ? "Public" : "Private"}
                    </span>
                  </td>
                  <td>
                    <span className="dcc-opp-price">{row.estimatedPrice}</span>
                  </td>
                  <td>
                    <span className="dcc-opp-deadline">
                      {row.reportedDeadline || "Pending date"}
                    </span>
                  </td>
                  <td>
                    {row.viewerHref ? (
                      <button
                        type="button"
                        data-testid={`open-drawing-${row.number}`}
                        onClick={() =>
                          setActiveViewerId(isViewerOpen ? null : row.id)
                        }
                        className={`dcc-opp-drawing-btn ${
                          isViewerOpen ? "is-open" : ""
                        }`}
                      >
                        {isViewerOpen ? "Hide plans" : "View plans"}
                      </button>
                    ) : (
                      <span className="dcc-badge" data-tone="slate">
                        Drawings pending
                      </span>
                    )}
                  </td>
                  <td>
                    <span
                      className="dcc-badge"
                      data-tone={isOverdue ? "rose" : "amber"}
                    >
                      {row.status === "Pending company information"
                        ? isGuest
                          ? "Pending"
                          : "Pending Info"
                        : isGuest
                        ? "Cancelled"
                        : "Overdue"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
