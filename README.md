# Spheres of Influence

A single-user app for a Factory strategic enterprise AE: influence-aware org charts for
10,000-person enterprises. LinkedIn/Evaboot data in; accounts, orgs, live tenure and a
curated influence map out.

## Stack

- Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind 4 + shadcn (Base UI)
- Supabase (Postgres with RLS on every table, Auth magic links, Storage for avatars)
- Tiptap for rich text; Lucide icons; Sonner for toasts; Zod for action validation
- Vitest + PGlite for schema and logic tests

## Setup

1. **Supabase project** — create a project named `Spheres-of-Influence` (any region).
   If the Factory Supabase connector has write access, Droid can create it and apply
   the migration for you; otherwise create it in the dashboard.
2. **Apply the schema** — run `supabase/migrations/20261007000001_core.sql` in the
   project's SQL editor (or `supabase link --project-ref <ref> && supabase db push`).
   It creates every table, the boolean-search functions, triggers, RLS policies, and
   the `avatars`/`uploads` storage buckets.
3. **Environment** — copy `.env.local.example` to `.env.local` and fill in:

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | the project's publishable/anon key |
   | `ALLOWED_EMAILS` | comma-separated; empty allows any email (dev only) |

   Later phases: `ANTHROPIC_API_KEY`, `SUMBLE_API_KEY`, `EVABOOT_API_KEY`, `MAPBOX_TOKEN`.
4. **Run it**:

   ```bash
   npm install
   npm run dev     # http://localhost:3000
   npm test        # unit + PGlite schema tests
   npm run build   # production build
   ```

5. **Sign in** — enter your email on the login page; the magic link opens the app.
   Defaults (fields, style rules, prompts) seed themselves on first login and are
   editable in Admin without ever being overwritten.

## Import pipeline

Bring an Evaboot CSV to `Import → Choose CSV`:

- Accounts are found or created from company columns (domain → LinkedIn ID → name),
  filling only blank columns on existing accounts.
- Rows match existing contacts by LinkedIn ID, then email; same-name/no-ID rows go to
  a review queue where you pick the right person or create fresh.
- Every field change shows as a diff with a checkbox. Blank CSV values never erase
  stored data; your emails are kept unless you accept the new one. Accepting a company
  change marks the stored contact "No Longer at Company".
- Photos download into Supabase Storage; locations geocode via Photon (cached).
- The export date is read from the file name (e.g. `amex_leads_10_7_2026.csv`), so
  "2 years, 3 months in role" stays live instead of going stale.

A realistic sample lives at `sample-data/amex_leads_10_7_2026.csv` (American Express,
43 rows, regenerate with `node scripts/generate-amex-sample.mjs`). It covers
duplicates, mojibake bullets, all email statuses, and five change agents.

Import that one first, then `sample-data/amex_leads_10_7_2026_reexport.csv`
(regenerate with `node scripts/generate-amex-update.mjs`). It re-exports the same people
with one promotion, one new work email and one move to another company, plus a new hire,
so the diff and review screens have real work to do: three rows need your call, one is new,
and everyone else is left untouched.

## Where things live

| Path | What |
|---|---|
| `supabase/migrations/` | Schema: tables, search, triggers, RLS, storage |
| `src/lib/search/` | Boolean query parser (client AST → SQL compiler) |
| `src/lib/import/` | Evaboot row mapping, matching, diffing |
| `src/lib/tenure.ts` | Live tenure from import-time start dates |
| `src/app/(app)/contacts/` | Search, facets, bulk actions, profiles, CSV export |
| `src/app/(app)/accounts/` | Subsidiaries, orgs, the three whys, notes |
| `src/app/(app)/import/` | Upload, review, apply |
| `src/app/(app)/admin/` | Fields, picklists, style rules, prompts + models |

## Phases

1. **Core (done)** — schema, auth, contacts, accounts/orgs, tags, import, admin, home.
2. Canvas (React Flow) — org charts styled by rules, influence edges.
3. AI (Claude) + Sumble enrichment + research docs + in-app assistant.
4. Map (Mapbox), Evaboot API direct import, Vercel deploy.


<!-- Trigger deployment -->
