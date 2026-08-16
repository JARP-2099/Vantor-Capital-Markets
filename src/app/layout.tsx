import type { Metadata } from "next";
import { Familjen_Grotesk } from "next/font/google";
import "./globals.css";

const familjen = Familjen_Grotesk({
  subsets: ["latin"],
  variable: "--font-vantor",
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
    <html lang="en" className={familjen.variable}>
      <body className="flex min-h-screen flex-col font-sans antialiased">{children}</body>
    </html>
  );
}
