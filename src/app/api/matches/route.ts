import { NextRequest, NextResponse } from "next/server";
import { getUpcomingMatches, upsertMatch } from "@/lib/db/matches";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { parseMessage } from "@/lib/parser/parseMessage";

export async function POST(request: NextRequest) {
  try {
    const { body } = await request.json();

    if (typeof body !== "string" || !body.includes("playtomic.io")) {
      return NextResponse.json(
        { error: "Body must contain a playtomic.io link" },
        { status: 400 }
      );
    }

    const parsed = parseMessage(body);
    if (parsed === null) {
      return NextResponse.json(
        { error: "Could not parse match" },
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
  };

  try {
    const supabase = getSupabaseServerClient();
    const matches = await getUpcomingMatches(supabase, query);
    return NextResponse.json(matches);
  } catch (error) {
    console.error("Failed to fetch matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 }
    );
  }
}
