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
