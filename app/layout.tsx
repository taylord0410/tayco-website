import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EditorialLivingEngine from "@/components/EditorialLivingEngine";
import SiteFrame from "@/components/SiteFrame";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TAYCO LLC | Full-Service Construction Company | Wisconsin & Illinois",
  description:
    "Full-service construction company in Wisconsin and Illinois. Residential & commercial general construction and remodeling, fire and water damage restoration. Licensed & insured.",
  keywords:
    "construction company Wisconsin, construction company Illinois, general contractor Wisconsin, general contractor Illinois, general construction and remodeling, fire and water damage restoration, water damage restoration Milwaukee, fire damage restoration, REO property contractor, property turnover contractor",
  icons: {
    icon: [
      { url: "/icon.png?v=tayco2026", type: "image/png", sizes: "256x256" },
      { url: "/favicon.ico?v=tayco2026", sizes: "any" },
    ],
    shortcut: "/favicon.ico?v=tayco2026",
    apple: [{ url: "/apple-icon.png?v=tayco2026", sizes: "180x180", type: "image/png" }],
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${cormorant.variable} ${jakarta.variable} ${jetbrains.variable}`}
    >
      <body>
        <EditorialLivingEngine />
        <SiteFrame publicHeader={<Navbar />} publicFooter={<Footer />}>{children}</SiteFrame>
      </body>
    </html>
  );
}
