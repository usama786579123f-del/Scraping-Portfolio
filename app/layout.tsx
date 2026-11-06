import type { Metadata } from "next";
import "./globals.css";
import { site } from "@/site.config";

export const metadata: Metadata = {
  title: `${site.name} | ${site.role}`,
  description:
    "Scalable, compliant web scraping and AI-powered data extraction. Public data only, delivered as clean CSV, API or Google Sheets.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
