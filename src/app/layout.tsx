import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
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
  title: "Too Easy — car service pickup & return, free",
  description:
    "We pick your car up from your driveway, take it to a trusted local shop, and bring it back. Free pickup and return. You never leave the house.",
  openGraph: {
    title: "Too Easy — car service without the trip",
    description:
      "Free pickup and return from your home or office. Vetted drivers, trusted local shops, and you approve every dollar before work starts.",
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
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
