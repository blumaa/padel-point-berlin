import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { TimePeriod } from "@/lib/analyticsTypes";

const VALID_PERIODS: TimePeriod[] = ["30d", "90d", "6m", "1y", "all"];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const period = (searchParams.get("period") ?? "30d") as string;
    if (!VALID_PERIODS.includes(period as TimePeriod)) {
      return NextResponse.json(
        { error: "Invalid period. Must be one of: 30d, 90d, 6m, 1y, all" },
        { status: 400 },
      );
    }

    const venues = searchParams.get("venues")?.split(",").filter(Boolean) ?? [];
    const outcomes = searchParams.get("outcomes")?.split(",").filter(Boolean) ?? [];
    const categories = searchParams.get("categories")?.split(",").filter(Boolean) ?? [];

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.rpc("get_analytics", {
      p_period: period,
      p_venues: venues,
      p_outcomes: outcomes,
      p_categories: categories,
    });

    if (error) throw error;

    return NextResponse.json(data ?? {}, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
