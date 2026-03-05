"use client";

import { useState, useEffect } from "react";

/** WMO weather code → emoji */
function weatherCodeToEmoji(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 3) return "⛅";
  if (code <= 48) return "🌫️";
  if (code <= 55) return "🌦️";
  if (code <= 57) return "🌧️";
  if (code <= 65) return "🌧️";
  if (code <= 67) return "🧊";
  if (code <= 75) return "🌨️";
  if (code <= 77) return "🌨️";
  if (code <= 82) return "🌧️";
  if (code <= 86) return "🌨️";
  if (code <= 99) return "⛈️";
  return "❓";
}

export type WeatherMap = Record<string, string>;

export function useWeather(): { weather: WeatherMap; isLoading: boolean } {
  const [weather, setWeather] = useState<WeatherMap>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/weather")
      .then((r) => r.json())
      .then((data: { daily?: { time?: string[]; weather_code?: number[] } }) => {
        const times = data.daily?.time;
        const codes = data.daily?.weather_code;
        if (!times || !codes) return;
        const map: WeatherMap = {};
        times.forEach((date, i) => {
          map[date] = weatherCodeToEmoji(codes[i]);
        });
        setWeather(map);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return { weather, isLoading };
}
