import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Padel Match Analytics Berlin",
  description:
    "Statistics and trends for padel matches across Berlin venues. See match volume, popular courts, skill levels, and category breakdowns.",
  alternates: {
    canonical: "/analidiots",
  },
};

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
