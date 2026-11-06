import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PropertyCategoryPageView } from "@/components/PropertyCategoryShowcase";
import ResidentialDivisionContent from "@/components/division/ResidentialDivisionContent";
import CommercialDivisionContent from "@/components/division/CommercialDivisionContent";
import { getPropertyCategoryBySlug, type PropertyCategorySlug } from "@/lib/property-catalog";
import { COMPANY } from "@/lib/company";

/**
 * The site is split into four divisions, each at its own URL: /single-family, /multifamily,
 * /townhomes and /commercial. A division page is its market view (hero, specialties, projects)
 * followed by the division content that used to live on /residential or /commercial.
 */
export function divisionMetadata(slug: PropertyCategorySlug): Metadata {
  const meta = getPropertyCategoryBySlug(slug);
  if (!meta) return { title: `Markets & Services | ${COMPANY.name}` };
  return {
    title: `${meta.label} · Services by Specialty & Project Gallery | ${COMPANY.name}`,
    description: meta.description,
    alternates: { canonical: `/${slug}` },
  };
}

export function DivisionPage({ slug }: { slug: PropertyCategorySlug }) {
  const meta = getPropertyCategoryBySlug(slug);
  if (!meta) notFound();
  return (
    <PropertyCategoryPageView activeCategory={meta}>
      {slug === "commercial" ? <CommercialDivisionContent /> : <ResidentialDivisionContent />}
    </PropertyCategoryPageView>
  );
}
