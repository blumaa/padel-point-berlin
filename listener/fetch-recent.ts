/**
 * Fetches messages from the last 48 hours across all joined WhatsApp group
 * chats and processes them through the same handler pipeline as the live
 * listener. Safe to run multiple times — upsert is idempotent.
 *
 * Usage: npm run fetch-recent
 */

import { Client, LocalAuth } from "whatsapp-web.js";
import { createClient } from "@supabase/supabase-js";
import { handleMessage } from "./handler";
import "dotenv/config";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: true, args: ["--no-sandbox"] },
});

client.on("ready", async () => {
  console.log("WhatsApp client ready. Fetching recent messages...");

  const cutoff = Date.now() - 48 * 60 * 60 * 1000; // 48 hours ago

  const chats = await client.getChats();
  const groups = chats.filter((c) => c.isGroup);

  console.log(`Found ${groups.length} group chat(s).`);

  let processed = 0;

  for (const chat of groups) {
    // Get community name for this group
    let communityName: string | null = null;
    try {
      const meta = (chat as any).groupMetadata;
      const raw = meta?.parentGroup || meta?.parentGroupId;
      const parentId = raw?._serialized ?? (typeof raw === "string" ? raw : null);
      if (parentId) {
        const parent = await client.getChatById(parentId);
        communityName = parent.name || null;
      }
    } catch (e) {
      console.error(`  ⚠ community lookup failed for "${chat.name}":`, e);
    }

    const messages = await chat.fetchMessages({ limit: 50 });

    for (const msg of messages) {
      if (msg.timestamp * 1000 < cutoff) continue;
      if (!msg.body.includes("playtomic.io")) continue;

      await handleMessage(supabase, {
        groupName: chat.name,
        communityName,
        sender: msg.author || null,
        body: msg.body,
        timestamp: msg.timestamp,
      });

      processed++;
      console.log(`  ✓ [${chat.name}]${communityName ? ` (${communityName})` : ""}`);
    }
  }

  console.log(`\nDone. Processed ${processed} message(s).`);
  process.exit(0);
});

client.on("disconnected", () => process.exit(1));

console.log("Starting WhatsApp client...");
client.initialize();
