<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project conventions (Safety Explorer)

**Architecture.** Feature-based, not layer-based: each feature lives at
`src/lib/<feature>/{types.ts, model.ts, repository.ts}` (types, Mongoose model, data access),
`src/app/<feature>/{page.tsx, actions.ts}` (route + Server Actions) and
`src/components/<feature>/` (its UI). No passthrough service layer — pages and Server Actions call
the repository directly. Business logic that actually exists gets its own named module in the
feature folder, next to the repository (the "service" role): e.g. `aviation-news/filters.ts`
(URL → filter), `dashboard/dashboard.ts` (loads) + `dashboard/aggregations.ts` (calculates),
`isit-classification/{jobs,review,pipeline}.ts` (with the per-record classify decisions in
`classify-run.ts`). Keep calculations pure (no DB access) so they
can be unit-tested; do the I/O in a thin function that calls them.

**Repositories.** The only files that touch Mongoose/MongoDB. Name functions by intent
(`findActive()`, `countFetchedSince(date)`, `countPublishedSince(date, severities)`) — never
accept raw query objects or DB field names from callers, so Mongo operators and field names stay
inside. Collection names are constants on the model (`AVIATION_NEWS_COLLECTION`), not string
literals elsewhere. Exception on purpose: `isit-classification/repository.ts` `ensurePending`
re-checks `decideScope` before writing — it is the only writer of new ISIT records into the DB
shared with n8n, so keep that guard there even though callers filter first.

**Types.** Everything a feature exposes — including query result shapes like `AirlineCount` or
`SourceActivity` — lives in its `types.ts`; components import types from there, never from
`repository.ts`. Display labels sit next to their value list (`SEVERITY_LABELS`,
`OUTCOME_LABELS`, `WORKFLOW_STATUS_LABELS`). Check untrusted strings (query params, form fields)
against a value list with `isOneOf()` from `src/lib/shared/guards.ts` instead of
`includes()` + `as T`. Read `IsitSuggestion.stages` only through `readStages()`
(`isit-classification/stages.ts`), the one place its shape is asserted.

**Dates.** All displayed dates show the day only ("Sep 30, 2026"), through exactly two
functions in `src/lib/shared/format-date.ts`: `formatDate` (local time zone — the server's for
Server Components) and `formatDateUtc`. Don't add per-file `toLocaleString` formatters or time
formats; the caller decides what to show for a missing date ("—", "never"). Exception:
`isit-classification/llm/prompts.ts` has its own formatter — it builds model input, changing it
changes AI results.

**Pages and components.** A page loads data and lays out sections; each section is a named
component in `src/components/<feature>/` (e.g. `RecordCard`, `AiSuggestionCard`, `ChartCard`,
`NewsDetailCard`). Repeated UI becomes one component with a small variant prop rather than copies
(`AircraftTags size="sm" | "md"`, `TopicTags max={3}`). Don't create generic "universal"
components.

**Naming.** Folders under `src/lib/` and `src/app/` are kebab-case (`aviation-news`,
`isit-taxonomy`, `isit-classification`) even where the MongoDB collection name is snake_case
(`aviation_news`, etc. — that's the real, already-populated collection name; never rename it).

**Database.** `MONGODB_URI` points at a real, already-populated MongoDB Atlas cluster shared
with an existing n8n automation (database `n8n`). This is not seed/placeholder data — collections
may have fields beyond what a given Mongoose schema declares. Before assuming a field's shape or
enum values, check the live data (a quick `db.collection(...).distinct(...)` or `.findOne({})`)
rather than guessing. Past mistakes from guessing instead of checking: `sources.type` is a feed
format (`rss`/`json`), not an org category; `severity` is stored **uppercase** with 5 values
(`INFO`/`LOW`/`MEDIUM`/`HIGH`/`CRITICAL`), not lowercase/4-value.

**Auth.** Server Actions currently have no authentication/authorization checks — deliberate,
this is treated as an internal-only tool for now. Add auth guards before any public/production
deployment (Next.js docs: Server Actions are reachable via direct POST regardless of UI).

**UI system.** shadcn is on the `base-nova` style (`@base-ui/react`, not classic Radix) — use
the `render` prop for polymorphism (not `asChild`), and pass `nativeButton={false}` on any
`Button` rendered as a non-`<button>` (e.g. `render={<Link .../>}`). Use existing theme tokens
(`bg-card`, `text-muted-foreground`, `border-border`, etc.), never hardcode hex — except severity
colors, which are a deliberate fixed status palette (`src/lib/shared/severity-colors.ts` +
`SEVERITY_DOT_COLOR`) reused identically across badges and charts.

**Navigation buttons.** "Back to …" and "Details" / "View details" navigation is always a real
button, never a plain text link — users must see at a glance where to click. Use `BackButton` and
`DetailsButton` from `src/components/nav-buttons.tsx` (primary/orange `Button` rendered as a
`Link`, arrow icon, `size` `sm` by default, `xs` inside compact boxes); don't hand-roll
`<Link className="… hover:underline">` for these. Links to other sites (source article, original
post) use `ExternalButton` from the same file: outlined, external-link icon, opens in a new tab.
Secondary in-app links sitting next to a primary one (e.g. "Review guide" beside "Back to …") are
`variant="outline"` buttons, so only one orange button competes for attention.

**Filtering.** List pages filter via URL `searchParams`, not client-side state — see
`src/components/aviation-news/filter-form.tsx`. Turning the URL into a repository filter is
`parseAviationNewsFilter()` in `src/lib/aviation-news/filters.ts`, which also holds the option
lists shared with the UI (`DATE_RANGES`, the `ALL` "no filter" sentinel). Every filter Select is
a `FilterSelect` (`src/components/aviation-news/filter-select.tsx`) — stand-alone
(`value` + `onValueChange`, navigates at once) in the toolbar, or a form field (`name` +
`defaultValue`) in the filter form — fed by the option builders in `filter-options.ts`. Forms use native `method="GET"` for progressive
enhancement, with `onSubmit` intercepted via `router.push()` so the transition goes through the
client router (needed for `loading.tsx` to show). An uncontrolled form re-synced from
`searchParams` needs `key={JSON.stringify(searchParams)}` to remount on filter change, or
`defaultChecked`/`defaultValue` silently go stale.

**Loading states.** Every route with async data fetching has a matching `loading.tsx` skeleton
(`src/app/loading.tsx`, `src/app/sources/loading.tsx`, `src/app/aviation-news/loading.tsx`,
`src/app/aviation-news/[id]/loading.tsx`, `src/app/isit-review/loading.tsx`,
`src/app/isit-review/[id]/loading.tsx`) — add one for any new route in the same pattern.

**ISIT taxonomy.** File-based, not a collection: versioned JSON in `data/isit/<version>/`
(generated by `data/isit/build_isit_json.py`), loaded server-side via `loadIsitTaxonomy()` in
`src/lib/isit-taxonomy/taxonomy.ts`. Never place it under `public/` (it would be served) and
never import it into Client Components (~1.3 MB). Resolve parents via `parentCode`/`ancestors()`,
never string prefixes (8- and 9-digit codes collide). A code's dimension comes from its level-2
branch.

**CLI scripts.** `scripts/isit-*.ts` (run via `npm run isit:*`) are thin wrappers around
`src/lib/isit-classification/jobs.ts`; they default to a dry run and write only with `--write`.
Each ends with `runScript(main)` from `scripts/run-script.ts` (error → exit code 1, always closes
the DB connection) — don't import `mongoose` in scripts.

**Tests and verification.** `npm test` (node:test + tsx) runs every `src/**/*.test.ts`; tests sit
next to the module they cover. Pure logic in `src/lib/` gets tests; before moving or reshaping
untested logic, first pin its current behavior with characterization tests, then refactor.
There is no `typecheck` script — use `npx tsc --noEmit`. A change is verified by
`npx tsc --noEmit && npm run lint && npm test && npm run build`. Because the database is the live
shared one, verify against it only by reading (page loads, `/api/isit/run` with
`{"dryRun": true}`, scripts without `--write`) — never by submitting forms, running Server
Actions or `isit:batch`.
