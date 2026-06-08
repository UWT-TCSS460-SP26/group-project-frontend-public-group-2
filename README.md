# TCSS 460 — Group 2 Consumer App (Sprint 6–8)

Front-end consumer app for the TCSS 460 course project. Built with Next.js 16
(App Router), NextAuth v5 (OIDC against Auth²), and MUI.

Signs visitors in through the Auth² instance, then renders search, browse, and
detail pages against our upstream partner's deployed API.

## Partners

### Upstream Partner: Group 1
We consume Group 1's deployed API. Values confirmed with Group 1 on 2026-05-21:
- API base URL: https://tcss460-team-1-api.onrender.com
- OpenAPI spec: https://tcss460-team-1-api.onrender.com/api-docs
- Bug Tracker FE: https://group-1-frontend.onrender.com/
- Audience string: `group-1-api`
- Partner README: received via course Discord (`#group-meet`)

### Downstream Partner: Group 3
Group 3 consumes Group 2's back-end deployment (Sprints 1–4).
We triage their bug reports through our Sprint 5 Bug Tracker FE.

## Local Development

1. Copy `.env.example` → `.env.local`
2. Fill in values:
   - `AUTH_SECRET` — generate with `npx auth secret` or `openssl rand -base64 33`
   - `AUTH_TCSS460_CLIENT_ID` / `AUTH_TCSS460_SECRET` — provided by the instructor
   - `AUTH_TCSS460_AUDIENCE` — Group 1's audience string (`group-1-api`)
   - `NEXT_PUBLIC_API_BASE_URL` — Group 1's deployed API URL
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the dev server:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

## Deployment

- Host: Vercel
- Deployed URL: https://tcss460-group-2-consumer.vercel.app
- OAuth callback path: `/api/auth/callback/tcss460`
- Localhost callback (for dev): `http://localhost:3000/api/auth/callback/tcss460`

Environment variables in Vercel must mirror `.env.local`, with `AUTH_URL` set to
the deployed URL (not localhost).

## Stack

- **Framework:** Next.js 16 (App Router)
- **Auth:** NextAuth v5 (Auth.js) with custom OIDC provider against Auth²
- **UI:** MUI + Emotion
- **Styling:** Tailwind CSS (optional, alongside MUI)
- **Hosting:** Vercel

## Sprint 6 Scope

Read-only consumer app:
- Sign in / sign out via Auth²
- Search Group 1's API
- Browse / popular page
- Movie/show detail page

## Sprint 7 Scope

The app stops being a browser for someone else's data and becomes a place
where users have a presence. Every authenticated write attaches the bearer
token from the NextAuth session.

- **Rate a title** — 5-star half-star widget on every detail page, mapped to
  Group 1's integer 0–10 score. Submit, change, or remove.
- **Review a title** — accessible MUI form (validated, focus-on-error,
  field-level server errors mapped from the Zod 400 envelope). On a 409 (the
  user already reviewed this title), the form flips into edit mode.
- **Community reviews** — the title's review list renders with **Edit /
  Delete** buttons on the user's own review.
- **`/profile` page** — every rating and review the signed-in user owns, with
  inline edit + delete on each row.
- **Signed-out gating** — every write affordance is replaced with an inert,
  accessible "Sign in to *do that*" prompt (`<SignInPrompt>`). No buttons that
  401 on click. The gate checks the bearer token, not just the user record.
- **Design cohesion pass** — shared `<SectionHeading>`, unified error
  rendering (MUI `<Alert>`), consistent button sizing across feature rows.
  Intentional, not final polish (that's Sprint 8).

### Architecture

Writes go through **Server Actions** ([src/lib/actions/](src/lib/actions/)) —
not raw client fetches. Each action wraps `fetchGroupOneApi`
([src/lib/api.ts](src/lib/api.ts)) which handles the bearer token, 204
no-body responses, and parses both of Group 1's error envelopes into a
typed `ApiError { status, message, detail?, fieldErrors? }`. Actions return
an `ActionResult<T>` envelope (`{ ok: true; data } | { ok: false; error }`)
so structured error fields survive the server-action → client boundary —
thrown errors get sanitized by Next.js. After a successful mutation the
client calls `useRouter().refresh()` and the server-rendered detail page
re-fetches its enriched aggregate (`cache: "no-store"`).

### Where to look

- Server Actions: [src/lib/actions/](src/lib/actions/)
- Write contract & quirks: [docs/group-1-write-api.md](docs/group-1-write-api.md)
- Components + patterns (Server Actions, signed-out gating, error mapping):
  [docs/components.md](docs/components.md)
- Detail page integration: [src/app/title/[id]/page.tsx](src/app/title/[id]/page.tsx)
- Profile page: [src/app/profile/page.tsx](src/app/profile/page.tsx)

## Sprint 8 Scope — "Ship It"

The final sprint is a craft pass: a distinctive visual identity, smooth motion,
the invented feature, TV made first-class, accessibility, and the ship gate.

- **Visual identity — "Repertory, evolved":** one warm editorial-cinema system on
  every route. Deep-emerald accent, oversized Fraunces display + IBM Plex Mono
  meta, film-grain overlay, full-bleed imagery with scrims. Both **dark
  (cinema, default)** and **light (gallery)** ship from a single MUI `colorSchemes`
  CSS-variables theme ([src/theme.ts](src/theme.ts)) with a **no-flash** toggle
  (`InitColorSchemeScript`). The dev-only [`/styleguide`](src/app/styleguide/page.tsx)
  shows every token + component in both modes.
- **Invented feature — Watchlist:** device-local (`localStorage`), works
  signed-out, syncs across tabs, badge in the header. Rationale in
  [docs/meetings.md](docs/meetings.md). See [src/lib/watchlist.ts](src/lib/watchlist.ts).
- **New pages:** `/browse` (Movies/TV tabs), `/watchlist`, `/compare`, `/about`,
  and a branded `not-found`. `/search` rewritten with a Movies/TV toggle and
  advanced filters (genre, year range, min rating, sort).
- **TV first-class:** a TV tab in Browse, a TV toggle in Search, an "On TV now"
  rail on home, and TV-aware detail pages (mono "TV" tag throughout).
- **Motion (60fps contract):** `transform`/`opacity` only — staggered reveals,
  skeleton shimmer, a pausable marquee, a route cross-fade, and a shared-element
  poster morph (View Transitions API). Reduced motion is honored.
- **Post-MVP features:** ⌘K command palette, recently-viewed rail, `/compare`
  view, advanced search filters, sharing, and shared-element poster transitions.
  Per-title poster-derived color was explored but intentionally left out of the
  final scope.
- **Accessibility:** one `<main>` + skip link, labeled forms, visible emerald
  focus ring, AA contrast in both modes, `next/image` + real `alt` everywhere.
- **Ship gate:** deployed on Vercel (URL above) and reachable; Lighthouse
  before/after + the top a11y/perf fixes are recorded in
  [docs/lighthouse/](docs/lighthouse/).

## Team

Across the quarter the four of us built **both halves** of the same product:
the REST API in Sprints 1–4, then this consumer front-end in Sprints 5–8.

| Member | Back-end work (Sprints 1–4) | Front-end work (Sprints 5–8) |
| --- | --- | --- |
| Rudolf | API architecture, TMDB foundation, movie details, route versioning and validation, Auth²/JWKS and user mapping, Prisma/auth contracts, community summaries, issue-admin routes, CI, integration, deployment, and release docs | Product/UI lead; app scaffold, Auth² and API layer, design system and visual direction, shared components, watchlist foundation, motion/accessibility, write integration, testing, Lighthouse/deployment, and the final UI/UX redesign and polish across home, browse, search, compare, title, profile, About, navigation, and mobile |
| Collins | Movie search/popular, auth setup, issue reporting, personal ratings, ratings tests/docs, and OpenAPI audits | Rating control, browse, movie/TV search, filters/sorting, TV discovery, watchlist page, and compare |
| Mani | TV search/popular, ratings and reviews CRUD, parsing helpers, enriched movie/community work, and personal reviews | Profile foundation, editorial home data, hero/rails/marquee, command palette, and recently viewed |
| Jonathan | TV details, mutation/auth coverage, API documentation, issue-admin tests, and author-surface consistency | Title detail foundation, review form/list, About, branded 404, and profile polish |

The lanes above record original feature ownership. Rudolf also performed the
cross-app integration and final design pass that established most of the
shipped interface's visual composition and interaction polish.

## References

- [Sprint 6 spec](docs/sprint-6.md) (in the course site)
- TCSS460-frontend-2 lecture demo — the reference app this project mirrors
