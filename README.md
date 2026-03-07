# Padel Point Berlin

A mobile-first dashboard that aggregates open padel matches across Berlin into one place. No more scrolling through WhatsApp groups or checking Playtomic venue by venue.

## How It Works

Two data sources feed into one unified match list:

1. **Playtomic API** - A cron job polls every Berlin venue twice a day, pulling all open matches with real-time player counts, levels, and court info.
2. **WhatsApp Listener** - A background process watches padel community groups for shared match links. When someone posts a match, it gets parsed and added to the dashboard.

Both sources upsert by `playtomic_id`, so you never see duplicates. Private (HIDDEN) matches only appear if someone explicitly shared them in a WhatsApp group.

## Getting Started

```bash
bun install
cp .env.example .env.local   # fill in Supabase credentials
bun dev                   # http://localhost:3000
```

## Scripts

| Command | Description |
|---------|-------------|
| `bun dev` | Start the dev server |
| `bun test` | Run all tests (236) |
| `bun run build` | Production build + type check |
| `bun run lint` | ESLint |
| `bun run listener` | Start the WhatsApp listener (needs QR scan on first run) |
| `bun run replay` | Re-parse all stored WhatsApp messages through the current parser |

## Project Structure

```
src/
  app/                    Next.js App Router (pages + API routes)
  components/             React components (MatchCard, filters, drawer, etc.)
  lib/
    db/                   Supabase CRUD (matches, raw messages, poll status)
    parser/               Pure functions that parse WhatsApp messages
    playtomic/            Playtomic API client + poll/cleanup logic
    supabase/             Supabase client factories (browser, SSR, admin)
    types.ts              Shared TypeScript types

listener/                 WhatsApp listener (separate Node process)
  index.ts                whatsapp-web.js client setup
  handler.ts              Message pipeline: store -> parse -> upsert
  replay.ts               Batch re-process all stored messages

supabase/migrations/      SQL migrations (applied via Supabase SQL Editor)
__tests__/                Jest test suite
```

## Tech Stack

- **Next.js 15** (App Router, TypeScript, Tailwind CSS)
- **Supabase** (PostgreSQL + PostgREST)
- **whatsapp-web.js** (headless Chrome WhatsApp Web client)
- **Vercel** (hosting + cron)
- **Jest** (testing)

## Contributing

1. Create a feature branch from `main`
2. Make sure `bun run lint`, `bun test`, and `bun run build` all pass
3. Open a PR

The parser lives in `src/lib/parser/` and is all pure functions with no I/O - easy to test and extend. If you're adding a new venue, update the alias table in `src/lib/parser/normalizeVenue.ts`.
