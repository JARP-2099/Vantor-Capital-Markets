import type { Metadata } from "next";
import { Instrument_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";

/**
 * Instrument Sans carries the whole product (UI + marketing); its latin set
 * includes tabular numerals, activated by the `tabular-nums` utility on data.
 * Instrument Serif exists ONLY for large marketing/editorial statements.
 */
const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "VANTOR — Private Capital Markets",
    template: "%s — VANTOR",
  },
  description:
    "Vantor brings private-company discovery, standardized startup intelligence, valuation, and verification into one platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${instrumentSans.variable} ${instrumentSerif.variable}`}>
      <body className="flex min-h-screen flex-col font-sans antialiased">{children}</body>
    </html>
  );
}
