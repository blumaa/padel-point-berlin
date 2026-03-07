"use client";

import { useEffect, useRef, useCallback } from "react";
import { select, type Selection } from "d3-selection";
import { scaleBand, scaleLinear } from "d3-scale";
import { max } from "d3-array";
import { stack, stackOrderNone, stackOffsetNone } from "d3-shape";
import { axisBottom } from "d3-axis";
import { easeCubicOut } from "d3-ease";
import "d3-transition";
import type { AnalyticsData } from "@/lib/analytics";
import { useThemeColors, type ThemeColors } from "@/lib/useThemeColors";

interface Props {
  data: AnalyticsData;
}

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

// --- Tooltip helpers ---

function createTooltip(container: HTMLElement): Selection<HTMLDivElement, unknown, null, undefined> {
  return select(container)
    .append("div")
    .style("position", "absolute")
    .style("pointer-events", "none")
    .style("background", "var(--surface)")
    .style("border", "1px solid var(--border)")
    .style("border-radius", "6px")
    .style("padding", "4px 8px")
    .style("font-size", "0.8rem")
    .style("color", "var(--text)")
    .style("opacity", "0")
    .style("z-index", "10")
    .style("white-space", "nowrap");
}

function showTooltip(
  tooltip: Selection<HTMLDivElement, unknown, null, undefined>,
  event: MouseEvent | TouchEvent,
  html: string,
) {
  const e = "touches" in event ? event.touches[0] : event;
  tooltip.html(html).style("opacity", "1")
    .style("left", `${e.clientX + 10}px`)
    .style("top", `${e.clientY - 28}px`)
    .style("position", "fixed");
}

function hideTooltip(tooltip: Selection<HTMLDivElement, unknown, null, undefined>) {
  tooltip.style("opacity", "0");
}

// --- Reusable chart drawers ---

interface HBarDatum { label: string; value: number; tooltipHtml?: string }

function drawHorizontalBars(
  container: HTMLElement,
  data: HBarDatum[],
  opts: { color: string; colors: ThemeColors; valueFormat?: (v: number) => string },
) {
  select(container).selectAll("*").remove();
  if (data.length === 0) return;

  const wrapper = select(container);
  wrapper.style("position", "relative");

  const margin = { top: 4, right: 40, bottom: 4, left: 90 };
  const barHeight = 20;
  const gap = 6;
  const width = container.clientWidth;
  const height = data.length * (barHeight + gap) + margin.top + margin.bottom;

  const svg = wrapper.append("svg")
    .attr("width", width)
    .attr("height", height);

  const maxVal = max(data, d => d.value) || 1;

  const x = scaleLinear().domain([0, maxVal]).range([0, width - margin.left - margin.right]);
  const y = scaleBand()
    .domain(data.map(d => d.label))
    .range([margin.top, height - margin.bottom])
    .padding(0.2);

  const g = svg.append("g").attr("transform", `translate(${margin.left},0)`);

  const tooltip = createTooltip(container);

  g.selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", 0)
    .attr("y", d => y(d.label)!)
    .attr("height", y.bandwidth())
    .attr("rx", 3)
    .attr("fill", opts.color)
    .attr("width", 0)
    .on("mouseover touchstart", (event, d) => {
      const html = d.tooltipHtml || `${d.label}: ${opts.valueFormat ? opts.valueFormat(d.value) : d.value}`;
      showTooltip(tooltip, event, html);
    })
    .on("mouseout touchend", () => hideTooltip(tooltip))
    .transition()
    .duration(300)
    .ease(easeCubicOut)
    .attr("width", d => x(d.value));

  // Labels on left
  svg.append("g")
    .attr("transform", `translate(${margin.left - 4},0)`)
    .selectAll("text")
    .data(data)
    .join("text")
    .attr("x", 0)
    .attr("y", d => y(d.label)! + y.bandwidth() / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", "end")
    .attr("fill", opts.colors.textMuted)
    .attr("font-size", "12px")
    .text(d => d.label);

  // Value labels on right
  g.selectAll(".val-label")
    .data(data)
    .join("text")
    .attr("class", "val-label")
    .attr("x", d => x(d.value) + 4)
    .attr("y", d => y(d.label)! + y.bandwidth() / 2)
    .attr("dy", "0.35em")
    .attr("fill", opts.colors.textMuted)
    .attr("font-size", "12px")
    .text(d => opts.valueFormat ? opts.valueFormat(d.value) : d.value);
}

interface VBarDatum { label: string; [key: string]: string | number }

function drawVerticalBars(
  container: HTMLElement,
  data: VBarDatum[],
  opts: { keys: string[]; colors: string[]; themeColors: ThemeColors; stacked?: boolean },
) {
  select(container).selectAll("*").remove();
  if (data.length === 0) return;

  const wrapper = select(container);
  wrapper.style("position", "relative");

  const margin = { top: 10, right: 10, bottom: 30, left: 10 };
  const width = container.clientWidth;
  const height = 200;

  const svg = wrapper.append("svg")
    .attr("width", width)
    .attr("height", height);

  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const x = scaleBand()
    .domain(data.map(d => d.label))
    .range([0, innerW])
    .padding(0.3);

  const tooltip = createTooltip(container);
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  if (opts.stacked && opts.keys.length > 1) {
    const stackGen = stack<VBarDatum>()
      .keys(opts.keys)
      .order(stackOrderNone)
      .offset(stackOffsetNone);

    const series = stackGen(data);
    const maxVal = max(series, s => max(s, d => d[1])) || 1;
    const y = scaleLinear().domain([0, maxVal]).range([innerH, 0]);

    g.selectAll("g.series")
      .data(series)
      .join("g")
      .attr("class", "series")
      .attr("fill", (_, i) => opts.colors[i])
      .selectAll("rect")
      .data(d => d)
      .join("rect")
      .attr("x", d => x(d.data.label)!)
      .attr("width", x.bandwidth())
      .attr("rx", 0)
      .attr("y", innerH)
      .attr("height", 0)
      .on("mouseover touchstart", (event, d) => {
        const parts = opts.keys.map(k => `${k}: ${d.data[k]}`).join(", ");
        showTooltip(tooltip, event, `${d.data.label} — ${parts}`);
      })
      .on("mouseout touchend", () => hideTooltip(tooltip))
      .transition()
      .duration(300)
      .ease(easeCubicOut)
      .attr("y", d => y(d[1]))
      .attr("height", d => y(d[0]) - y(d[1]));
  } else {
    const key = opts.keys[0];
    const maxVal = max(data, d => d[key] as number) || 1;
    const y = scaleLinear().domain([0, maxVal]).range([innerH, 0]);

    g.selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", d => x(d.label)!)
      .attr("width", x.bandwidth())
      .attr("rx", 3)
      .attr("fill", opts.colors[0])
      .attr("y", innerH)
      .attr("height", 0)
      .on("mouseover touchstart", (event, d) => {
        showTooltip(tooltip, event, `${d.label}: ${d[key]}`);
      })
      .on("mouseout touchend", () => hideTooltip(tooltip))
      .transition()
      .duration(300)
      .ease(easeCubicOut)
      .attr("y", d => y(d[key] as number))
      .attr("height", d => innerH - y(d[key] as number));
  }

  // X axis labels
  g.append("g")
    .attr("transform", `translate(0,${innerH})`)
    .call(axisBottom(x).tickSize(0))
    .call(g => g.select(".domain").remove())
    .selectAll("text")
    .attr("fill", opts.themeColors.textMuted)
    .attr("font-size", "10px")
    .attr("transform", "rotate(-30)")
    .style("text-anchor", "end");
}

export default function D3Analytics({ data }: Props) {
  const c = useThemeColors();
  const isMonthly = data.matchesPerWeek.length > 0 && data.matchesPerWeek[0].week.length <= 7;

  const venueRef = useRef<HTMLDivElement>(null);
  const levelRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const trendRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const ioRef = useRef<HTMLDivElement>(null);
  const leadRef = useRef<HTMLDivElement>(null);
  const compRef = useRef<HTMLDivElement>(null);
  const outcomeRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    // 1. Venue
    if (venueRef.current) {
      drawHorizontalBars(venueRef.current,
        data.venuePopularity.map(v => ({ label: v.venue, value: v.count })),
        { color: c.accent, colors: c },
      );
    }

    // 3. Level
    if (levelRef.current) {
      drawHorizontalBars(levelRef.current,
        data.levelDistribution.map(l => ({ label: `Lvl ${l.label}`, value: l.count })),
        { color: c.match, colors: c },
      );
    }

    // 4. Fill Rate
    if (fillRef.current) {
      drawHorizontalBars(fillRef.current,
        data.fillRate.map(v => ({
          label: v.venue,
          value: v.percentage,
          tooltipHtml: `${v.venue}: ${v.filled}/${v.total} (${v.percentage}%)`,
        })),
        { color: c.confirmed, colors: c, valueFormat: v => `${v}%` },
      );
    }

    // 5. Trend
    if (trendRef.current) {
      drawVerticalBars(trendRef.current,
        data.matchesPerWeek.map(w => ({ label: friendlyBucket(w.week), count: w.count })),
        { keys: ["count"], colors: [c.open], themeColors: c },
      );
    }

    // 6. Category
    if (categoryRef.current) {
      drawHorizontalBars(categoryRef.current,
        data.categoryBreakdown.map(cat => ({ label: cat.category, value: cat.count })),
        { color: c.class, colors: c },
      );
    }

    // 7. Indoor vs Outdoor
    if (ioRef.current) {
      drawVerticalBars(ioRef.current,
        data.indoorOutdoorByMonth.map(m => ({ label: friendlyMonth(m.month), indoor: m.indoor, outdoor: m.outdoor })),
        { keys: ["indoor", "outdoor"], colors: [c.accent, c.open], themeColors: c, stacked: true },
      );
    }

    // 8. Lead Time
    if (leadRef.current) {
      drawHorizontalBars(leadRef.current,
        data.averageLeadTime.map(v => ({ label: v.venue, value: v.avgDays })),
        { color: c.accent, colors: c, valueFormat: v => `${v}d` },
      );
    }

    // 9. Friendly vs Competitive
    if (compRef.current) {
      drawVerticalBars(compRef.current,
        data.friendlyVsCompetitive.map(m => ({ label: friendlyMonth(m.month), friendly: m.friendly, competitive: m.competitive })),
        { keys: ["friendly", "competitive"], colors: [c.confirmed, c.class], themeColors: c, stacked: true },
      );
    }

    // 10. Outcome by Month
    if (outcomeRef.current) {
      drawVerticalBars(outcomeRef.current,
        data.outcomeByMonth.map(m => ({ label: friendlyMonth(m.month), filled: m.filled, canceled: m.canceled, empty: m.empty, expired: m.expired })),
        { keys: ["filled", "canceled", "empty", "expired"], colors: [c.confirmed, c.class, c.textMuted, c.open], themeColors: c, stacked: true },
      );
    }

    // 11. Outcome Summary
    if (summaryRef.current) {
      drawHorizontalBars(summaryRef.current,
        data.outcomeSummary.map(s => ({ label: s.reason.charAt(0).toUpperCase() + s.reason.slice(1), value: s.count })),
        { color: c.accent, colors: c },
      );
    }
  }, [data, c]);

  // Draw on data/color change
  useEffect(() => { draw(); }, [draw]);

  // Responsive redraw
  useEffect(() => {
    const observer = new ResizeObserver(() => draw());
    const refs = [venueRef, levelRef, fillRef, trendRef, categoryRef, ioRef, leadRef, compRef, outcomeRef, summaryRef];
    refs.forEach(r => { if (r.current) observer.observe(r.current); });
    return () => observer.disconnect();
  }, [draw]);

  // Heatmap (same CSS approach as Recharts/CSS renderers)
  const peakMax = Math.max(
    ...data.peakMatchTimes.flatMap(r => [r.slots.morning, r.slots.afternoon, r.slots.evening]),
    1,
  );

  return (
    <>
      <section className="klimt-stat-card">
        <h2 className="klimt-stat-heading">Matches by Venue</h2>
        <div ref={venueRef} />
      </section>

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
            {data.peakMatchTimes.map(row => (
              <tr key={row.weekday}>
                <th scope="row" className="klimt-heatmap-day">{row.weekday.slice(0, 3)}</th>
                {(["morning", "afternoon", "evening"] as const).map(slot => {
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

      <section className="klimt-stat-card">
        <h2 className="klimt-stat-heading">Level Distribution</h2>
        <div ref={levelRef} />
      </section>

      <section className="klimt-stat-card">
        <h2 className="klimt-stat-heading">Fill Rate (fully booked matches)</h2>
        <div ref={fillRef} />
      </section>

      <section className="klimt-stat-card">
        <h2 className="klimt-stat-heading">{isMonthly ? "Monthly" : "Weekly"} Trend</h2>
        <div ref={trendRef} />
      </section>

      <section className="klimt-stat-card">
        <h2 className="klimt-stat-heading">Category Breakdown</h2>
        <div ref={categoryRef} />
      </section>

      <section className="klimt-stat-card">
        <h2 className="klimt-stat-heading">Indoor vs Outdoor by Month</h2>
        <div ref={ioRef} />
        <div className="klimt-legend">
          <span className="klimt-legend-item"><span className="klimt-legend-swatch klimt-legend-swatch--indoor" /> Indoor</span>
          <span className="klimt-legend-item"><span className="klimt-legend-swatch klimt-legend-swatch--outdoor" /> Outdoor</span>
        </div>
      </section>

      {data.outcomeByMonth.length > 0 && (
        <section className="klimt-stat-card">
          <h2 className="klimt-stat-heading">Match Outcomes by Month</h2>
          <div ref={outcomeRef} />
          <div className="klimt-legend">
            <span className="klimt-legend-item"><span className="klimt-legend-swatch klimt-legend-swatch--filled" /> Filled</span>
            <span className="klimt-legend-item"><span className="klimt-legend-swatch klimt-legend-swatch--canceled" /> Canceled</span>
            <span className="klimt-legend-item"><span className="klimt-legend-swatch klimt-legend-swatch--empty" /> Empty</span>
            <span className="klimt-legend-item"><span className="klimt-legend-swatch klimt-legend-swatch--expired" /> Expired</span>
          </div>
        </section>
      )}

      {data.outcomeSummary.length > 0 && (
        <section className="klimt-stat-card">
          <h2 className="klimt-stat-heading">Outcome Summary</h2>
          <div ref={summaryRef} />
        </section>
      )}

      <section className="klimt-stat-card">
        <h2 className="klimt-stat-heading">Avg. Lead Time (days before match)</h2>
        <div ref={leadRef} />
      </section>

      <section className="klimt-stat-card">
        <h2 className="klimt-stat-heading">Friendly vs Competitive by Month</h2>
        <div ref={compRef} />
        <div className="klimt-legend">
          <span className="klimt-legend-item"><span className="klimt-legend-swatch klimt-legend-swatch--friendly" /> Friendly</span>
          <span className="klimt-legend-item"><span className="klimt-legend-swatch klimt-legend-swatch--competitive" /> Competitive</span>
        </div>
      </section>
    </>
  );
}
