import { NextResponse } from "next/server";
import { pollAndCleanup } from "@/lib/playtomic/pollAndCleanup";

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await pollAndCleanup();
  return NextResponse.json(result);
}
