import { useState, useEffect, useRef } from "react";
import type { AnalyticsFilterState, TrendGranularity, VenueTrendRow } from "@/lib/analyticsTypes";

interface UseVenueTrendResult {
  data: VenueTrendRow[];
  isLoading: boolean;
}

function buildUrl(filters: AnalyticsFilterState, granularity: TrendGranularity): string {
  const params = new URLSearchParams();
  params.set("period", filters.period);
  params.set("granularity", granularity);
  if (filters.venues.length > 0) params.set("venues", filters.venues.join(","));
  if (filters.outcomes.length > 0) params.set("outcomes", filters.outcomes.join(","));
  if (filters.categories.length > 0) params.set("categories", filters.categories.join(","));
  return `/api/analytics/venue-trend?${params.toString()}`;
}

export function useVenueTrendData(
  filters: AnalyticsFilterState,
  granularity: TrendGranularity,
): UseVenueTrendResult {
  const [data, setData] = useState<VenueTrendRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);

      fetch(buildUrl(filters, granularity), { signal: controller.signal })
        .then((res) => (res.ok ? res.json() : []))
        .then((rows: VenueTrendRow[]) => {
          setData(rows);
          setIsLoading(false);
        })
        .catch((err) => {
          if (err.name === "AbortError") return;
          setData([]);
          setIsLoading(false);
        });
    }, 200);

    return () => {
      clearTimeout(timer);
    };
  }, [filters.period, filters.venues.join(","), filters.outcomes.join(","), filters.categories.join(","), granularity]);

  return { data, isLoading };
}
