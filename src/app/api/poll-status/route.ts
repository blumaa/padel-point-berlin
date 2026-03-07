import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getPollStatus } from "@/lib/db/pollStatus";

export async function GET() {
  const status = await getPollStatus(getSupabaseAdminClient());
  if (!status) {
    return NextResponse.json({ last_success_at: null });
  }
  return NextResponse.json(status, {
    headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=30" },
  });
}
