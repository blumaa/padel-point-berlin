/**
 * Replay all stored raw_messages through the current parser.
 * Re-upserts every match with fresh venue, players, level data.
 * Safe to run multiple times — fully idempotent.
 *
 * Usage: npm run replay
 */

import { createClient } from "@supabase/supabase-js";
import { parseMessage } from "../src/lib/parser/parseMessage";
import { upsertMatch } from "../src/lib/db/matches";
import { markProcessed } from "../src/lib/db/rawMessages";
import "dotenv/config";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function replay() {
  console.log("Fetching raw messages...");

  const { data: messages, error } = await supabase
    .from("raw_messages")
    .select("id, body, whatsapp_group_name, community_name, message_timestamp")
    .order("received_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch raw_messages:", error.message);
    process.exit(1);
  }

  console.log(`Found ${messages.length} messages. Re-parsing...`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const msg of messages) {
    const parsed = parseMessage(msg.body);

    if (!parsed) {
      skipped++;
      continue;
    }

    try {
      await upsertMatch(supabase, parsed, msg.id, msg.whatsapp_group_name, msg.community_name, true);
      await markProcessed(supabase, msg.id);
      updated++;
      console.log(`  ✓ ${parsed.venue ?? "(no venue)"} · ${parsed.matchTime.toISOString().slice(0, 16)}`);
    } catch (err) {
      failed++;
      const errMsg = err instanceof Error ? err.message : (typeof err === "object" && err !== null && "message" in err) ? (err as { message: string }).message : JSON.stringify(err);
      await markProcessed(supabase, msg.id, errMsg);
      console.error(`  ✗ ${msg.id}: ${errMsg}`);
    }
  }

  console.log(`\nDone. Updated: ${updated}  Skipped: ${skipped}  Failed: ${failed}`);
}

replay();
