import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";

/*
 * V3 typography (docs/VANTOR_UI_UX_DIRECTION_V3.md §3): Inter carries the
 * whole product — institutional, superb screen rendering, and true tabular
 * numerals in the served subset. IBM Plex Mono appears only in micro data
 * labels (uppercase 11px), never in body or headings.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
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
    <html lang="en" className={`${inter.variable} ${plexMono.variable}`}>
      <body className="flex min-h-screen flex-col font-sans antialiased">{children}</body>
    </html>
  );
}
