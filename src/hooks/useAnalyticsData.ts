import { useState, useEffect, useRef } from "react";
import type { AnalyticsData, AnalyticsFilterState } from "@/lib/analyticsTypes";

interface UseAnalyticsDataResult {
  data: AnalyticsData | null;
  isLoading: boolean;
  error: string | null;
}

function buildUrl(filters: AnalyticsFilterState): string {
  const params = new URLSearchParams();
  params.set("period", filters.period);
  if (filters.venues.length > 0) params.set("venues", filters.venues.join(","));
  if (filters.outcomes.length > 0) params.set("outcomes", filters.outcomes.join(","));
  if (filters.categories.length > 0) params.set("categories", filters.categories.join(","));
  return `/api/analytics?${params.toString()}`;
}

export function useAnalyticsData(filters: AnalyticsFilterState): UseAnalyticsDataResult {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Abort any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);

      fetch(buildUrl(filters), { signal: controller.signal })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((json: AnalyticsData) => {
          setData(json);
          setIsLoading(false);
          setError(null);
        })
        .catch((err) => {
          if (err.name === "AbortError") return;
          setError(err.message);
          setIsLoading(false);
        });
    }, 200);

    return () => {
      clearTimeout(timer);
    };
  }, [filters.period, filters.venues.join(","), filters.outcomes.join(","), filters.categories.join(",")]);

  return { data, isLoading, error };
}
