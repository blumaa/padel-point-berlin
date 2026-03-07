import type { SupabaseClient } from "@supabase/supabase-js";
import { parseMessage } from "../src/lib/parser/parseMessage";
import { normalizeVenue } from "../src/lib/parser/normalizeVenue";
import { insertRawMessage, markProcessed } from "../src/lib/db/rawMessages";
import { upsertMatch } from "../src/lib/db/matches";

export interface IncomingMessage {
  groupName: string;
  communityName: string | null;
  sender: string | null;
  body: string;
  timestamp: number | null;
}

/**
 * Pipeline: store raw message → parse → upsert match.
 * Only processes messages containing a playtomic.io link.
 */
export async function handleMessage(
  supabase: SupabaseClient,
  message: IncomingMessage
): Promise<void> {
  // Only process messages with playtomic links
  if (!message.body.includes("playtomic.io")) {
    console.log("[handler] skipped: no playtomic.io link");
    return;
  }

  // Skip class messages — they are not matches
  if (message.body.includes("app.playtomic.io/lesson_class/")) {
    console.log("[handler] skipped: lesson_class link");
    return;
  }

  // Skip if already stored (idempotency for fetch-recent re-runs)
  if (message.timestamp) {
    const ts = new Date(message.timestamp * 1000).toISOString();
    const { count } = await supabase
      .from("raw_messages")
      .select("id", { count: "exact", head: true })
      .eq("whatsapp_group_name", message.groupName)
      .eq("message_timestamp", ts);
    if ((count ?? 0) > 0) { console.log("[handler] skipped: duplicate timestamp"); return; }
  }

  // Store raw message
  const rawId = await insertRawMessage(supabase, {
    whatsapp_group_name: message.groupName,
    community_name: message.communityName,
    sender: message.sender,
    body: message.body,
    message_timestamp: message.timestamp
      ? new Date(message.timestamp * 1000).toISOString()
      : null,
  });

  // Parse
  const parsed = parseMessage(message.body);

  if (!parsed) {
    console.log("[handler] skipped: could not parse");
    await markProcessed(supabase, rawId, "Could not parse message");
    return;
  }

  if (!parsed.playtomicId) {
    console.log("[handler] skipped: no playtomic_id");
    await markProcessed(supabase, rawId, "No playtomic_id extracted");
    return;
  }

  const effectiveVenue = parsed.venue ?? normalizeVenue(message.communityName ?? null);
  if (!effectiveVenue) {
    console.log("[handler] skipped: no venue");
    await markProcessed(supabase, rawId, "No venue could be determined");
    return;
  }

  try {
    await upsertMatch(supabase, parsed, rawId, message.groupName, message.communityName, true);
    await markProcessed(supabase, rawId);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    await markProcessed(supabase, rawId, errorMsg);
    console.error(`Failed to upsert match: ${errorMsg}`);
  }
}
