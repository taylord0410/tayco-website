import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "TAYCO LLC | Full-Service Construction Company | Wisconsin & Illinois",
  description:
    "Full-service construction company in Wisconsin and Illinois. Residential & commercial general construction and remodeling, fire and water damage restoration. Licensed & insured.",
  keywords:
    "construction company Wisconsin, construction company Illinois, general contractor Wisconsin, general contractor Illinois, general construction and remodeling, fire and water damage restoration, water damage restoration Milwaukee, fire damage restoration, REO property contractor, property turnover contractor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
