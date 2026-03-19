"use client";

import { Suspense } from "react";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";

export default function AnalyticsPage() {
  return (
    <div className="klimt-bg">
      <div className="klimt-analytics">
        <h1 className="klimt-analytics-title">Analytics</h1>
        <Suspense fallback={<p className="klimt-privacy-text">Loading...</p>}>
          <AnalyticsDashboard />
        </Suspense>
      </div>
    </div>
  );
}
