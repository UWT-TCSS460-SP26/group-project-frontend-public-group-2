# Team Meetings — Group 2 Consumer App

Sprint 6 (5/18 – 5/24, 2026).

Team: Rudolf, Collins, Mani, Jonathan.

---

## Sprint 6 Planning — Tue 5/19

**Goals set:**
- Make first contact with Group 1 (upstream partner) and confirm their API base
  URL, OpenAPI spec, audience string, and Bug Tracker FE.
- Request consumer-client credentials from the instructor before the 5/21
  Thursday hard deadline.
- Land the four read-only pages defined in the sprint: sign-in/out, search,
  popular, and detail.

**Task assignments:**
- **Rudolf** — repo scaffold (Next.js 16 + NextAuth v5 + MUI), Auth² OIDC
  wiring, shared design-system components, partner-info README, env scaffolding.
- **Mani** — `/` home page: wire `PopularGrid` to Group 1's `/movies/popular`,
  add a search bar form posting to `/search`.
- **Collins** — `/search` page: query-param-driven search against Group 1's
  `/movies/search`, render with `MovieCard`.
- **Jonathan** — `/title/[id]` detail page: render Group 1's
  `/details/{type}/{id}/enriched` payload (poster, synopsis, runtime,
  release date, community rating, recent reviews); no write affordances.

**No write affordances this sprint** — ratings and reviews come in Sprint 7.

---

## Mid-sprint sync — Thu 5/21

- Credentials request sent to the instructor (Discord) ahead of the 11:59 PM
  cutoff; `clientId` / `clientSecret` received and recorded in `.env.local`.
- Group 1 contact confirmed; their info recorded in `README.md` (base URL,
  OpenAPI, Bug Tracker FE, audience `group-1-api`).
- Scaffold + auth merged; teammates unblocked to start their pages.

---

## Cross-group bug triage — Sat 5/23 (Discord, late)

- Jonathan flagged that the detail page wasn't getting data back. Quick
  diagnosis showed Group 1's `/details/{type}/{id}/enriched` was returning
  HTTP 200 with a TMDB error body (`status_code: 7 — Invalid API key`)
  instead of movie data.
- Confirmed scope: Group 1's other TMDB-backed routes (`/movies/{id}`,
  `/movies/popular`, `/tv/{id}/details`) worked fine — bug was isolated to
  the enriched route's TMDB call.
- Filed a structured bug in Group 1's Bug Tracker FE and pinged them on
  Discord with the diagnostic curl output. Sprint 6 deliverable #11 (cross-
  group bug filed) satisfied.
- Jonathan landed his detail page against the broken response so the UI
  wouldn't render "Untitled" — temporary defensive warning banner added
  while we waited for Group 1's fix.

---

## End-of-sprint integration — Sun 5/24

- Group 1 confirmed their TMDB fix shipped (their enriched handler was
  reading the wrong env var name).
- Re-tested the detail page against live data; uncovered a second issue —
  because Group 1's enriched endpoint returns HTTP 200 even when the id
  doesn't match the media type, the movie→TV fallback in `fetchDetail`
  never fired and TV ids (e.g., Game of Thrones) rendered as "Untitled".
  Fixed by inspecting the `tmdb` body before treating the response as a
  hit. Dropped the now-stale warning banner.
- Merge work:
  - PR #16 (Collins's search + Jonathan's detail page) merged into `dev`.
  - PR #17 (Mani's home/popular wiring) had been opened against `main` by
    mistake; merged `origin/main` into `dev` to unify. Resolved one
    `src/types/media.ts` conflict in favor of the OpenAPI-reconciled
    shape and simplified Mani's `toMovie` mapper since Group 1's response
    already matches that shape.
- One-time JWT verification done — access token from a local sign-in
  decoded cleanly at jwt.io with `iss = https://tcss-460-iam.onrender.com`
  and `aud = group-1-api`.

---

## Sprint 6 retrospective

**What went well**
- Auth flow worked first try once the `client_secret_post` token endpoint
  auth method was specified — Auth²'s discovery document was clear about
  not supporting basic.
- Splitting the four pages across four teammates worked cleanly because
  the shared design-system components (`PageContainer`, `PageTitle`,
  `MovieCard`, state components) were in place before page work started.
- Filing the TMDB bug through Group 1's Bug Tracker FE (instead of just
  Discord) gave them a structured handoff and got a fast turnaround.

**What hurt**
- PR #17 was opened against `main` instead of `dev`, leaving the two
  branches diverged for a day. Caught and reconciled during end-of-sprint
  integration, but cost ~15 min of merge work that wouldn't have happened
  if the base branch had been checked.
- Group 1's enriched endpoint returning 200-with-error-body (instead of a
  4xx) broke our assumption that `fetch.ok` was enough to detect failure.
  Lesson for Sprint 7 when we start hitting more enriched routes: always
  inspect the response body for upstream-error envelopes, not just HTTP.

**Carryover into Sprint 7**
- Wire write affordances on the detail page (rating + review) against
  Group 1's authenticated routes.
- Cover the `/tv/popular` browse surface in addition to movies.

---

Sprint 7 (5/25 – 5/31, 2026).

Team: Rudolf, Collins, Mani, Jonathan.

---

## Sprint 7 Planning — Tue 5/26

**Goal:** stop being a read-only browser; let signed-in users rate, review,
edit, delete, and see everything they own on a profile page. Keep signed-out
visitors out of trouble (no buttons that 401).

**Split (4/2/2/2 — Rudolf takes the hardest + all the docs):**

- **Rudolf — R1/R2/R3/R4.**
  - R1: write-capable API client (POST/PUT/DELETE, 204 handling, typed
    `ApiError` parsing both error envelopes), shared types, all ratings /
    reviews Server Actions returning an `ActionResult<T>` envelope (so
    structured errors survive the server-action → client boundary),
    `syncSubjectId` on first sign-in, plus `<SignInPrompt>` and
    `<ConfirmDialog>` shared primitives and `SessionProvider` in providers.
  - R2: detail-page write integration — gate on the access token, mount the
    rating control + review form, refetch the enriched payload after
    `router.refresh()` (`cache: "no-store"`). Stub Collins's / Jonathan's
    components so the page is mergeable independently of them.
  - R3: design-cohesion pass across all views + `/profile` link in the
    Header.
  - R4: README Sprint 7 scope, `docs/components.md` updates,
    `docs/group-1-write-api.md` (new contract reference), and these minutes.
- **Collins — C1 + C2.** `<RatingControl>` end-to-end: 5-star half-star
  widget (mapped 0–10), submit / change / remove, signed-out gating, error
  states.
- **Jonathan — J1 + J2.** `<ReviewForm>` (validation, accessibility,
  field-error mapping, 409 → edit) + `<ReviewList>` with own-review edit /
  delete.
- **Mani — M1 + M2.** `/profile` route with both lists (ratings enriched via
  `/ratings/me/items`, reviews thin via `/reviews/me`) + inline edit / delete.

**Dependency rule we agreed on:** R1 lands first and is the *only* thing the
three feature owners depend on. They do not import from each other — they
share the Server Actions and primitives, not the components. This was the
explicit fix for the friction we saw in Sprint 6.

---

## Mid-sprint sync — Wed 5/28

- R1 was merged (PR #29). Collins, Jonathan, and Mani started in parallel.
- R2 (with stub `RatingControl` / `ReviewForm` components) was merged (PR
  #30) so the team had a working detail-page mount point and a prop contract
  to implement against.
- No bugs filed against Group 1 — every write route behaved per their
  OpenAPI spec, including the 409 dedupe path on `POST /reviews`.

---

## End-of-sprint integration — Sun 5/31

- All six teammate PRs merged into `dev`: PR #31 (Jonathan), PR #32
  (Collins), PR #33 (Mani).
- Jonathan went past the minimum: in addition to the form, he shipped a
  `<ReviewList>` plus a `ReviewsProvider` context so an Edit click on the
  list populates the form below, and a delete in the list resets the form.
  R2 wasn't actually complete until the detail page mounted `<ReviewList>`
  inside the provider — the page had still been rendering the Sprint-6
  inline review block until that change landed (commit `b0fc6a6`).
- Two small fixes caught during the integration audit:
  - Collins's `RatingControl` had a React 19 `react-hooks/set-state-in-effect`
    lint error from `setLoadingExisting(true)` inside `useEffect`. Initialized
    the state as `true` instead so we don't flash an empty form during the
    existing-rating lookup.
  - Mani's profile fetched `/reviews/me` with `limit: 100`, but Group 1
    caps that at `50`. Lowered to `50` to stay within the contract.
- Hardened a separate (pre-existing) Sprint-6 issue while we owned the
  detail page: a real outage on the enriched fetch had been silently
  rendering "Title not found". The fallback now surfaces a real error when
  both `movie` and `tv` attempts actually error (as opposed to a clean
  TMDB miss).
- Gated the home page's "Dev: access token" debug block to development
  builds only (`process.env.NODE_ENV !== "production"`) so a bearer token
  never leaks into server-rendered HTML on Vercel.

### R3 design-cohesion decisions

Deliberate, intentional choices — not final polish (that's Sprint 8):

- Added a shared `<SectionHeading>` so the detail page (`Your rating`,
  `Community`, `Write a review`) and the profile (`Your ratings`,
  `Your reviews`) share one visual tier — h2, responsive 1.4 / 1.75 rem.
- Removed the redundant `fontFamily: "var(--font-fraunces), serif"` we'd
  been sprinkling on `<Typography variant="h*">`. The theme already applies
  Fraunces to every heading; the overrides were noise.
- Standardized inline error rendering on MUI `<Alert severity="error" role="alert">`.
  `RatingControl` was the outlier (plain `<Typography color="error">`) and
  now matches `ReviewForm` / `ReviewList` / the profile rows.
- Dropped the duplicate "Your rating" overline from inside `RatingControl`
  — the parent section heading already says it.
- Header `/profile` link only renders for signed-in users. Signed-out
  visitors get a sign-in CTA on the profile page itself if they navigate
  there directly.
- **Kept** the section-spacing pattern split between the detail page
  (top-divider + `mt: 6, pt: 3`) and the profile (gap-based grid + chip
  counts). Both are intentional for their context.

---

## Sprint 7 retrospective

**What went well**
- The "share the *data layer*, not the *UI components*" decision held up
  exactly as planned — Collins, Jonathan, and Mani never blocked each
  other once R1 merged, only depended on `src/lib/actions/*` + the shared
  primitives. The three feature PRs landed in parallel with no
  cross-component conflicts.
- The `ActionResult<T>` envelope was worth the up-front design. Jonathan's
  field-level Zod 400 mapping in `ReviewForm` only works because the
  `fieldErrors` object survives the server-action → client boundary —
  if R1 had thrown an `ApiError` instead, those fields would have been
  stripped to a generic message and the form would have had nothing to
  map onto.
- `useRouter().refresh()` + `cache: "no-store"` on the enriched fetch was
  the simplest reflect-after-submit mechanism that worked. No optimistic
  reconciliation logic required.

**What hurt**
- R2 looked done when it merged, but Jonathan's `<ReviewList>` /
  `ReviewsProvider` arrived *after*, and the detail page kept rendering
  the Sprint-6 inline review block until R2 was completed in a follow-up
  commit. Worth flagging next sprint: when "feature owners deliver
  components, integrator wires them" is the pattern, the integration
  has to land *after* the components, not before.
- The dev-only access-token block had been in `src/app/page.tsx` since
  Sprint 6 and was rendering the bearer token into server-rendered HTML in
  every environment. Caught it by code review during R3, not earlier.

**Carryover into Sprint 8**
- Deploy + responsive design pass (Sprint 8's whole charter).
- Deeper UX/UI dive — mobile breakpoints on every view, focus indicators,
  loading skeletons, the `Synopsis` sub-heading on the detail page,
  consistent date formatting across `ReviewList` and the profile rows
  (one uses `toLocaleDateString`, the other `Intl.DateTimeFormat`).
- Consider expanding `<EmptyState>` / `<LoadingState>` / `<ErrorState>`
  with an inline variant so components can reuse them instead of rolling
  their own `<CircularProgress>` / `<Alert>` each time.

---

Sprint 8 (6/1 – 6/7, 2026) — "Ship It".

Team: Rudolf, Collins, Mani, Jonathan.

---

## Sprint 8 Planning — Mon 6/1

**Goal:** finish the quarter with the best-*looking*, best-*feeling* app in the
class. Look / UI / UX is the top priority. Concretely: a distinctive visual
identity ("Repertory, evolved" — warm editorial cinema, deep-emerald accent,
light gallery default + dark cinema), buttery 60fps motion, every required page,
the invented feature (Watchlist), TV made first-class, accessibility AA in both
modes, and the required deploy + Lighthouse + docs deliverables.

**Dependency rule (same as Sprint 7, sharpened):** everyone depends only on
**Rudolf's foundation (M0)** — the theme tokens + shared component prop
contracts — never on each other. Once the foundation + `/styleguide` reference
land, the three page lanes run fully in parallel on disjoint files.

**Lane split (Rudolf carries the heaviest load by request):**

- **Rudolf — Lane 0 (foundation + ship + 1 feature).** `theme.ts` rewrite to
  MUI's `colorSchemes` CSS-vars API (emerald light+dark, full token set, mono
  font); the app shell (no-flash `InitColorSchemeScript` toggle, `<main>` +
  skip link landmarks, `<GrainOverlay>`, `template.tsx` cross-fade); `next/image`
  foundation; the core component vocabulary (`Rail`, evolved `MovieCard`,
  `StatBadge`, `Marquee`, `Numeral`, skeletons, `Header` redesign with active
  state + ⌘K slot + watchlist badge, `Footer`); the **Watchlist context +
  button** (the shared feature primitive); the motion system + View-Transitions
  plumbing; the dev-only `/styleguide`; deploy + Lighthouse + docs; and the
  shared-element poster morph feature.
- **Mani — Lane A (editorial home).** Cinematic featured hero, the NOW SHOWING
  marquee, the four streamed rails (Popular / Top rated / Most discussed / On
  TV), `lib/community.ts` self-enrichment, per-rail Suspense + skeletons +
  empty/error. Features: ⌘K command palette + recently-viewed rail.
- **Collins — Lane B (discovery + TV + watchlist page).** `/browse` (Movies/TV
  tabs, pagination), `/search` rewrite (Movies/TV toggle, advanced filters +
  sort), TV first-class cross-check, the `/watchlist` page. Feature: `/compare`.
- **Jonathan — Lane C (showpiece pages).** Detail rewrite (cinematic hero,
  stats row, facts panel, share), About, branded 404, profile polish. Feature:
  per-title dynamic color.

## Invented feature — Watchlist: rationale (deliverable #3)

**Decision:** the headline invented feature is a device-local **Watchlist**,
persisted in `localStorage` (one `g2:watchlist` key), exposed app-wide through a
provider-less `useWatchlist()` hook built on `useSyncExternalStore`.

**Why localStorage and not a partner route:**
- Group 1's API exposes **no** "save for later" / watchlist endpoint, and this is
  a *consumer* sprint — we are not allowed to add back-end routes to their API.
  A server-backed watchlist would mean inventing storage we don't own.
- A watchlist is the kind of feature users expect to work **before** they sign
  in. Unlike rate/review (which legitimately require an Auth² bearer token),
  bookmarking a title to watch later has no reason to be gated. `localStorage`
  lets it work signed-out, which is the correct product call.
- It is **instantly demoable and reliable** for the presentation — no cold-start
  Render latency, no auth dance, no dependency on Group 1 uptime.
- `useSyncExternalStore` + a `storage` event listener gives us free **cross-tab
  sync** and a clean **SSR-safe** story (server + first client render see an
  empty list, then it hydrates) with no provider and no hydration mismatch.

**Touchpoints:** a `<WatchlistButton>` on every `MovieCard` (revealed on
hover/focus, always shown on touch) and in the detail hero; a live **count badge**
in the header nav; and the `/watchlist` page (grid + remove + on-brand empty
state). Toggling from any surface stays in sync everywhere and persists across
reload + tabs, with a reduced-motion-safe "pop".

---

## Mid-sprint sync — Wed 6/3

- Rudolf's foundation (theme + shell + core components + watchlist + styleguide)
  merged via PR #70 (`rudolfs-branch`). The three page lanes started in parallel
  against the published prop contracts.
- Confirmed the API reality we're building on: `/movies/popular`, `/tv/popular`,
  `/movies/{id}`, `/tv/{id}`, and `/details/{type}/{id}/enriched` are rich and
  reliable (backdrop, genres, runtime, vote_average, budget, tagline — but **no
  cast**, so we never fake credits). The aggregate routes `/ratings/top-rated` &
  `/ratings/most-reviewed` still come back with `tmdb: null`, so the community
  rails **self-enrich** the ids through `lib/enrich-titles.ts` (the proven
  Sprint-7 fallback), capped at ~12 and cached.

## End-of-sprint integration — Sat 6/6 → Sun 6/7

- Page lanes merged into `dev`: Mani's home (PR #71), Collins's browse/search/
  watchlist (PR #72), Jonathan's detail/about/404/profile (PR #73). Features
  layered on after the required pages were solid: ⌘K palette + recently-viewed
  (Mani), advanced filters + `/compare` (Collins), per-title color (Jonathan),
  shared-element poster morph (Rudolf).
- Cohesion + correctness audit caught and fixed several real issues before ship:
  - **Title identity was not media-type aware** — a movie and a TV show that
    happen to share a TMDB id collided in the watchlist / recently-viewed
    stores. Fixed by keying everything on `mediaType:id` (`titleIdentityKey`);
    added a regression test.
  - **Search filters passed unknowns through** — genre/min-rating filtering ran
    before the result metadata was resolved, so unfiltered items leaked in. Now
    the search page enriches results on demand (`lib/search-metadata.ts`) and the
    filter requires matching metadata; omitted items are surfaced in a warning.
  - **Compare used mismatched score sources** — one side could show its community
    score and the other its TMDB score, making the "winner" meaningless.
    `chooseComparisonScores` now picks **one** source present on *both* sides.
  - Per-title accent color was made media-type aware and clamped for legibility;
    sharing + final UI cohesion landed last.
- **Lighthouse + deploy gate (final review, 6/7):** a production build failure was
  found that the lane PRs had each passed individually — `Footer` rendered
  `<Box component={Link}>` from a *Server Component*, which passes a function
  across the RSC→client boundary and **aborts the static prerender of
  `/_not-found`**, failing the whole `next build`. Fixed by making `Footer` a
  client component; dropped an `experimental.cpus: 1` override that would have
  pinned production builds to one core; self-hosted the three fonts via
  `next/font/local` so builds don't depend on fetching Google Fonts. Build,
  lint, and the regression tests are green; the app is deployed and reachable on
  Vercel. Lighthouse captures + the a11y/perf fix log live in `docs/lighthouse/`.

---

## End-of-quarter retrospective (Sprint 8 + the whole project)

**What went well**
- **The foundation-first / share-the-contract-not-the-component rule held for a
  third sprint.** Four people built a brand-new visual identity and six+ pages in
  a week with almost no cross-lane conflicts because they only ever depended on
  Rudolf's tokens + prop contracts (and the `/styleguide` made the contract
  *visible*). The friction we felt in Sprint 6 never came back.
- **Token-driven theming paid for itself.** Shipping both light and dark from one
  `colorSchemes` theme with zero hardcoded hex meant dark mode was essentially
  free, the no-flash toggle "just worked," and the final Lighthouse run scored
  **100 accessibility / 100 best-practices / 100 SEO** with **CLS 0**.
- **Honest degradation beat faking data.** Self-enriching the `tmdb: null`
  aggregate routes, skipping `0` budgets, never inventing cast — the app reads as
  trustworthy because it only shows what it can actually back up.

**What we'd do differently**
- **A green PR is not a green build.** Each lane PR passed `next build` on its own,
  but the Footer RSC bug only bit when *all* of static prerendering ran together
  at ship time. We should run a full production build on the integration branch
  as a required check *before* the final hour, not during it.
- **Capture the Lighthouse baseline on day one.** "Before/after" only tells a
  story if "before" is recorded before the work starts. We reconstructed the
  pre-Sprint-8 baseline at the end (see `docs/lighthouse/`), which works but is
  avoidable — bake the baseline capture into M0 next time.
- **Decide reduced-motion policy up front.** We flip-flopped on whether the global
  `prefers-reduced-motion` reset was freezing the signature marquee; the final,
  correct answer is "honor it" (a11y wins), but we burned time discovering that.

**Surprises — consuming vs. providing an API**
- Providing an API (Sprints 1–4) made us think in terms of *contracts and
  correctness*; consuming one (Sprints 5–8) made us think in terms of *defense*.
  The single biggest lesson: **`HTTP 200` does not mean success.** Group 1's
  enriched route returns 200 with a TMDB error envelope in the body, so every
  consumer of it has to inspect the payload, not the status. We would never have
  predicted how much consumer code is just guarding against shapes the provider
  *technically* documented but didn't guarantee (`tmdb: null`, `0` for "unknown",
  `first_air_date` vs `release_date`, movie/TV id overlap).
- Being on *both* sides taught us empathy in both directions: as a provider we now
  understand why consumers file such pedantic bug reports, and as a consumer we
  understand why providers want structured reports through the bug tracker, not
  Discord one-liners.

**What we learned about working with AI agents**
- Agents are fastest when handed a **tight contract and a single lane** — the same
  thing that made our *humans* productive. "Build this component to these props,
  in this token system, touching only these files" produced clean, mergeable
  work; vague "make it nicer" prompts produced churn.
- Agents are excellent at the **breadth pass a tired team skips at 11pm**:
  re-reading every call site for consistency, catching the media-type id-collision
  bug, noticing the one Server Component that breaks the static build. They are
  *not* a substitute for actually running `next build` / `lint` / tests — they'll
  confidently describe code as "done" that doesn't compile, so verification stays
  on us.
- Most valuable habit: make the agent **prove** completion (build output, test
  pass, a real Lighthouse number) rather than accept "looks complete." Every
  claim in this sprint that mattered was the one we could check.

## Final scope and attribution audit — Mon 6/8

- Rechecked the Sprint 8 deliverables, master plan, repository history, and
  shipped routes after the final mobile fixes.
- The team kept the command palette, recently viewed, compare, advanced search,
  sharing, and shared-element transition work. We intentionally removed the
  poster-derived per-title color experiment from the final scope; title pages
  use the stable emerald design-system accent instead.
- Updated the README and About page from the full backend and frontend commit
  history. The original feature lanes remain credited to Collins, Mani, and
  Jonathan. Rudolf's credit now also records the app foundation, design system,
  shared infrastructure, integration and release work, and the substantial
  final UI/UX redesign and polish across the major routes.
- Restored the About-page acknowledgements required by the sprint: Group 1's
  upstream API, TMDB metadata/artwork, and Auth² authentication.

## Final deployment and submission audit — Mon 6/8

- Replaced the expired free-tier Render PostgreSQL database, redeployed the
  backend, and added an idempotent startup bootstrap driven by
  `ADMIN_SUBJECT_ID` so the designated Auth² subject regains the local Admin
  role after a fresh database is created.
- Confirmed the backend health route and all required consumer routes were live.
  Vercel reported a successful deployment for the final frontend commit.
- Used the restored production admin identity to query the live bug queue.
  `/v1/issues?pageSize=50&sort=createdAt:asc` returned HTTP 200 with zero
  results, so no unresolved provider issues remained for Sprint 8.
- Added a second production Lighthouse report for `/browse` using a true
  412 × 823 mobile viewport. Accessibility, best practices, and SEO remained
  100, CLS remained 0, and the responsive viewport and text-legibility audits
  passed.
- Re-ran the frontend tests, lint, and production build plus the backend format,
  lint, build, and database-backed test suite as the final submission gate.
