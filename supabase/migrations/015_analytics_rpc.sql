-- Server-side analytics aggregation RPC
-- Returns ~3KB of pre-aggregated JSON instead of ~3MB of raw rows
CREATE OR REPLACE FUNCTION get_analytics(
  p_period text DEFAULT '30d',
  p_venues text[] DEFAULT '{}',
  p_outcomes text[] DEFAULT '{}',
  p_categories text[] DEFAULT '{}'
)
RETURNS jsonb
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_cutoff timestamptz;
  v_result jsonb;
BEGIN
  -- Calculate period cutoff
  v_cutoff := CASE p_period
    WHEN '30d' THEN now() - interval '30 days'
    WHEN '90d' THEN now() - interval '90 days'
    WHEN '6m'  THEN now() - interval '182 days'
    WHEN '1y'  THEN now() - interval '365 days'
    WHEN 'all' THEN '1970-01-01'::timestamptz
    ELSE now() - interval '30 days'
  END;

  WITH filtered AS (
    SELECT
      m.id,
      m.match_time,
      m.match_time AT TIME ZONE 'Europe/Berlin' AS match_time_berlin,
      m.venue,
      m.archive_reason,
      m.indoor,
      m.competition_mode,
      m.category,
      m.level_min,
      m.created_at
    FROM matches m
    WHERE m.match_time >= v_cutoff
      AND (cardinality(p_venues) = 0 OR m.venue = ANY(p_venues))
      AND (cardinality(p_outcomes) = 0 OR COALESCE(m.archive_reason, 'pending') = ANY(p_outcomes))
      AND (cardinality(p_categories) = 0 OR m.category = ANY(p_categories))
  ),

  -- KPI: total matches
  meta AS (
    SELECT
      count(*)::int AS total_matches,
      count(*) FILTER (WHERE archive_reason = 'filled')::int AS filled_count,
      min(match_time)::text AS earliest_date,
      max(match_time)::text AS latest_date
    FROM filtered
  ),

  -- KPI: overall fill rate (filled / total, excluding pending)
  fill_rate_kpi AS (
    SELECT
      CASE WHEN count(*) FILTER (WHERE archive_reason IS NOT NULL) > 0
        THEN round(
          count(*) FILTER (WHERE archive_reason = 'filled')::numeric /
          count(*) FILTER (WHERE archive_reason IS NOT NULL) * 100
        )::int
        ELSE 0
      END AS overall_fill_rate
    FROM filtered
  ),

  -- KPI: avg filled matches per week
  avg_per_week AS (
    SELECT
      CASE WHEN count(DISTINCT date_trunc('week', match_time)) FILTER (WHERE archive_reason = 'filled') > 0
        THEN round(
          count(*) FILTER (WHERE archive_reason = 'filled')::numeric /
          count(DISTINCT date_trunc('week', match_time)) FILTER (WHERE archive_reason = 'filled'),
          1
        )
        ELSE 0
      END AS avg_per_week
    FROM filtered
  ),

  -- KPI: top venue
  top_venue AS (
    SELECT venue AS top_venue
    FROM filtered
    WHERE venue IS NOT NULL
    GROUP BY venue
    ORDER BY count(*) DESC
    LIMIT 1
  ),

  -- Venue popularity
  venue_pop AS (
    SELECT jsonb_agg(row_to_json(t)::jsonb ORDER BY t.count DESC) AS data
    FROM (
      SELECT COALESCE(venue, 'Unknown') AS venue, count(*)::int AS count
      FROM filtered
      GROUP BY COALESCE(venue, 'Unknown')
    ) t
  ),

  -- Peak match times (Berlin timezone, Monday-first)
  weekday_vals(dow_num, weekday) AS (
    VALUES (0, 'Monday'), (1, 'Tuesday'), (2, 'Wednesday'),
           (3, 'Thursday'), (4, 'Friday'), (5, 'Saturday'), (6, 'Sunday')
  ),
  peak_raw AS (
    SELECT
      (EXTRACT(ISODOW FROM match_time_berlin)::int - 1) AS dow,
      CASE
        WHEN EXTRACT(HOUR FROM match_time_berlin) < 12 THEN 'morning'
        WHEN EXTRACT(HOUR FROM match_time_berlin) < 17 THEN 'afternoon'
        ELSE 'evening'
      END AS slot,
      count(*)::int AS cnt
    FROM filtered
    GROUP BY 1, 2
  ),
  peak_grid AS (
    SELECT
      w.weekday,
      jsonb_build_object(
        'morning', COALESCE(sum(cnt) FILTER (WHERE slot = 'morning'), 0)::int,
        'afternoon', COALESCE(sum(cnt) FILTER (WHERE slot = 'afternoon'), 0)::int,
        'evening', COALESCE(sum(cnt) FILTER (WHERE slot = 'evening'), 0)::int
      ) AS slots
    FROM weekday_vals w
    LEFT JOIN peak_raw p ON p.dow = w.dow_num
    GROUP BY w.dow_num, w.weekday
    ORDER BY w.dow_num
  ),
  peak_agg AS (
    SELECT jsonb_agg(jsonb_build_object('weekday', weekday, 'slots', slots)) AS data
    FROM peak_grid
  ),

  -- Level distribution
  level_dist AS (
    SELECT jsonb_agg(row_to_json(t)::jsonb ORDER BY t.label) AS data
    FROM (
      SELECT
        floor(level_min)::int || '-' || (floor(level_min)::int + 1) AS label,
        count(*)::int AS count
      FROM filtered
      WHERE level_min IS NOT NULL
      GROUP BY floor(level_min)
    ) t
  ),

  -- Fill rate by venue (confirmed players / total slots)
  fill_by_venue AS (
    SELECT jsonb_agg(row_to_json(t)::jsonb ORDER BY t.percentage DESC) AS data
    FROM (
      SELECT
        COALESCE(f.venue, 'Unknown') AS venue,
        round(
          count(*) FILTER (WHERE mp.status = 'confirmed')::numeric /
          NULLIF(count(*)::numeric, 0) * 100
        )::int AS percentage,
        count(*) FILTER (WHERE mp.status = 'confirmed')::int AS filled,
        count(*)::int AS total
      FROM filtered f
      JOIN match_players mp ON mp.match_id = f.id
      GROUP BY COALESCE(f.venue, 'Unknown')
    ) t
  ),

  -- Matches per week/month (auto-detect based on range)
  range_info AS (
    SELECT
      EXTRACT(EPOCH FROM (max(match_time) - min(match_time))) / (7 * 86400) AS range_weeks
    FROM filtered
  ),
  trend_data AS (
    SELECT jsonb_agg(row_to_json(t)::jsonb ORDER BY t.week) AS data
    FROM (
      SELECT
        CASE
          WHEN (SELECT range_weeks FROM range_info) > 16
          THEN to_char(date_trunc('month', match_time AT TIME ZONE 'UTC'), 'YYYY-MM')
          ELSE to_char(date_trunc('week', match_time AT TIME ZONE 'UTC'), 'YYYY-MM-DD')
        END AS week,
        count(*)::int AS count
      FROM filtered
      GROUP BY 1
      ORDER BY 1 DESC
      LIMIT 12
    ) t
  ),

  -- Outcome by month
  outcome_monthly AS (
    SELECT jsonb_agg(row_to_json(t)::jsonb ORDER BY t.month) AS data
    FROM (
      SELECT
        to_char(date_trunc('month', match_time AT TIME ZONE 'UTC'), 'YYYY-MM') AS month,
        count(*) FILTER (WHERE archive_reason = 'filled')::int AS filled,
        count(*) FILTER (WHERE archive_reason = 'canceled')::int AS canceled,
        count(*) FILTER (WHERE archive_reason = 'empty')::int AS empty,
        count(*) FILTER (WHERE archive_reason = 'expired')::int AS expired,
        count(*) FILTER (WHERE archive_reason = 'stale')::int AS stale,
        count(*) FILTER (WHERE archive_reason IS NULL)::int AS pending
      FROM filtered
      GROUP BY 1
    ) t
  ),

  -- Outcome summary
  outcome_summary AS (
    SELECT jsonb_agg(row_to_json(t)::jsonb ORDER BY t.count DESC) AS data
    FROM (
      SELECT
        COALESCE(archive_reason, 'pending') AS reason,
        count(*)::int AS count
      FROM filtered
      GROUP BY COALESCE(archive_reason, 'pending')
    ) t
  ),

  -- Average lead time
  lead_time AS (
    SELECT jsonb_agg(row_to_json(t)::jsonb ORDER BY t."avgDays" DESC) AS data
    FROM (
      SELECT
        COALESCE(venue, 'Unknown') AS venue,
        round(avg(EXTRACT(EPOCH FROM (match_time - created_at)) / 86400))::int AS "avgDays"
      FROM filtered
      GROUP BY COALESCE(venue, 'Unknown')
    ) t
  )

  SELECT jsonb_build_object(
    'totalMatches', (SELECT total_matches FROM meta),
    'filledCount', (SELECT filled_count FROM meta),
    'overallFillRate', (SELECT overall_fill_rate FROM fill_rate_kpi),
    'avgPerWeek', (SELECT avg_per_week FROM avg_per_week),
    'topVenue', (SELECT top_venue FROM top_venue),
    'earliestDate', (SELECT earliest_date FROM meta),
    'latestDate', (SELECT latest_date FROM meta),
    'venuePopularity', COALESCE((SELECT data FROM venue_pop), '[]'::jsonb),
    'peakMatchTimes', COALESCE((SELECT data FROM peak_agg), '[]'::jsonb),
    'levelDistribution', COALESCE((SELECT data FROM level_dist), '[]'::jsonb),
    'fillRate', COALESCE((SELECT data FROM fill_by_venue), '[]'::jsonb),
    'matchesPerWeek', COALESCE((SELECT data FROM trend_data), '[]'::jsonb),
    'outcomeByMonth', COALESCE((SELECT data FROM outcome_monthly), '[]'::jsonb),
    'outcomeSummary', COALESCE((SELECT data FROM outcome_summary), '[]'::jsonb),
    'averageLeadTime', COALESCE((SELECT data FROM lead_time), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;
