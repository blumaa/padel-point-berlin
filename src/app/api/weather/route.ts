import { NextResponse } from "next/server";

const BERLIN_LAT = 52.52;
const BERLIN_LON = 13.41;
const DAYLIGHT_START = 7;
const DAYLIGHT_END = 20;

interface HourlyData {
  time: string[];
  temperature_2m: number[];
}

interface DailyData {
  time: string[];
  weather_code: number[];
}

interface OpenMeteoResponse {
  daily?: DailyData;
  hourly?: HourlyData;
}

export async function GET() {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${BERLIN_LAT}&longitude=${BERLIN_LON}` +
    `&daily=weather_code&hourly=temperature_2m&timezone=Europe%2FBerlin&forecast_days=14`;

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    return NextResponse.json({ error: "weather fetch failed" }, { status: 502 });
  }

  const data: OpenMeteoResponse = await res.json();
  const daily = data.daily;
  const hourly = data.hourly;

  if (!daily || !hourly) {
    return NextResponse.json({ error: "unexpected response" }, { status: 502 });
  }

  // Group hourly temps by date, keeping only daylight hours (7–20)
  const tempsByDate: Record<string, number[]> = {};
  hourly.time.forEach((iso, i) => {
    const date = iso.slice(0, 10);
    const hour = parseInt(iso.slice(11, 13), 10);
    if (hour >= DAYLIGHT_START && hour <= DAYLIGHT_END) {
      (tempsByDate[date] ??= []).push(hourly.temperature_2m[i]);
    }
  });

  const daylight_temp: number[] = daily.time.map((date) => {
    const temps = tempsByDate[date];
    if (!temps || temps.length === 0) return 0;
    return temps.reduce((a, b) => a + b, 0) / temps.length;
  });

  return NextResponse.json({
    daily: {
      time: daily.time,
      weather_code: daily.weather_code,
      daylight_temp,
    },
  }, {
    headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=600" },
  });
}
