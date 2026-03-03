import type { SupabaseClient } from "@supabase/supabase-js";

export interface RawMessageInsert {
  whatsapp_group_name: string;
  community_name: string | null;
  sender: string | null;
  body: string;
  message_timestamp: string | null;
}

export async function insertRawMessage(
  supabase: SupabaseClient,
  message: RawMessageInsert
) {
  const { data, error } = await supabase
    .from("raw_messages")
    .insert(message)
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

export async function markProcessed(
  supabase: SupabaseClient,
  id: string,
  parseError: string | null = null
) {
  const { error } = await supabase
    .from("raw_messages")
    .update({ processed: true, parse_error: parseError })
    .eq("id", id);

  if (error) throw error;
}
