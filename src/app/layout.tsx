import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SerwistProvider } from "./serwist-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PadelPoint Berlin",
  description: "Find open padel matches in Berlin",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PadelPoint",
  },
  openGraph: {
    title: "PadelPoint Berlin",
    description: "Find open padel matches in Berlin",
    type: "website",
    locale: "en_DE",
    siteName: "PadelPoint Berlin",
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
