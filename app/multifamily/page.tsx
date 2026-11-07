import { DivisionPage, divisionMetadata } from "@/components/division/DivisionPage";

export const metadata = divisionMetadata("multifamily");

export default function Page() {
  return <DivisionPage slug="multifamily" />;
}
