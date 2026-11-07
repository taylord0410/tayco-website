import type { Metadata } from "next";
import type { ReactNode } from "react";
import { COMPANY } from "@/lib/company";

// The page is a client component, so its title and description live here.
export const metadata: Metadata = {
  title: `Property Owners, Investors & Property Managers | ${COMPANY.name}`,
  description:
    "Renovation and turnover programs for property owners, investors and property managers: scoped work per property, coordinated trades and clear handover.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
