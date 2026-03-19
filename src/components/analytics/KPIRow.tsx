import { KPICard } from "./KPICard";
import type { AnalyticsData } from "@/lib/analyticsTypes";

interface Props {
  data: AnalyticsData;
}

function successRate(data: AnalyticsData): number {
  const filled = data.outcomeSummary.find((s) => s.reason === "filled")?.count ?? 0;
  const expired = data.outcomeSummary.find((s) => s.reason === "expired")?.count ?? 0;
  const empty = data.outcomeSummary.find((s) => s.reason === "empty")?.count ?? 0;
  const attempted = filled + expired + empty;
  return attempted > 0 ? Math.round((filled / attempted) * 100) : 0;
}

function postedCount(data: AnalyticsData): number {
  const canceled = data.outcomeSummary.find((s) => s.reason === "canceled")?.count ?? 0;
  return data.totalMatches - canceled;
}

export function KPIRow({ data }: Props) {
  return (
    <div className="klimt-kpi-row">
      <KPICard
        label="Matches Played"
        value={data.filledCount.toLocaleString()}
        subtitle={`of ${postedCount(data).toLocaleString()} posted`}
      />
      <KPICard
        label="Success Rate"
        value={`${successRate(data)}%`}
        subtitle="found 4 players"
      />
      <KPICard
        label="Per Week"
        value={String(data.avgPerWeek)}
        subtitle="filled matches avg."
      />
    </div>
  );
}
