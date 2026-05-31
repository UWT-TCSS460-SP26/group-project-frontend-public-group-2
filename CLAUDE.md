# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start local dev server (http://localhost:3000)
npm run build    # production build
npm run start    # serve production build
npm run lint     # run ESLint
```

There are no tests configured yet. No test runner is installed.

## Environment setup

Copy `.env.local` (committed as a template with empty values) and fill in:

| Variable                   | Purpose                                                   |
| -------------------------- | --------------------------------------------------------- |
| `AUTH_SECRET`              | NextAuth signing secret — generate with `npx auth secret` |
| `AUTH_URL`                 | `http://localhost:3000` locally, deployed URL in prod     |
| `AUTH_TCSS460_ID`          | OIDC client ID issued by the instructor                   |
| `AUTH_TCSS460_SECRET`      | OIDC client secret                                        |
| `AUTH_TCSS460_ISSUER`      | `https://tcss-460-iam.onrender.com` (fixed for the class) |
| `AUTH_TCSS460_AUDIENCE`    | `group-1-api` (confirm with Group 1 if it changes)        |
| `NEXT_PUBLIC_API_BASE_URL` | Group 1's deployed API base URL                           |

## Architecture

### Two-team structure

This is the **Group 2 consumer frontend**. It calls **Group 1's REST API** for all movie/search data. There is no backend code here — the app is a pure Next.js frontend that authenticates via OIDC and proxies requests to Group 1.

### Auth flow (`src/auth.ts`)

Authentication is OIDC via a custom NextAuth v5 provider named `"tcss460"` that talks to `AUTH_TCSS460_ISSUER`. Key detail: Auth² only accepts `client_secret_post` at the token endpoint (not the default `client_secret_basic`), which is why `client.token_endpoint_auth_method` is overridden in the provider config.

After login the JWT callback stores `accessToken` and `idToken` on the token, and the session callback exposes them on `session`. The route handler lives at `src/app/api/auth/[...nextauth]/route.ts`.

### API layer (`src/lib/api.ts`)

**All API calls must go through `fetchGroupOneApi`** — never write raw `fetch` calls. The helper supports reads (GET) and writes (POST/PUT/DELETE):

```tsx
// Public GET
const data = await fetchGroupOneApi<SearchResults>("/movies/search", {
  query: { query: "blade runner" },
});

// Auth-protected GET
const data = await fetchGroupOneApi<Movie>(`/movies/${id}`, { withAuth: true });

// Auth-protected POST (write)
const rating = await fetchGroupOneApi<Rating>("/ratings", {
  method: "POST",
  body: { tmdbId, mediaType, score },
  withAuth: true,
});
```

Non-2xx responses throw `ApiError` (exported from `src/lib/api.ts`). Server Actions catch `ApiError` and convert it to an `ActionResult` so structured fields (`status`, `fieldErrors`) survive the Server Action → client boundary.

Note: Group 1's search param is `query`, but our URL convention is `/search?q=...` — map `q` → `query` at the call site.

### Server Actions (`src/lib/actions/`)

Write operations go through **Server Actions**, not direct `fetchGroupOneApi` calls from the client.

```
src/lib/actions/
  ratings.ts   — createRating, updateRating, deleteRating, getMyRatings
  reviews.ts   — createReview, updateReview, deleteReview, getMyReviews
  users.ts     — addSubjectId
  result.ts    — ok() / fail() helpers; ActionResult<T> envelope
```

All actions return `ActionResult<T>`:
```tsx
import { createRating } from "@/lib/actions/ratings";

const result = await createRating({ tmdbId, mediaType, score });
if (!result.ok) {
  // result.error.message, result.error.fieldErrors
} else {
  // result.data is the typed response
}
```

### Rendering model

Pages are **async React Server Components** by default (Next.js App Router). `auth()` can be called directly in server components to read session state.

Client components (`"use client"`) are used where interactivity is required. `useSession()` from `next-auth/react` is available in client components — `SessionProvider` is already in `src/app/providers.tsx`. Use `useSession()` for signed-in/out gating in interactive components.

After a successful write in a client component, call `useRouter().refresh()` to re-run the server component and reflect the updated aggregate data.

### Styling system

`src/theme.ts` is the **single source of truth** for all visual decisions. Use MUI's `sx` prop everywhere:

- No `style={{}}` inline styles
- No hardcoded hex colors — reference `theme.palette.*` via `sx`
- No Tailwind classes (Tailwind is installed but not actively used)
- Buttons: no shadows, no uppercase transform (already set in theme overrides)
- Fonts: Inter (body) and Fraunces (all `h1`–`h6`) are loaded via `next/font` and exposed as CSS vars `--font-inter` / `--font-fraunces`

### Component conventions

All shared components live in `src/components/` and are re-exported from the barrel `src/components/index.ts`. Import like:

```tsx
import {
  Header, Hero, PopularGrid, PageContainer, PageTitle,
  MovieCard, EmptyState, LoadingState, ErrorState,
  SignInPrompt, ConfirmDialog, RatingControl,
} from "@/components";
```

`<Header />` is rendered **once** in `src/app/layout.tsx` — do not add it inside individual pages.

Every page should be wrapped in `<PageContainer>` (handles max-width and responsive padding).

Movie grid layout uses MUI's `<Box>` with `display: "grid"`:

```tsx
<Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(5, 1fr)" }, gap: 3 }}>
```

Do not create new card styles — extend `<MovieCard>` instead.

**Signed-out gating:** render `<SignInPrompt action="rate this title" />` (not a disabled button) when a write affordance is shown to a signed-out visitor.

### TypeScript types (`src/types/media.ts`)

Types are reconciled against Group 1's authoritative OpenAPI spec (`api-1.yaml`). Key exports:

| Export | Purpose |
| --- | --- |
| `Movie` | One search/popular result item (`poster_path`, `release_date`, etc.) |
| `SearchResults` | Paginated wrapper from `/movies/search` |
| `TMDB_IMG_BASE` | CDN base — prepend to `poster_path` for a full image URL |
| `Rating`, `Review` | Write response shapes (Sprint 7) |
| `RatingInput`, `ReviewInput` | Request body shapes for POST actions |
| `ActionResult<T>` | `{ ok: true; data: T } \| { ok: false; error: ActionError }` — returned by all Server Actions |
| `MediaType` | `"movie" \| "tv"` |

### Provider tree

`src/app/providers.tsx` (a client component) wraps children in `AppRouterCacheProvider` (MUI Emotion SSR) → `ThemeProvider` → `CssBaseline` → `SessionProvider`. `SessionProvider` enables `useSession()` in all client components.
