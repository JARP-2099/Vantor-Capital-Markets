import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

/**
 * One family carries the whole product: Plus Jakarta Sans (V2 decisions —
 * modern B2B-finance grotesk, true 700/800 weights for display type,
 * tabular numerals activated by the `tabular-nums` utility on data).
 */
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
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
    <html lang="en" className={jakarta.variable}>
      <body className="flex min-h-screen flex-col font-sans antialiased">{children}</body>
    </html>
  );
}
