import type { PeakTimeRow } from "@/lib/analyticsTypes";

interface Props {
  data: PeakTimeRow[];
}

const SLOT_LABELS = [
  { key: "morning" as const, label: "Morning", sub: "6–12h" },
  { key: "afternoon" as const, label: "Afternoon", sub: "12–17h" },
  { key: "evening" as const, label: "Evening", sub: "17h+" },
];

function findPeak(data: PeakTimeRow[]): { day: string; slot: string; count: number } | null {
  let best = { day: "", slot: "", count: 0 };
  for (const row of data) {
    for (const { key, label } of SLOT_LABELS) {
      if (row.slots[key] > best.count) {
        best = { day: row.weekday, slot: label.toLowerCase(), count: row.slots[key] };
      }
    }
  }
  return best.count > 0 ? best : null;
}

export function HeatmapChart({ data }: Props) {
  const peakMax = Math.max(
    ...data.flatMap((r) => [r.slots.morning, r.slots.afternoon, r.slots.evening]),
    1,
  );

  const peak = findPeak(data);

  return (
    <>
      <table className="klimt-heatmap">
        <thead>
          <tr>
            <th></th>
            {SLOT_LABELS.map((s) => (
              <th key={s.key} scope="col" className="klimt-heatmap-header">
                <span className="klimt-heatmap-header-label">{s.label}</span>
                <span className="klimt-heatmap-header-sub">{s.sub}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.weekday}>
              <th scope="row" className="klimt-heatmap-day">
                {row.weekday.slice(0, 3)}
              </th>
              {SLOT_LABELS.map(({ key }) => {
                const val = row.slots[key];
                const intensity = val / peakMax;
                return (
                  <td
                    key={key}
                    className="klimt-heatmap-cell"
                    style={{
                      backgroundColor: intensity > 0 ? "var(--accent)" : "transparent",
                      opacity: intensity > 0 ? 0.25 + intensity * 0.65 : 1,
                    }}
                    title={`${row.weekday} ${key}: ${val} matches`}
                  >
                    {val > 0 ? val : ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {peak && (
        <p className="klimt-heatmap-peak">
          Peak time: <strong>{peak.day} {peak.slot}</strong> with {peak.count} matches
        </p>
      )}
    </>
  );
}
