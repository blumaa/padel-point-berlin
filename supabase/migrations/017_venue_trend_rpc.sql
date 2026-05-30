-- Venue trend RPC: games per time bucket per venue
CREATE OR REPLACE FUNCTION get_venue_trend(
  p_period text DEFAULT '30d',
  p_granularity text DEFAULT 'week',
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
  v_cutoff := CASE p_period
    WHEN '30d' THEN now() - interval '30 days'
    WHEN '90d' THEN now() - interval '90 days'
    WHEN '6m'  THEN now() - interval '182 days'
    WHEN '1y'  THEN now() - interval '365 days'
    WHEN 'all' THEN '1970-01-01'::timestamptz
    ELSE now() - interval '30 days'
  END;

  WITH filtered AS (
    SELECT m.match_time, m.venue
    FROM matches m
    WHERE m.match_time >= v_cutoff
      AND (cardinality(p_venues) = 0 OR m.venue = ANY(p_venues))
      AND (cardinality(p_outcomes) = 0 OR COALESCE(m.archive_reason, 'pending') = ANY(p_outcomes))
      AND (cardinality(p_categories) = 0 OR m.category = ANY(p_categories))
  ),
  trend AS (
    SELECT
      CASE p_granularity
        WHEN 'day'   THEN to_char(date_trunc('day',   match_time AT TIME ZONE 'Europe/Berlin'), 'YYYY-MM-DD')
        WHEN 'week'  THEN to_char(date_trunc('week',  match_time AT TIME ZONE 'Europe/Berlin'), 'YYYY-MM-DD')
        WHEN 'month' THEN to_char(date_trunc('month', match_time AT TIME ZONE 'Europe/Berlin'), 'YYYY-MM')
        WHEN 'year'  THEN to_char(date_trunc('year',  match_time AT TIME ZONE 'Europe/Berlin'), 'YYYY')
        ELSE to_char(date_trunc('week', match_time AT TIME ZONE 'Europe/Berlin'), 'YYYY-MM-DD')
      END AS bucket,
      COALESCE(venue, 'Unknown') AS venue,
      count(*)::int AS count
    FROM filtered
    GROUP BY 1, 2
    ORDER BY 1, 2
  )
  SELECT jsonb_agg(row_to_json(t)::jsonb)
  FROM trend t
  INTO v_result;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;
