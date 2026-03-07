"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
  ResponsiveContainer,
} from "recharts";
import type { AnalyticsData } from "@/lib/analytics";
import { useThemeColors } from "@/lib/useThemeColors";

function friendlyMonth(iso: string): string {
  const [y, m] = iso.split("-");
  const d = new Date(Date.UTC(Number(y), Number(m) - 1, 1));
  return d.toLocaleString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });
}

function friendlyWeek(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  const day = d.getUTCDate();
  const mon = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
  return `${mon} ${day}`;
}

function friendlyBucket(key: string): string {
  return key.length <= 7 ? friendlyMonth(key) : friendlyWeek(key);
}

interface Props {
  data: AnalyticsData;
}

const tooltipStyle = {
  backgroundColor: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "6px",
  fontSize: "0.8rem",
};

export default function RechartsAnalytics({ data }: Props) {
  const c = useThemeColors();
  const isMonthly = data.matchesPerWeek.length > 0 && data.matchesPerWeek[0].week.length <= 7;

  const venueData = data.venuePopularity.map((v) => ({ name: v.venue, count: v.count }));
  const levelData = data.levelDistribution.map((l) => ({ name: `Lvl ${l.label}`, count: l.count }));
  const fillData = data.fillRate.map((v) => ({ name: v.venue, pct: v.percentage, label: `${v.filled}/${v.total}` }));
  const trendData = data.matchesPerWeek.map((w) => ({ name: friendlyBucket(w.week), count: w.count }));
  const categoryData = data.categoryBreakdown.map((cat) => ({ name: cat.category, count: cat.count }));
  const ioData = data.indoorOutdoorByMonth.map((m) => ({ name: friendlyMonth(m.month), indoor: m.indoor, outdoor: m.outdoor }));
  const leadData = data.averageLeadTime.map((v) => ({ name: v.venue, days: v.avgDays }));
  const compData = data.friendlyVsCompetitive.map((m) => ({ name: friendlyMonth(m.month), friendly: m.friendly, competitive: m.competitive }));
  const outcomeData = data.outcomeByMonth.map((m) => ({ name: friendlyMonth(m.month), filled: m.filled, canceled: m.canceled, empty: m.empty, expired: m.expired, stale: m.stale, pending: m.pending }));
  const summaryData = data.outcomeSummary.map((s) => ({ name: s.reason.charAt(0).toUpperCase() + s.reason.slice(1), count: s.count }));

  // Heatmap stays as CSS/HTML
  const peakMax = Math.max(
    ...data.peakMatchTimes.flatMap((r) => [r.slots.morning, r.slots.afternoon, r.slots.evening]),
    1
  );

  const barHeight = 28;

  return (
    <>
      {/* Venue Popularity */}
      <section className="klimt-stat-card">
        <h2 className="klimt-stat-heading">Matches by Venue</h2>
        <ResponsiveContainer width="100%" height={venueData.length * barHeight + 20}>
          <BarChart data={venueData} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" width={90} tick={{ fill: c.textMuted, fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: c.surface2 }} />
            <Bar dataKey="count" radius={[0, 3, 3, 0]} barSize={14}>
              {venueData.map((_, i) => <Cell key={i} fill={c.accent} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Peak Match Times — keep as CSS heatmap */}
      <section className="klimt-stat-card">
        <h2 className="klimt-stat-heading">When Do People Play?</h2>
        <table className="klimt-heatmap">
          <thead>
            <tr>
              <th></th>
              <th scope="col">6-12</th>
              <th scope="col">12-17</th>
              <th scope="col">17+</th>
            </tr>
          </thead>
          <tbody>
            {data.peakMatchTimes.map((row) => (
              <tr key={row.weekday}>
                <th scope="row" className="klimt-heatmap-day">{row.weekday.slice(0, 3)}</th>
                {(["morning", "afternoon", "evening"] as const).map((slot) => {
                  const val = row.slots[slot];
                  const intensity = val / peakMax;
                  return (
                    <td
                      key={slot}
                      className="klimt-heatmap-cell"
                      style={{
                        backgroundColor: intensity > 0 ? "var(--accent)" : "transparent",
                        opacity: intensity > 0 ? 0.25 + intensity * 0.65 : 1,
                      }}
                      title={`${row.weekday} ${slot}: ${val} matches`}
                    >
                      {val > 0 ? val : ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Level Distribution */}
      <section className="klimt-stat-card">
        <h2 className="klimt-stat-heading">Level Distribution</h2>
        <ResponsiveContainer width="100%" height={levelData.length * barHeight + 20}>
          <BarChart data={levelData} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" width={60} tick={{ fill: c.textMuted, fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: c.surface2 }} />
            <Bar dataKey="count" radius={[0, 3, 3, 0]} barSize={14}>
              {levelData.map((_, i) => <Cell key={i} fill={c.match} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Fill Rate */}
      <section className="klimt-stat-card">
        <h2 className="klimt-stat-heading">Fill Rate (fully booked matches)</h2>
        <ResponsiveContainer width="100%" height={fillData.length * barHeight + 20}>
          <BarChart data={fillData} layout="vertical" margin={{ left: 0, right: 50, top: 0, bottom: 0 }}>
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis type="category" dataKey="name" width={90} tick={{ fill: c.textMuted, fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value}%`, "Fill Rate"]} cursor={{ fill: c.surface2 }} />
            <Bar dataKey="pct" radius={[0, 3, 3, 0]} barSize={14}>
              {fillData.map((_, i) => <Cell key={i} fill={c.confirmed} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Trend */}
      <section className="klimt-stat-card">
        <h2 className="klimt-stat-heading">{isMonthly ? "Monthly" : "Weekly"} Trend</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={trendData} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
            <XAxis dataKey="name" tick={{ fill: c.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: c.surface2 }} />
            <Bar dataKey="count" radius={[3, 3, 0, 0]} barSize={20}>
              {trendData.map((_, i) => <Cell key={i} fill={c.open} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Category Breakdown */}
      <section className="klimt-stat-card">
        <h2 className="klimt-stat-heading">Category Breakdown</h2>
        <ResponsiveContainer width="100%" height={categoryData.length * barHeight + 20}>
          <BarChart data={categoryData} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" width={70} tick={{ fill: c.textMuted, fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: c.surface2 }} />
            <Bar dataKey="count" radius={[0, 3, 3, 0]} barSize={14}>
              {categoryData.map((_, i) => <Cell key={i} fill={c.class} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Indoor vs Outdoor */}
      <section className="klimt-stat-card">
        <h2 className="klimt-stat-heading">Indoor vs Outdoor by Month</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={ioData} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
            <XAxis dataKey="name" tick={{ fill: c.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: c.surface2 }} />
            <Bar dataKey="indoor" stackId="io" fill={c.accent} barSize={20} radius={[0, 0, 0, 0]} />
            <Bar dataKey="outdoor" stackId="io" fill={c.open} barSize={20} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="klimt-legend">
          <span className="klimt-legend-item"><span className="klimt-legend-swatch klimt-legend-swatch--indoor" /> Indoor</span>
          <span className="klimt-legend-item"><span className="klimt-legend-swatch klimt-legend-swatch--outdoor" /> Outdoor</span>
        </div>
      </section>

      {/* Match Outcomes by Month */}
      {outcomeData.length > 0 && (
        <section className="klimt-stat-card">
          <h2 className="klimt-stat-heading">Match Outcomes by Month</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={outcomeData} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fill: c.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: c.surface2 }} />
              <Bar dataKey="filled" stackId="outcome" fill={c.confirmed} barSize={20} />
              <Bar dataKey="canceled" stackId="outcome" fill={c.class} barSize={20} />
              <Bar dataKey="empty" stackId="outcome" fill={c.textMuted} barSize={20} />
              <Bar dataKey="expired" stackId="outcome" fill={c.open} barSize={20} />
              <Bar dataKey="stale" stackId="outcome" fill={c.match} barSize={20} />
              <Bar dataKey="pending" stackId="outcome" fill={c.accent} barSize={20} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="klimt-legend">
            <span className="klimt-legend-item"><span className="klimt-legend-swatch klimt-legend-swatch--filled" /> Filled</span>
            <span className="klimt-legend-item"><span className="klimt-legend-swatch klimt-legend-swatch--canceled" /> Canceled</span>
            <span className="klimt-legend-item"><span className="klimt-legend-swatch klimt-legend-swatch--empty" /> Empty</span>
            <span className="klimt-legend-item"><span className="klimt-legend-swatch klimt-legend-swatch--expired" /> Expired</span>
          </div>
        </section>
      )}

      {/* Outcome Summary */}
      {summaryData.length > 0 && (
        <section className="klimt-stat-card">
          <h2 className="klimt-stat-heading">Outcome Summary</h2>
          <ResponsiveContainer width="100%" height={summaryData.length * barHeight + 20}>
            <BarChart data={summaryData} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={80} tick={{ fill: c.textMuted, fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: c.surface2 }} />
              <Bar dataKey="count" radius={[0, 3, 3, 0]} barSize={14}>
                {summaryData.map((_, i) => <Cell key={i} fill={c.accent} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>
      )}

      {/* Average Lead Time */}
      <section className="klimt-stat-card">
        <h2 className="klimt-stat-heading">Avg. Lead Time (days before match)</h2>
        <ResponsiveContainer width="100%" height={leadData.length * barHeight + 20}>
          <BarChart data={leadData} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" width={90} tick={{ fill: c.textMuted, fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value}d`, "Lead Time"]} cursor={{ fill: c.surface2 }} />
            <Bar dataKey="days" radius={[0, 3, 3, 0]} barSize={14}>
              {leadData.map((_, i) => <Cell key={i} fill={c.accent} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Friendly vs Competitive */}
      <section className="klimt-stat-card">
        <h2 className="klimt-stat-heading">Friendly vs Competitive by Month</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={compData} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
            <XAxis dataKey="name" tick={{ fill: c.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: c.surface2 }} />
            <Bar dataKey="friendly" stackId="comp" fill={c.confirmed} barSize={20} radius={[0, 0, 0, 0]} />
            <Bar dataKey="competitive" stackId="comp" fill={c.class} barSize={20} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="klimt-legend">
          <span className="klimt-legend-item"><span className="klimt-legend-swatch klimt-legend-swatch--friendly" /> Friendly</span>
          <span className="klimt-legend-item"><span className="klimt-legend-swatch klimt-legend-swatch--competitive" /> Competitive</span>
        </div>
      </section>
    </>
  );
}
