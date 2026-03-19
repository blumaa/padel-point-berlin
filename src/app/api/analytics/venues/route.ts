import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(_request: Request) {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("matches")
      .select("venue")
      .not("venue", "is", null)
      .order("venue");

    if (error) throw error;

    const venues = [...new Set((data ?? []).map((r: { venue: string }) => r.venue))].sort();

    return NextResponse.json(venues, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=300" },
    });
  } catch (error) {
    console.error("Failed to fetch venues:", error);
    return NextResponse.json({ error: "Failed to fetch venues" }, { status: 500 });
  }
}
