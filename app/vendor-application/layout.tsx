import type { Metadata } from "next";
import type { ReactNode } from "react";
import { COMPANY } from "@/lib/company";

// The page is a client component, so its title and description live here.
export const metadata: Metadata = {
  title: `Trade Partner & Subcontractor Application | ${COMPANY.name}`,
  description:
    "Apply to work with TAYCO LLC as a trade partner or subcontractor: framing, roofing, concrete, drywall, finishes, MEP and more.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
