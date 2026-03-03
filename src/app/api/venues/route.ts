import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("matches")
      .select("venue")
      .gte("match_time", new Date().toISOString())
      .not("venue", "is", null)
      .order("venue");

    if (error) throw error;

    const venues = [...new Set(data.map((r: { venue: string }) => r.venue))].sort();
    return NextResponse.json(venues);
  } catch (error) {
    console.error("Failed to fetch venues:", error);
    return NextResponse.json([], { status: 500 });
  }
}
