import type { Metadata } from "next";
import { PropertyCategoryPageView } from "@/components/PropertyCategoryShowcase";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: `Property Categories · Single-Family Homes, Duplexes, Townhouses & Commercial | ${COMPANY.name}`,
  description:
    "Browse TAYCO LLC properties by category: Single-Family Homes, Duplexes, Townhouses, and Commercial Properties across WI, IL, IA, IN, MN, MI, MO, and TX.",
};

export default function PropertiesIndexPage() {
  return <PropertyCategoryPageView />;
}
