import { DivisionPage, divisionMetadata } from "@/components/division/DivisionPage";

export const metadata = divisionMetadata("townhomes");

export default function Page() {
  return <DivisionPage slug="townhomes" />;
}
