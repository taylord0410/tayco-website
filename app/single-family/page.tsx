import { DivisionPage, divisionMetadata } from "@/components/division/DivisionPage";

export const metadata = divisionMetadata("single-family");

export default function Page() {
  return <DivisionPage slug="single-family" />;
}
