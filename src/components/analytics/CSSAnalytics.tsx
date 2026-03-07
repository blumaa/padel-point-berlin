import type { AnalyticsData } from "@/lib/analytics";

function friendlyWeek(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  const day = d.getUTCDate();
  const mon = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
  return `${mon} ${day}`;
}

function friendlyMonth(iso: string): string {
  const [y, m] = iso.split("-");
  const d = new Date(Date.UTC(Number(y), Number(m) - 1, 1));
  return d.toLocaleString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });
}

function friendlyBucket(key: string): string {
  return key.length <= 7 ? friendlyMonth(key) : friendlyWeek(key);
}

interface Props {
  data: AnalyticsData;
}

export default function CSSAnalytics({ data }: Props) {
  const maxVenue = Math.max(...data.venuePopularity.map((v) => v.count), 1);
  const maxWeek = Math.max(...data.matchesPerWeek.map((w) => w.count), 1);
  const maxCategory = Math.max(...data.categoryBreakdown.map((c) => c.count), 1);
  const maxLevel = Math.max(...data.levelDistribution.map((l) => l.count), 1);
  const maxLead = Math.max(...data.averageLeadTime.map((v) => v.avgDays), 1);
  const peakMax = Math.max(
    ...data.peakMatchTimes.flatMap((r) => [r.slots.morning, r.slots.afternoon, r.slots.evening]),
    1
  );
  const maxIO = Math.max(
    ...data.indoorOutdoorByMonth.map((m) => m.indoor + m.outdoor),
    1
  );
  const maxComp = Math.max(
    ...data.friendlyVsCompetitive.map((m) => m.friendly + m.competitive),
    1
  );

  const isMonthly = data.matchesPerWeek.length > 0 && data.matchesPerWeek[0].week.length <= 7;

  return (
    <>
      {/* Venue Popularity */}
      <section className="klimt-stat-card">
        <h2 className="klimt-stat-heading">Matches by Venue</h2>
        {data.venuePopularity.map((v) => (
          <div key={v.venue} className="klimt-bar-row">
            <span className="klimt-bar-label">{v.venue}</span>
            <div className="klimt-bar-track">
              <div
                className="klimt-bar-fill klimt-bar-fill--accent"
                style={{ width: `${(v.count / maxVenue) * 100}%` }}
              />
            </div>
            <span className="klimt-bar-value">{v.count}</span>
          </div>
        ))}
      </section>

      {/* Peak Match Times */}
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
        {data.levelDistribution.map((b) => (
          <div key={b.label} className="klimt-bar-row">
            <span className="klimt-bar-label">Lvl {b.label}</span>
            <div className="klimt-bar-track">
              <div
                className="klimt-bar-fill klimt-bar-fill--match"
                style={{ width: `${(b.count / maxLevel) * 100}%` }}
              />
            </div>
            <span className="klimt-bar-value">{b.count}</span>
          </div>
        ))}
      </section>

      {/* Fill Rate */}
      <section className="klimt-stat-card">
        <h2 className="klimt-stat-heading">Fill Rate (fully booked matches)</h2>
        {data.fillRate.map((v) => (
          <div key={v.venue} className="klimt-bar-row">
            <span className="klimt-bar-label">{v.venue}</span>
            <div className="klimt-bar-track">
              <div
                className="klimt-bar-fill klimt-bar-fill--confirmed"
                style={{ width: `${v.percentage}%` }}
              />
            </div>
            <span className="klimt-bar-value">{v.filled}/{v.total} ({v.percentage}%)</span>
          </div>
        ))}
      </section>

      {/* Trend */}
      <section className="klimt-stat-card">
        <h2 className="klimt-stat-heading">{isMonthly ? "Monthly" : "Weekly"} Trend</h2>
        {data.matchesPerWeek.map((w) => (
          <div key={w.week} className="klimt-bar-row">
            <span className="klimt-bar-label">{friendlyBucket(w.week)}</span>
            <div className="klimt-bar-track">
              <div
                className="klimt-bar-fill klimt-bar-fill--open"
                style={{ width: `${(w.count / maxWeek) * 100}%` }}
              />
            </div>
            <span className="klimt-bar-value">{w.count}</span>
          </div>
        ))}
      </section>

      {/* Category Breakdown */}
      <section className="klimt-stat-card">
        <h2 className="klimt-stat-heading">Category Breakdown</h2>
        {data.categoryBreakdown.map((c) => (
          <div key={c.category} className="klimt-bar-row">
            <span className="klimt-bar-label">{c.category}</span>
            <div className="klimt-bar-track">
              <div
                className="klimt-bar-fill klimt-bar-fill--class"
                style={{ width: `${(c.count / maxCategory) * 100}%` }}
              />
            </div>
            <span className="klimt-bar-value">{c.count}</span>
          </div>
        ))}
      </section>

      {/* Indoor vs Outdoor */}
      <section className="klimt-stat-card">
        <h2 className="klimt-stat-heading">Indoor vs Outdoor by Month</h2>
        {data.indoorOutdoorByMonth.map((m) => {
          const total = m.indoor + m.outdoor;
          return (
            <div key={m.month} className="klimt-bar-row">
              <span className="klimt-bar-label">{friendlyMonth(m.month)}</span>
              <div className="klimt-bar-track klimt-bar-track--stacked">
                <div
                  className="klimt-bar-fill klimt-bar-fill--indoor"
                  style={{ width: `${(m.indoor / maxIO) * 100}%` }}
                  title={`Indoor: ${m.indoor}`}
                />
                <div
                  className="klimt-bar-fill klimt-bar-fill--outdoor"
                  style={{ width: `${(m.outdoor / maxIO) * 100}%` }}
                  title={`Outdoor: ${m.outdoor}`}
                />
              </div>
              <span className="klimt-bar-value">{total}</span>
            </div>
          );
        })}
        <div className="klimt-legend">
          <span className="klimt-legend-item"><span className="klimt-legend-swatch klimt-legend-swatch--indoor" /> Indoor</span>
          <span className="klimt-legend-item"><span className="klimt-legend-swatch klimt-legend-swatch--outdoor" /> Outdoor</span>
        </div>
      </section>

      {/* Match Outcomes by Month */}
      {data.outcomeByMonth.length > 0 && (
        <section className="klimt-stat-card">
          <h2 className="klimt-stat-heading">Match Outcomes by Month</h2>
          {data.outcomeByMonth.map((m) => {
            const total = m.filled + m.canceled + m.empty + m.expired + m.stale + m.pending;
            const maxOutcome = Math.max(...data.outcomeByMonth.map((o) => o.filled + o.canceled + o.empty + o.expired + o.stale + o.pending), 1);
            return (
              <div key={m.month} className="klimt-bar-row">
                <span className="klimt-bar-label">{friendlyMonth(m.month)}</span>
                <div className="klimt-bar-track klimt-bar-track--stacked">
                  <div className="klimt-bar-fill klimt-bar-fill--filled" style={{ width: `${(m.filled / maxOutcome) * 100}%` }} title={`Filled: ${m.filled}`} />
                  <div className="klimt-bar-fill klimt-bar-fill--canceled" style={{ width: `${(m.canceled / maxOutcome) * 100}%` }} title={`Canceled: ${m.canceled}`} />
                  <div className="klimt-bar-fill klimt-bar-fill--empty" style={{ width: `${(m.empty / maxOutcome) * 100}%` }} title={`Empty: ${m.empty}`} />
                  <div className="klimt-bar-fill klimt-bar-fill--expired" style={{ width: `${(m.expired / maxOutcome) * 100}%` }} title={`Expired: ${m.expired}`} />
                  {m.stale > 0 && <div className="klimt-bar-fill klimt-bar-fill--stale" style={{ width: `${(m.stale / maxOutcome) * 100}%` }} title={`Stale: ${m.stale}`} />}
                  {m.pending > 0 && <div className="klimt-bar-fill klimt-bar-fill--pending" style={{ width: `${(m.pending / maxOutcome) * 100}%` }} title={`Pending: ${m.pending}`} />}
                </div>
                <span className="klimt-bar-value">{total}</span>
              </div>
            );
          })}
          <div className="klimt-legend">
            <span className="klimt-legend-item"><span className="klimt-legend-swatch klimt-legend-swatch--filled" /> Filled</span>
            <span className="klimt-legend-item"><span className="klimt-legend-swatch klimt-legend-swatch--canceled" /> Canceled</span>
            <span className="klimt-legend-item"><span className="klimt-legend-swatch klimt-legend-swatch--empty" /> Empty</span>
            <span className="klimt-legend-item"><span className="klimt-legend-swatch klimt-legend-swatch--expired" /> Expired</span>
          </div>
        </section>
      )}

      {/* Outcome Summary */}
      {data.outcomeSummary.length > 0 && (
        <section className="klimt-stat-card">
          <h2 className="klimt-stat-heading">Outcome Summary</h2>
          {(() => {
            const maxSummary = Math.max(...data.outcomeSummary.map((s) => s.count), 1);
            const reasonClass: Record<string, string> = { filled: "filled", canceled: "canceled", empty: "empty", expired: "expired", stale: "stale", pending: "pending" };
            return data.outcomeSummary.map((s) => (
              <div key={s.reason} className="klimt-bar-row">
                <span className="klimt-bar-label" style={{ textTransform: "capitalize" }}>{s.reason}</span>
                <div className="klimt-bar-track">
                  <div className={`klimt-bar-fill klimt-bar-fill--${reasonClass[s.reason] ?? "accent"}`} style={{ width: `${(s.count / maxSummary) * 100}%` }} />
                </div>
                <span className="klimt-bar-value">{s.count}</span>
              </div>
            ));
          })()}
        </section>
      )}

      {/* Average Lead Time */}
      <section className="klimt-stat-card">
        <h2 className="klimt-stat-heading">Avg. Lead Time (days before match)</h2>
        {data.averageLeadTime.map((v) => (
          <div key={v.venue} className="klimt-bar-row">
            <span className="klimt-bar-label">{v.venue}</span>
            <div className="klimt-bar-track">
              <div
                className="klimt-bar-fill klimt-bar-fill--accent"
                style={{ width: `${(v.avgDays / maxLead) * 100}%` }}
              />
            </div>
            <span className="klimt-bar-value">{v.avgDays}d</span>
          </div>
        ))}
      </section>

      {/* Friendly vs Competitive */}
      <section className="klimt-stat-card">
        <h2 className="klimt-stat-heading">Friendly vs Competitive by Month</h2>
        {data.friendlyVsCompetitive.map((m) => {
          const total = m.friendly + m.competitive;
          return (
            <div key={m.month} className="klimt-bar-row">
              <span className="klimt-bar-label">{friendlyMonth(m.month)}</span>
              <div className="klimt-bar-track klimt-bar-track--stacked">
                <div
                  className="klimt-bar-fill klimt-bar-fill--friendly"
                  style={{ width: `${(m.friendly / maxComp) * 100}%` }}
                  title={`Friendly: ${m.friendly}`}
                />
                <div
                  className="klimt-bar-fill klimt-bar-fill--competitive"
                  style={{ width: `${(m.competitive / maxComp) * 100}%` }}
                  title={`Competitive: ${m.competitive}`}
                />
              </div>
              <span className="klimt-bar-value">{total}</span>
            </div>
          );
        })}
        <div className="klimt-legend">
          <span className="klimt-legend-item"><span className="klimt-legend-swatch klimt-legend-swatch--friendly" /> Friendly</span>
          <span className="klimt-legend-item"><span className="klimt-legend-swatch klimt-legend-swatch--competitive" /> Competitive</span>
        </div>
      </section>
    </>
  );
}
