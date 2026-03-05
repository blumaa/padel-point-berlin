import { NextResponse } from "next/server";

const BERLIN_LAT = 52.52;
const BERLIN_LON = 13.41;

export async function GET() {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${BERLIN_LAT}&longitude=${BERLIN_LON}` +
    `&daily=weather_code&timezone=Europe%2FBerlin&forecast_days=14`;

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    return NextResponse.json({ error: "weather fetch failed" }, { status: 502 });
  }
  const data = await res.json();
  return NextResponse.json(data);
}
