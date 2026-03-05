"use client";

import { useState, useEffect } from "react";

export type WeatherType = "sunny" | "partly-cloudy" | "foggy" | "drizzle" | "rainy" | "freezing-rain" | "snowy" | "thunderstorm";

function weatherCodeToType(code: number): WeatherType {
  if (code === 0) return "sunny";
  if (code <= 3) return "partly-cloudy";
  if (code <= 48) return "foggy";
  if (code <= 55) return "drizzle";
  if (code <= 57) return "freezing-rain";
  if (code <= 65) return "rainy";
  if (code <= 67) return "freezing-rain";
  if (code <= 77) return "snowy";
  if (code <= 82) return "rainy";
  if (code <= 86) return "snowy";
  if (code <= 99) return "thunderstorm";
  return "partly-cloudy";
}

export interface WeatherDay {
  type: WeatherType;
  temp: number;
}

export type WeatherMap = Record<string, WeatherDay>;

export function useWeather(): { weather: WeatherMap; isLoading: boolean } {
  const [weather, setWeather] = useState<WeatherMap>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/weather")
      .then((r) => r.json())
      .then((data: { daily?: { time?: string[]; weather_code?: number[]; daylight_temp?: number[] } }) => {
        const times = data.daily?.time;
        const codes = data.daily?.weather_code;
        const temps = data.daily?.daylight_temp;
        if (!times || !codes || !temps) return;
        const map: WeatherMap = {};
        times.forEach((date, i) => {
          map[date] = { type: weatherCodeToType(codes[i]), temp: Math.round(temps[i]) };
        });
        setWeather(map);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return { weather, isLoading };
}
