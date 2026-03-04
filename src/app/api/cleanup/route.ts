import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * DELETE /api/cleanup
 *
 * Deletes matches whose match_time has already passed (i.e. the game is over).
 * Cascades to match_players via FK constraint.
 *
 * Called by Vercel Cron every 30 minutes (see vercel.json).
 * Protected by a shared secret so it can't be triggered publicly.
 */
export async function GET(request: NextRequest) {
  const secret = request.headers.get("authorization");
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();

  const { error, count } = await supabase
    .from("matches")
    .delete({ count: "exact" })
    .lt("match_time", new Date().toISOString());

  if (error) {
    console.error("Cleanup failed:", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }

  console.log(`Cleanup: deleted ${count} expired match(es)`);
  return NextResponse.json({ deleted: count });
}
