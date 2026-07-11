import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://worthlane.app"),
  title: { default: "Worthlane — Build a money routine that moves you forward", template: "%s | Worthlane" },
  description: "Worthlane is a forthcoming iPhone personal-finance app for manual account tracking, budgets, goals, streaks, and clearer daily money decisions.",
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: "Worthlane", url: "/", title: "Worthlane — Build a money routine that moves you forward", description: "A forthcoming iPhone finance app for clearer budgets, goals, and daily money decisions.", images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Worthlane — build a money routine that moves you forward" }] },
  twitter: { card: "summary_large_image", title: "Worthlane — Build a money routine that moves you forward", description: "A forthcoming iPhone finance app for clearer budgets, goals, and daily money decisions.", images: ["/opengraph-image"] },
  category: "finance",
};

const structuredData = { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Worthlane", applicationCategory: "FinanceApplication", operatingSystem: "iOS", description: "A forthcoming iPhone personal-finance app for manual account tracking, budgets, goals, streaks, and clearer daily money decisions.", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /><Analytics /><SpeedInsights /></body></html>;
}
