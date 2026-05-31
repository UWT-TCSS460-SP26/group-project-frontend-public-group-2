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

**All API calls must go through `fetchGroupOneApi`** — never write raw `fetch` calls. The helper:

- Prepends `NEXT_PUBLIC_API_BASE_URL` to the path
- Appends query params from the `query` option
- Attaches `Authorization: Bearer <accessToken>` when `withAuth: true`

```tsx
// Public
const data = await fetchGroupOneApi<SearchResults>("/movies/search", {
  query: { query: "blade runner" },
});

// Auth-protected
const data = await fetchGroupOneApi<Movie>(`/movies/${id}`, { withAuth: true });
```

Note: Group 1's search param is `query`, but our URL convention is `/search?q=...` — map `q` → `query` at the call site.

### Rendering model

All pages are **async React Server Components** (Next.js App Router). `auth()` can be called directly in server components/pages to read session state — no `useSession` hook needed. Client components are only used where interactivity is required (currently just `src/app/providers.tsx`).

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
  Header,
  Hero,
  PopularGrid,
  PageContainer,
  PageTitle,
  MovieCard,
  EmptyState,
  LoadingState,
  ErrorState,
} from "@/components";
```

`<Header />` is rendered **once** in `src/app/layout.tsx` — do not add it inside individual pages.

Every page should be wrapped in `<PageContainer>` (handles max-width and responsive padding).

Movie grid layout uses MUI's `Box` with `display: "grid"`:

```tsx
<Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(5, 1fr)" }, gap: 3 }}>
```

Do not create new card styles — extend `<MovieCard>` instead.

### TypeScript types (`src/types/media.ts`)

`Movie` and `SearchResults` are placeholder shapes. Field names should be reconciled against Group 1's `/api-docs` once their API scout doc (`docs/group-1-api-notes.md`) is available.

### Provider tree

`src/app/providers.tsx` (a client component) wraps children in `AppRouterCacheProvider` (MUI Emotion SSR) → `ThemeProvider` → `CssBaseline`. This is required for MUI to work correctly in the App Router.
