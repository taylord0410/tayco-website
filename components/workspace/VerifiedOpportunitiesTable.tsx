"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  VERIFIED_OCTOBER_2026_OPPORTUNITIES,
  type VerifiedBiddingOpportunity,
} from "@/lib/verified-bidding-opportunities";
import TakeoffProjectReader from "./TakeoffProjectReader";

const sanitizeGuestText = (text: string): string =>
  text
    .replace(/\bIllinois Dept\. of Transportation \(IDOT\)/gi, "Department of Transportation (DOT)")
    .replace(/\bIndianapolis Airport Authority \(IAA\)/gi, "Regional Airport Authority")
    .replace(/\bLifeway Mobility Chicago\b/gi, "Lifeway Mobility")
    .replace(/\bVillage of Shorewood\b/gi, "Municipal Public Works")
    .replace(/\bCity of Venice Development\b/gi, "Municipal Development Board")
    .replace(/\bCity of Lake Mills\b/gi, "Municipal Library Board")
    .replace(/\bKenosha County\b/gi, "County")
    .replace(/\(IL0403\)/g, "(#0403)")
    .replace(/\b(Wisconsin|Illinois|Indiana|Iowa|Missouri|Ohio|Minnesota)\b/gi, "Regional");

export function VerifiedOpportunitiesTable({
  defaultLimit = 24,
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
          <h3 className="dcc-section-title">
            New Opportunities Since October 2026: Federal, State &amp; Local
            Government, Public Works, Private Investment &amp;{" "}
            <span className="dcc-union-title-highlight">
              Union Construction Projects
            </span>
          </h3>
        </div>

        <div className="dcc-opportunities-controls">
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
            projectName={isGuest ? sanitizeGuestText(activeItem.name) : activeItem.name}
            privacyNotice={false}
            badgeText={`Opportunity #${activeItem.number} · ${activeItem.infrastructureType} Infrastructure · Protected Drawing Sheet`}
            subtitle={`General Contractor: ${isGuest ? sanitizeGuestText(activeItem.contractor) : activeItem.contractor}${!isGuest && activeItem.location ? ` · Location: ${activeItem.location}` : ""} · Price: ${activeItem.estimatedPrice} · (${activeItem.planFilesCount ?? 1} plan files)`}
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
              const isUnionOrAssoc =
                /\b(union|associat|unified|prevailing|district|board|council|club|authority|department|municipal|village|city of|state of)\b/i.test(
                  `${row.contractor} ${row.name}`
                );
              return (
                <tr
                  key={row.id}
                  data-opportunity-id={row.number}
                  className={isUnionOrAssoc ? "is-union-assoc-row" : undefined}
                >
                  <td>
                    <div className="dcc-opp-project-cell">
                      <span
                        className={`dcc-opp-id ${
                          isUnionOrAssoc ? "is-union-assoc" : ""
                        }`}
                      >
                        #{row.number}
                      </span>
                      <div>
                        <p
                          className={`dcc-row-title ${
                            isUnionOrAssoc ? "dcc-union-contractor-title" : ""
                          }`}
                        >
                          {isGuest ? sanitizeGuestText(row.contractor) : row.contractor}
                        </p>
                        {isUnionOrAssoc && (
                          <span className="dcc-union-row-tag">
                            {/\b(associat|club)\b/i.test(row.contractor)
                              ? "Association / Affiliated GC"
                              : "Union / Prevailing Wage Scope"}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <p className="dcc-row-title">
                        {isGuest ? sanitizeGuestText(row.name) : row.name}
                      </p>
                      {!isGuest && row.location && (
                        <small style={{ color: "#94a3b8", fontSize: "0.73rem", display: "block", marginTop: "0.18rem" }}>
                          {row.location}
                        </small>
                      )}
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
                    <span
                      className="dcc-opp-price"
                      style={
                        row.estimatedPrice.startsWith("$")
                          ? {
                              color: "#6ee7b7",
                              fontWeight: 800,
                              fontSize: "0.78rem",
                              padding: "0.18rem 0.5rem",
                              borderRadius: "6px",
                              background: "rgba(16, 185, 129, 0.14)",
                              border: "1px solid rgba(16, 185, 129, 0.38)",
                            }
                          : undefined
                      }
                    >
                      {row.estimatedPrice}
                    </span>
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
