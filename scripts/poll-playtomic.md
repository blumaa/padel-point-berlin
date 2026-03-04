# Poll Playtomic — Agent Instructions

Run this three times a day: morning (7am Berlin), afternoon (1pm Berlin), evening (7pm Berlin).

## Command

```bash
curl -s -H "Authorization: Bearer $CRON_SECRET" https://<PRODUCTION_URL>/api/poll-playtomic
```

Replace `<PRODUCTION_URL>` with the live Vercel deployment URL (e.g. `padel-point-berlin.vercel.app`).
`CRON_SECRET` is in `.env.local`.

## Expected response

```json
{ "ok": true, "upserted": <N>, "errors": [] }
```

- `upserted` — number of matches fetched and saved (typically 1000–2000)
- `errors` — list of venues that failed; non-empty is worth logging but non-fatal

## What it does

1. Fetches all active padel venues within 30km of Berlin center from the Playtomic API
2. For each venue, fetches open matches for the next 14 days
3. Filters out empty courts (0 confirmed players) and full matches
4. Upserts into Supabase `matches` table (deduplicates on `playtomic_id`)
