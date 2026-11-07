import type { Metadata } from "next";
import type { ReactNode } from "react";
import { COMPANY } from "@/lib/company";

// The page is a client component, so its title and description live here.
export const metadata: Metadata = {
  title: `Request a Free Estimate | ${COMPANY.name}`,
  description:
    "Tell us about your project and request a free estimate from TAYCO LLC for residential, multifamily, townhome or commercial work.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
