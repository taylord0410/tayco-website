import { DivisionPage, divisionMetadata } from "@/components/division/DivisionPage";

export const metadata = divisionMetadata("commercial");

export default function Page() {
  return <DivisionPage slug="commercial" />;
}
