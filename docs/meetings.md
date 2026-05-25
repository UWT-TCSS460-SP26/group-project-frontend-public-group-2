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
