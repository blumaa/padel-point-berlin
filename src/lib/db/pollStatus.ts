import type { SupabaseClient } from "@supabase/supabase-js";

interface PollResult {
  ok: boolean;
  upserted: number;
  expired: number;
  stale: number;
  errors: string[];
}

export interface PollStatus {
  id: number;
  last_success_at: string;
  upserted: number;
  expired: number;
  stale: number;
}

export async function updatePollStatus(supabase: SupabaseClient, result: PollResult): Promise<void> {
  await supabase.from("poll_status").upsert(
    {
      id: 1,
      last_success_at: new Date().toISOString(),
      upserted: result.upserted,
      expired: result.expired,
      stale: result.stale,
    },
    { onConflict: "id" }
  );
}

export async function getPollStatus(supabase: SupabaseClient): Promise<PollStatus | null> {
  const { data, error } = await supabase.from("poll_status").select().single();
  if (error || !data) return null;
  return data as PollStatus;
}
