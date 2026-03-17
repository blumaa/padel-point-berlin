import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SerwistProvider } from "./serwist-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const SITE_URL = "https://padel-point-berlin.vercel.app";
const SITE_TITLE = "PadelPoint Berlin – Find Open Padel Matches in Berlin";
const SITE_DESCRIPTION =
  "Discover open padel matches across 15+ Berlin courts. Browse games by venue, skill level, and time — updated every few hours from Playtomic. Join the Berlin padel community today.";

export const metadata: Metadata = {
  title: {
    default: SITE_TITLE,
    template: "%s | PadelPoint Berlin",
  },
  description: SITE_DESCRIPTION,
  manifest: "/manifest.json",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
  keywords: [
    "padel Berlin",
    "padel matches Berlin",
    "open padel games",
    "padel courts Berlin",
    "padel partners Berlin",
    "Playtomic Berlin",
    "padel tennis Berlin",
    "padel spielen Berlin",
    "padel community Berlin",
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PadelPoint",
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    type: "website",
    locale: "en_DE",
    url: SITE_URL,
    siteName: "PadelPoint Berlin",
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#111118",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{if(document.cookie.match(/(?:^|;)\\s*theme=light/))document.documentElement.className="light"}catch(e){}` }} />
        <link rel="dns-prefetch" href="https://zapgtydmlnohikbnkeii.supabase.co" />
        <link rel="preconnect" href="https://zapgtydmlnohikbnkeii.supabase.co" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebApplication",
                  name: "PadelPoint Berlin",
                  url: SITE_URL,
                  description: SITE_DESCRIPTION,
                  applicationCategory: "SportsApplication",
                  operatingSystem: "All",
                  browserRequirements: "Requires JavaScript",
                  offers: {
                    "@type": "Offer",
                    price: "0",
                    priceCurrency: "EUR",
                  },
                },
                {
                  "@type": "SportsActivityLocation",
                  name: "PadelPoint Berlin",
                  description:
                    "A community platform aggregating open padel matches across Berlin courts including Padelzone, Padel Berlin Lichtenberg, The Padellers, and more.",
                  url: SITE_URL,
                  sport: "Padel Tennis",
                  address: {
                    "@type": "PostalAddress",
                    addressLocality: "Berlin",
                    addressCountry: "DE",
                  },
                },
                {
                  "@type": "Organization",
                  name: "PadelPoint Berlin",
                  url: SITE_URL,
                  contactPoint: {
                    "@type": "ContactPoint",
                    email: "desmond.blume@gmail.com",
                    contactType: "customer service",
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body className={inter.variable}>
        <a href="#main-content" className="klimt-skip-link">
          Skip to main content
        </a>
        <SerwistProvider swUrl="/serwist/sw.js">
          {children}
        </SerwistProvider>
        <Analytics />
      </body>
    </html>
  );
}
