import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import "./globals.css";

// Warm, slightly characterful serif for headlines — the main thing keeping
// this from reading as another black-and-neon delivery app.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Too Easy — car service pickup & return, Wentworthville",
  description:
    "We collect your car from home or the office, take it to a trusted local workshop, and have it back before the day is out.",
  openGraph: {
    title: "Too Easy — car service without the trip",
    description:
      "Car pickup and return around Wentworthville. Insured, licence-checked drivers and a trusted local workshop.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#fbf6ee",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
