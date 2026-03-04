import { NextRequest, NextResponse } from "next/server";
import { getUpcomingMatches, upsertMatch } from "@/lib/db/matches";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { parseMessage } from "@/lib/parser/parseMessage";
import { detectFormat } from "@/lib/parser/detectFormat";
import { parseDate } from "@/lib/parser/parseDate";
import type { MessageFormat } from "@/lib/types";

function diagnose(body: string, format: MessageFormat): string {
  if (format === "formatC") {
    return "No 📅 date line found. Make sure you paste the full match message with emojis (📅📊✅⚪).";
  }

  const lines = body.split("\n");

  const dateLine = lines.find((l) => l.includes("📅"));
  if (!dateLine) return "Missing date line — no 📅 emoji found.";

  const matchTime = parseDate(dateLine, new Date());
  if (!matchTime) return `Could not parse the date from: "${dateLine.trim()}"`;

  const hasPlayers = lines.some((l) => l.includes("✅") || l.includes("⚪"));
  if (!hasPlayers) return "No player lines found — expected lines starting with ✅ or ⚪.";

  return "Could not extract match details. Check that the message includes a title, date, level, players, and a Playtomic link.";
}

export async function POST(request: NextRequest) {
  try {
    const { body, indoor, competitionMode } = await request.json();

    if (typeof body !== "string" || !body.includes("playtomic.io")) {
      return NextResponse.json(
        { error: "Message must contain a Playtomic link (playtomic.io)." },
        { status: 400 }
      );
    }

    const format = detectFormat(body);
    const parsed = parseMessage(body);
    if (parsed === null) {
      return NextResponse.json({ error: diagnose(body, format) }, { status: 422 });
    }

    if (!parsed.venue) {
      const titleMatch = body.match(/\*([^*]+)\*/);
      const title = titleMatch ? `"${titleMatch[1].trim()}"` : "the title";
      return NextResponse.json(
        { error: `Could not find a venue name in ${title}. The title should include a recognisable club name (e.g. "MATCH IN PADEL FC").` },
        { status: 422 }
      );
    }

    const supabase = getSupabaseServerClient();

    const { data: rawRow, error: rawError } = await supabase
      .from("raw_messages")
      .insert({
        whatsapp_group_name: "manual",
        community_name: null,
        sender: null,
        body,
        message_timestamp: null,
        processed: true,
      })
      .select("id")
      .single();

    if (rawError) throw rawError;

    if (indoor === "indoor" || indoor === "outdoor") {
      parsed.indoor = indoor;
    }
    if (competitionMode === "friendly" || competitionMode === "competitive") {
      parsed.competitionMode = competitionMode;
    }
    await upsertMatch(supabase, parsed, rawRow.id, "manual");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to add match:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const datesParam = searchParams.get("dates");
  const dates = datesParam ? datesParam.split(",").filter(Boolean) : undefined;

  const timeOfDayParam = searchParams.get("timeOfDay");
  const query = {
    dates,
    timeOfDay: timeOfDayParam ? timeOfDayParam.split(",").filter(Boolean) : undefined,
    levelMin: searchParams.has("levelMin")
      ? Number(searchParams.get("levelMin"))
      : undefined,
    levelMax: searchParams.has("levelMax")
      ? Number(searchParams.get("levelMax"))
      : undefined,
    venues: searchParams.get("venues")?.split(",").filter(Boolean) || undefined,
    category: searchParams.get("category") || undefined,
    indoor: (searchParams.get("indoor") as "indoor" | "outdoor" | null) || undefined,
  };

  try {
    const supabase = getSupabaseServerClient();
    const matches = await getUpcomingMatches(supabase, query);
    return NextResponse.json(matches, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" },
    });
  } catch (error) {
    console.error("Failed to fetch matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 }
    );
  }
}
