import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
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
    <html lang="en">
      {/* Runs synchronously before paint to avoid flash-of-wrong-theme */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='light'){document.documentElement.classList.add('light');}else if(!t&&window.matchMedia('(prefers-color-scheme: light)').matches){document.documentElement.classList.add('light');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className={inter.variable}>
        <a href="#main-content" className="klimt-skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
