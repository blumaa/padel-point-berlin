import type { WeatherType } from "@/hooks/useWeather";

interface WeatherIconProps {
  type: WeatherType;
  temp: number;
  size?: number;
}

function WeatherGraphic({ type }: { type: WeatherType }) {
  switch (type) {
    case "sunny":
      return (
        <>
          {/* Sun body */}
          <circle cx="14" cy="12" r="5" fill="#FACC15" />
          {/* Rays */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const x1 = 14 + Math.cos(rad) * 7;
            const y1 = 12 + Math.sin(rad) * 7;
            const x2 = 14 + Math.cos(rad) * 9.5;
            const y2 = 12 + Math.sin(rad) * 9.5;
            return (
              <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="#FACC15" strokeWidth="1.5" strokeLinecap="round" />
            );
          })}
        </>
      );
    case "partly-cloudy":
      return (
        <>
          <circle cx="11" cy="10" r="4.5" fill="#FACC15" />
          {[0, 60, 120, 180, 240, 300].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            return (
              <line key={angle}
                x1={11 + Math.cos(rad) * 6} y1={10 + Math.sin(rad) * 6}
                x2={11 + Math.cos(rad) * 7.5} y2={10 + Math.sin(rad) * 7.5}
                stroke="#FACC15" strokeWidth="1.2" strokeLinecap="round" />
            );
          })}
          <path d="M10 18 Q10 14 14 14 Q14 11 18 11 Q22 11 22 14 Q25 14 25 17 Q25 19 22 19 H12 Q10 19 10 18Z"
            fill="#CBD5E1" />
        </>
      );
    case "foggy":
      return (
        <>
          <line x1="6" y1="10" x2="22" y2="10" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
          <line x1="8" y1="14" x2="24" y2="14" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          <line x1="6" y1="18" x2="20" y2="18" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
        </>
      );
    case "drizzle":
      return (
        <>
          <path d="M8 14 Q8 10 12 10 Q12 7 16 7 Q20 7 20 10 Q23 10 23 13 Q23 15 20 15 H10 Q8 15 8 14Z"
            fill="#94A3B8" />
          <line x1="11" y1="17" x2="10" y2="19" stroke="#60A5FA" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="16" y1="17" x2="15" y2="19" stroke="#60A5FA" strokeWidth="1.2" strokeLinecap="round" />
        </>
      );
    case "rainy":
      return (
        <>
          <path d="M7 13 Q7 9 11 9 Q11 6 15 6 Q19 6 19 9 Q22 9 22 12 Q22 14 19 14 H9 Q7 14 7 13Z"
            fill="#64748B" />
          <line x1="10" y1="16" x2="8" y2="20" stroke="#3B82F6" strokeWidth="1.3" strokeLinecap="round" />
          <line x1="15" y1="16" x2="13" y2="20" stroke="#3B82F6" strokeWidth="1.3" strokeLinecap="round" />
          <line x1="20" y1="16" x2="18" y2="20" stroke="#3B82F6" strokeWidth="1.3" strokeLinecap="round" />
        </>
      );
    case "freezing-rain":
      return (
        <>
          <path d="M7 13 Q7 9 11 9 Q11 6 15 6 Q19 6 19 9 Q22 9 22 12 Q22 14 19 14 H9 Q7 14 7 13Z"
            fill="#64748B" />
          <line x1="10" y1="16" x2="8" y2="20" stroke="#93C5FD" strokeWidth="1.3" strokeLinecap="round" />
          <line x1="15" y1="16" x2="13" y2="20" stroke="#93C5FD" strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="20" cy="18" r="1.2" fill="#BFDBFE" />
        </>
      );
    case "snowy":
      return (
        <>
          <path d="M8 13 Q8 9 12 9 Q12 6 16 6 Q20 6 20 9 Q23 9 23 12 Q23 14 20 14 H10 Q8 14 8 13Z"
            fill="#94A3B8" />
          <circle cx="11" cy="17.5" r="1.3" fill="#DBEAFE" />
          <circle cx="16" cy="18.5" r="1.3" fill="#DBEAFE" />
          <circle cx="21" cy="17" r="1.3" fill="#DBEAFE" />
        </>
      );
    case "thunderstorm":
      return (
        <>
          <path d="M7 12 Q7 8 11 8 Q11 5 15 5 Q19 5 19 8 Q22 8 22 11 Q22 13 19 13 H9 Q7 13 7 12Z"
            fill="#475569" />
          <polygon points="15,14 12,19 14.5,19 13,23 18,17 15.5,17 17,14" fill="#FACC15" />
        </>
      );
  }
}

export default function WeatherIcon({ type, temp, size = 28 }: WeatherIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      aria-label={`${type}, ${temp}°C`}
    >
      <WeatherGraphic type={type} />
      {/* Temperature badge - overlapping bottom-right */}
      <text
        x="26"
        y="27"
        textAnchor="end"
        fontSize="9"
        fontWeight="700"
        fontFamily="var(--font-inter), system-ui, sans-serif"
        fill="currentColor"
      >
        {temp}°
      </text>
    </svg>
  );
}
