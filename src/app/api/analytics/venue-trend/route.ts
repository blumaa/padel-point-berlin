import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { TimePeriod, TrendGranularity } from "@/lib/analyticsTypes";

const VALID_PERIODS: TimePeriod[] = ["30d", "90d", "6m", "1y", "all"];
const VALID_GRANULARITIES: TrendGranularity[] = ["day", "week", "month", "year"];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const period = searchParams.get("period") ?? "30d";
    if (!VALID_PERIODS.includes(period as TimePeriod)) {
      return NextResponse.json({ error: "Invalid period" }, { status: 400 });
    }

    const granularity = searchParams.get("granularity") ?? "week";
    if (!VALID_GRANULARITIES.includes(granularity as TrendGranularity)) {
      return NextResponse.json({ error: "Invalid granularity" }, { status: 400 });
    }

    const venues = searchParams.get("venues")?.split(",").filter(Boolean) ?? [];
    const outcomes = searchParams.get("outcomes")?.split(",").filter(Boolean) ?? [];
    const categories = searchParams.get("categories")?.split(",").filter(Boolean) ?? [];

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.rpc("get_venue_trend", {
      p_period: period,
      p_granularity: granularity,
      p_venues: venues,
      p_outcomes: outcomes,
      p_categories: categories,
    });

    if (error) throw error;

    return NextResponse.json(data ?? [], {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
    });
  } catch (error) {
    console.error("Failed to fetch venue trend:", error);
    return NextResponse.json({ error: "Failed to fetch venue trend" }, { status: 500 });
  }
}
