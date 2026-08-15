import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "VANTOR — Private Startup Marketplace",
    template: "%s — VANTOR",
  },
  description:
    "Vantor is a private startup marketplace where founders build standardized company profiles and investors discover private companies.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col antialiased">{children}</body>
    </html>
  );
}
