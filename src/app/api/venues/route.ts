import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.rpc("get_upcoming_venues");

    if (error) throw error;

    return NextResponse.json(data.map((r: { venue: string }) => r.venue));
  } catch (error) {
    console.error("Failed to fetch venues:", error);
    return NextResponse.json([], { status: 500 });
  }
}
