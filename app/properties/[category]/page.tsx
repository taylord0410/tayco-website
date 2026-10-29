import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PropertyCategoryPageView } from "@/components/PropertyCategoryShowcase";
import {
  PROPERTY_CATEGORIES,
  getPropertyCategoryBySlug,
} from "@/lib/property-catalog";
import { COMPANY } from "@/lib/company";

export function generateStaticParams() {
  const baseSlugs = PROPERTY_CATEGORIES.map((cat) => ({
    category: cat.slug,
  }));
  return [
    ...baseSlugs,
    { category: "multifamily" },
    { category: "townhomes" },
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const meta = getPropertyCategoryBySlug(category);
  if (!meta) {
    return {
      title: `Markets & Services | ${COMPANY.name}`,
    };
  }
  return {
    title: `${meta.label} · Services by Specialty & Project Gallery | ${COMPANY.name}`,
    description: meta.description,
  };
}

export default async function PropertyCategoryDedicatedPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const meta = getPropertyCategoryBySlug(category);
  if (!meta) {
    notFound();
  }
  return <PropertyCategoryPageView activeCategory={meta} />;
}
