<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project conventions (Safety Explorer)

**Architecture.** No service layer — pages and Server Actions call the repository directly.
Each feature lives at `src/lib/<feature>/{types.ts, model.ts, repository.ts}` (Mongoose model +
data access) and `src/app/<feature>/{page.tsx, actions.ts}` (route + Server Actions). Don't
reintroduce a passthrough service layer between them.

**Naming.** Folders under `src/lib/` and `src/app/` are kebab-case (`aviation-news`,
`isit-taxonomy`, `recipient-groups`) even where the MongoDB collection name is snake_case
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

**Filtering.** List pages filter via URL `searchParams`, not client-side state — see
`src/components/aviation-news/filter-form.tsx`. Forms use native `method="GET"` for progressive
enhancement, with `onSubmit` intercepted via `router.push()` so the transition goes through the
client router (needed for `loading.tsx` to show). An uncontrolled form re-synced from
`searchParams` needs `key={JSON.stringify(searchParams)}` to remount on filter change, or
`defaultChecked`/`defaultValue` silently go stale.

**Loading states.** Every route with async data fetching has a matching `loading.tsx` skeleton
(`src/app/loading.tsx`, `src/app/sources/loading.tsx`, `src/app/aviation-news/loading.tsx`,
`src/app/aviation-news/[id]/loading.tsx`) — add one for any new route in the same pattern.
