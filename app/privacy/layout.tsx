import type { Metadata } from "next";
import type { ReactNode } from "react";
import { COMPANY } from "@/lib/company";

// The page is a client component, so its title and description live here.
export const metadata: Metadata = {
  title: `Privacy Policy & Client Confidentiality | ${COMPANY.name}`,
  description:
    "How TAYCO LLC protects client data, cookies, form submissions and project photography.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
