import type { SVGProps, ReactElement } from "react";

export type CorporateIconName =
  | "executive"
  | "summary"
  | "project"
  | "projects"
  | "invoice"
  | "billing"
  | "financial_dashboard"
  | "accounting"
  | "team"
  | "administration"
  | "lead"
  | "opportunities"
  | "hours"
  | "payroll"
  | "compliance"
  | "document"
  | "documents"
  | "plans"
  | "corporate_meetings"
  | "meetings"
  | "dossier"
  | "reports"
  | "lock"
  | "user"
  | "blueprint"
  | "calendar"
  | "notes"
  | "followup"
  | "dollar"
  | "cert"
  | "shield"
  | "external"
  | "check"
  | string;

export interface CorporateIconProps extends SVGProps<SVGSVGElement> {
  name: CorporateIconName;
  className?: string;
}

export function CorporateIcon({
  name,
  className,
  width = "16",
  height = "16",
  ...props
}: CorporateIconProps): ReactElement {
  const normalized = (name || "").toLowerCase().trim();

  const renderPath = () => {
    switch (normalized) {
      case "executive":
      case "summary":
        return (
          <>
            <rect x="3" y="3" width="7" height="9" rx="1" />
            <rect x="14" y="3" width="7" height="5" rx="1" />
            <rect x="14" y="12" width="7" height="9" rx="1" />
            <rect x="3" y="16" width="7" height="5" rx="1" />
          </>
        );
      case "project":
        return (
          <>
            <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
          </>
        );
      case "projects":
        return (
          <>
            <path d="M3 21h18M5 21V7l8-4v18M13 11h5v10M9 9h.01M9 13h.01M9 17h.01" />
          </>
        );
      case "invoice":
      case "billing":
        return (
          <>
            <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
            <path d="M8 7h8M8 11h8M8 15h5" />
          </>
        );
      case "financial_dashboard":
        return (
          <>
            <line x1="12" y1="20" x2="12" y2="10" />
            <line x1="18" y1="20" x2="18" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </>
        );
      case "accounting":
      case "finance":
        return (
          <>
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </>
        );
      case "team":
        return (
          <>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </>
        );
      case "administration":
        return (
          <>
            <polygon points="12 2 2 7 22 7 12 2" />
            <line x1="4" y1="22" x2="20" y2="22" />
            <line x1="6" y1="11" x2="6" y2="18" />
            <line x1="10" y1="11" x2="10" y2="18" />
            <line x1="14" y1="11" x2="14" y2="18" />
            <line x1="18" y1="11" x2="18" y2="18" />
          </>
        );
      case "lead":
      case "opportunities":
        return (
          <>
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </>
        );
      case "hours":
        return (
          <>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </>
        );
      case "payroll":
        return (
          <>
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </>
        );
      case "compliance":
      case "shield":
        return (
          <>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
          </>
        );
      case "document":
      case "documents":
        return (
          <>
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <line x1="10" y1="9" x2="8" y2="9" />
          </>
        );
      case "plans":
      case "blueprint":
        return (
          <>
            <polygon points="2 2 2 22 22 22 2 2" />
            <line x1="2" y1="7" x2="6" y2="7" />
            <line x1="2" y1="12" x2="8" y2="12" />
            <line x1="2" y1="17" x2="6" y2="17" />
            <line x1="7" y1="22" x2="7" y2="18" />
            <line x1="12" y1="22" x2="12" y2="16" />
            <line x1="17" y1="22" x2="17" y2="18" />
          </>
        );
      case "corporate_meetings":
      case "meetings":
      case "calendar":
        return (
          <>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </>
        );
      case "dossier":
      case "reports":
        return (
          <>
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
          </>
        );
      case "lock":
        return (
          <>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </>
        );
      case "user":
        return (
          <>
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </>
        );
      case "notes":
        return (
          <>
            <path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z" />
            <polyline points="15 3 21 9 21 21" />
            <line x1="9" y1="13" x2="15" y2="13" />
            <line x1="9" y1="17" x2="13" y2="17" />
          </>
        );
      case "followup":
      case "followups":
        return (
          <>
            <polyline points="9 11 12 14 22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </>
        );
      case "dollar":
        return (
          <>
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </>
        );
      case "cert":
        return (
          <>
            <circle cx="12" cy="8" r="6" />
            <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
          </>
        );
      case "external":
        return (
          <>
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </>
        );
      case "check":
        return (
          <>
            <polyline points="20 6 9 17 4 12" />
          </>
        );
      case "estimate":
      case "estimates":
        return (
          <>
            <circle cx="12" cy="12" r="10" />
            <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
            <line x1="12" y1="6" x2="12" y2="8" />
            <line x1="12" y1="16" x2="12" y2="18" />
          </>
        );
      case "takeoff":
        return (
          <>
            <polygon points="2 2 2 22 22 22 2 2" />
            <line x1="2" y1="7" x2="6" y2="7" />
            <line x1="2" y1="12" x2="8" y2="12" />
            <line x1="2" y1="17" x2="6" y2="17" />
          </>
        );
      default:
        return (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </>
        );
    }
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {renderPath()}
    </svg>
  );
}

export default CorporateIcon;
