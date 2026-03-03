import { createClient } from "@supabase/supabase-js";

/**
 * Service role client for the WhatsApp listener process.
 * Bypasses RLS — only use server-side.
 */
export function getSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
