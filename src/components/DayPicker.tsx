"use client";

import type { WeatherMap } from "@/hooks/useWeather";

interface DayPickerProps {
  selectedDates: string[];
  onToggle: (date: string) => void;
  weather: WeatherMap;
  weatherLoading: boolean;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export default function DayPicker({ selectedDates, onToggle, weather, weatherLoading }: DayPickerProps) {
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="klimt-day-rail">
    <div className="klimt-day-scroller">
      {days.map((day, i) => {
        const dateStr = formatDate(day);
        const isSelected = selectedDates.includes(dateStr);
        const label = i === 0 ? "Today" : day.toLocaleDateString("en-US", { weekday: "short" });
        const num = day.getDate();

        return (
          <button
            key={dateStr}
            onClick={() => onToggle(dateStr)}
            className={`klimt-day${isSelected ? " klimt-day-selected" : ""}`}
            aria-label={`${label} ${day.toLocaleDateString("en-US", { month: "long", day: "numeric" })}`}
            aria-pressed={isSelected}
          >
            <span className="klimt-day-label">{label}</span>
            <span className="klimt-day-num">{num}</span>
            <span className="klimt-day-weather">
              {weatherLoading ? (
                <span className="klimt-day-weather-skeleton" />
              ) : (
                weather[dateStr] ?? ""
              )}
            </span>
          </button>
        );
      })}
    </div>
    </div>
  );
}
