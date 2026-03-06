import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import { createClient } from "@supabase/supabase-js";
import { handleMessage } from "./handler";
import "dotenv/config";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ["--no-sandbox"],
  },
});

client.on("qr", (qr) => {
  console.log("Scan this QR code to authenticate:");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("WhatsApp client is ready!");
});

client.on("message", async (msg) => {
  const chat = await msg.getChat();

  // Only process group messages
  if (!chat.isGroup) return;

  // Try to get the parent community name (WhatsApp Communities have sub-groups)
  // e.g. group "Padel Level: 1.5-2.5" belongs to community "Padelhaus Gmbh"
  let communityName: string | null = null;
  try {
    const chatRecord = chat as unknown as Record<string, Record<string, unknown>>;
    const meta = chatRecord.groupMetadata;
    const raw = meta?.parentGroup ?? meta?.parentGroupId;
    const rawRecord = raw as Record<string, string> | string | undefined;
    const parentId = typeof rawRecord === "object" ? rawRecord?._serialized : (typeof rawRecord === "string" ? rawRecord : null);
    if (parentId) {
      const parentChat = await client.getChatById(parentId);
      communityName = parentChat.name || null;
    }
  } catch {
    // Community lookup is best-effort — don't fail the message
  }

  await handleMessage(supabase, {
    groupName: chat.name,
    communityName,
    sender: msg.author || null,
    body: msg.body,
    timestamp: msg.timestamp,
  });
});

client.on("disconnected", (reason) => {
  console.log("Client disconnected:", reason);
  process.exit(1);
});

console.log("Starting WhatsApp listener...");
client.initialize();
