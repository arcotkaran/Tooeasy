import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";

const space = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Too Easy — car service pickup & return, Wentworthville",
  description:
    "We collect your car from your driveway, take it to a trusted local workshop, and bring it back when it's done. You never leave the house.",
  openGraph: {
    title: "Too Easy — car service without the trip",
    description:
      "Car pickup and return around Wentworthville. Insured, licence-checked drivers and a trusted local workshop.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#08090a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${space.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
