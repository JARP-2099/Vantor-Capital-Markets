import type { Metadata } from "next";
import { Familjen_Grotesk } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const familjen = Familjen_Grotesk({
  subsets: ["latin"],
  variable: "--font-vantor",
});

/*
 * Brand serif for the VANTOR wordmark only — matched to the supplied logo.
 * Self-hosted (latin subset, variable 500-600): next/font/google's bundled
 * URL data for Playfair Display 404s at build time on this Next version.
 */
const playfair = localFont({
  src: "../fonts/playfair-display-latin-wght.woff2",
  weight: "500 600",
  variable: "--font-vantor-serif",
});

export const metadata: Metadata = {
  title: {
    default: "Vantor Capital Markets",
    template: "%s · VANTOR",
  },
  description:
    "Vantor is a private startup marketplace where founders build standardized company profiles and investors discover private companies.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${familjen.variable} ${playfair.variable}`}>
      <body className="flex min-h-screen flex-col font-sans antialiased">{children}</body>
    </html>
  );
}
