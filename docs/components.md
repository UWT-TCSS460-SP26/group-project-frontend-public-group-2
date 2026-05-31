# Components & Patterns — How to Use

Style consistency comes from everyone reaching for the **same building blocks**.
Pages should be data + composition, not styling.

## Visual identity (set in `src/theme.ts`)

- **Background:** warm near-black `#0F0E0C`
- **Surface:** `#1A1815`
- **Text:** warm off-white `#EDE7DC`, muted `#A8A294`
- **Accent:** marigold `#D4A24A` (primary buttons, CTAs)
- **Headlines:** Fraunces (serif, variable) — applied automatically to `h1`–`h6`
- **Body:** Inter
- **Corners:** 6px radius
- **Buttons:** no shadows, lowercase preserved (no uppercase transform)

Anything visual that isn't covered here, add it to the theme — don't hardcode
in components.

## API helper — `src/lib/api.ts`

```tsx
import { fetchGroupOneApi } from "@/lib/api";

// Public read
const data = await fetchGroupOneApi<SearchResults>("/movies/search", {
  query: { query: "blade runner", page: 1 },
});

// Auth-protected read (server component or Server Action only — uses auth())
const data = await fetchGroupOneApi<Movie>(`/movies/${id}`, { withAuth: true });

// Write (POST/PUT/DELETE) with a JSON body
const rating = await fetchGroupOneApi<Rating>("/ratings", {
  method: "POST",
  body: { tmdbId, mediaType, score },
  withAuth: true,
});
```

**Always use this — do not write raw `fetch` calls.** It centralizes the base
URL, the bearer-token attachment, the 204/empty-body handling, and the typed
error parsing.

### Errors

Non-2xx throws `ApiError` (also exported from `@/lib/api`). It normalizes both
of Group 1's envelopes — see [docs/group-1-write-api.md](group-1-write-api.md):

```ts
class ApiError extends Error {
  status: number;
  detail?: string;
  fieldErrors?: Record<string, string[]>; // populated for Zod 400s
}
```

Server components can let `ApiError` bubble; **Server Actions catch it and
return `ActionResult<T>`** so the structured fields survive into a client
component.

## Server Actions — `src/lib/actions/`

Write operations and `/me` reads run through Server Actions, not raw client
fetches. They attach the bearer token server-side, so the access token never
crosses to the client.

```
src/lib/actions/
  ratings.ts   → createRating · updateRating · deleteRating · getMyRatings
  reviews.ts   → createReview · updateReview · deleteReview · getMyReviews
  users.ts     → syncSubjectId
  result.ts    → ok() / fail() helpers; ActionResult<T> envelope
```

Every action returns the same envelope — branch on `.ok`:

```tsx
import { createReview } from "@/lib/actions/reviews";

const result = await createReview({ tmdbId, mediaType, body });
if (!result.ok) {
  if (result.error.status === 409) /* already reviewed → switch to edit */;
  if (result.error.fieldErrors)    /* map onto form fields */;
  // result.error.message — generic fallback
  return;
}
const review = result.data; // typed
router.refresh();            // reflect on the server-rendered detail page
```

After a successful mutation, call `useRouter().refresh()` from the client
component. The detail page fetches its enriched payload with
`cache: "no-store"` so refresh actually re-pulls fresh aggregates.

## Signed-out gating pattern (Story 5)

A signed-out visitor must see an inert sign-in prompt where a write control
would otherwise live — **not a disabled mystery button, not a button that 401s.**
There are two valid signals; pick the one that fits your context:

```tsx
// Server: gate at the page level (detail page does this).
const session = await auth();
const canWrite = Boolean(session?.user && session?.accessToken);
return canWrite ? <RatingControl … /> : <SignInPrompt action="rate this title" />;
```

```tsx
// Client: gate inside the component (RatingControl / ReviewForm do this).
const { status } = useSession();
if (status === "unauthenticated") return <SignInPrompt action="rate this title" />;
```

`SessionProvider` is already mounted in `src/app/providers.tsx`, so
`useSession()` works in any client component.

Gate on `accessToken`, not just `user` — a logged-in user with no token is
exactly the case Story 5 forbids.

## TypeScript types — `src/types/media.ts`

Reconciled against Group 1's OpenAPI. Key exports:

| Export | Use |
| --- | --- |
| `Movie`, `SearchResults`, `TMDB_IMG_BASE` | Search / popular / poster URL |
| `MediaType` | `"movie" \| "tv"` — every write takes one |
| `Rating`, `Review`, `Author` | Response shapes |
| `RatingInput`, `ReviewInput`, `ReviewUpdateInput` | Request body shapes |
| `MyRatingsResponse`, `MyReviewsResponse`, `EnrichedRatedItem` | `/me` payloads |
| `ActionResult<T>`, `ActionError` | Server-Action envelope |

## Shared components — `src/components/`

All exported from the barrel `@/components`. Import like:

```tsx
import {
  Header, Hero, PopularGrid, MovieCard,
  PageContainer, PageTitle, SectionHeading,
  EmptyState, LoadingState, ErrorState,
  SignInPrompt, ConfirmDialog, RatingControl,
} from "@/components";
```

### Layout & headings

- **`<Header />`** — Global app header. Rendered once in `src/app/layout.tsx` —
  do not render it inside individual pages. Includes the `Search` link, the
  `Profile` link (only when signed in), and Sign In / Sign Out.
- **`<PageContainer>`** — Wrap every page. Max-width + responsive padding.
- **`<PageTitle title subtitle? />`** — The page-level heading (h1, Fraunces).
- **`<SectionHeading id? mb?>`** — The shared sub-section heading (h2). Used by
  the detail page (`Your rating`, `Community`, `Write a review`) and the
  profile (`Your ratings`, `Your reviews`). Pass `mb={0}` when something else
  controls bottom spacing (e.g. a row that also contains a chip).

### Read surfaces

- **`<Hero eyebrow? title blurb? backgroundImageUrl? />`** — Full-bleed featured
  section on the home page.
- **`<PopularGrid title? movies />`** — Section header + responsive movie grid.
- **`<MovieCard movie hrefPrefix? />`** — The card used in every grid. Render
  many with MUI grid columns:

  ```tsx
  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(5, 1fr)" }, gap: 3 }}>
  ```

### States

- **`<EmptyState message? detail? />`** — "Nothing here yet" state. Full-section.
- **`<LoadingState message? />`** — Spinner + caption. Full-section.
- **`<ErrorState message? detail? />`** — Caught error state. Full-section.

For *inline* status inside a component (a row, a widget), use MUI directly:
`<Alert severity="error" role="alert">` for errors, `<CircularProgress>` for
loading. We standardized: every component does inline errors via `<Alert>`.

### Write affordances (Sprint 7)

- **`<SignInPrompt action? message? />`** — The accessible "Sign in to *do that*"
  inert prompt. Renders a labeled message + a small Sign In button that calls
  `signIn("tcss460")` from `next-auth/react`. Use anywhere a write control
  would otherwise live when the visitor is signed out.

  ```tsx
  <SignInPrompt action="rate this title" />
  // → "Sign in to rate this title."  [Sign in]
  ```

- **`<ConfirmDialog open title? description? confirmLabel? confirmColor? busy? onConfirm onCancel />`** —
  Shared confirmation dialog for destructive actions (delete a rating, delete
  a review). Confirm button autofocuses; both buttons disable while `busy`.

- **`<RatingControl tmdbId mediaType />`** *(owned by Collins, C1/C2)* —
  5-star half-star widget (mapped to Group 1's integer 0–10 by `Math.round(stars × 2)`).
  Looks up the user's existing rating via `getMyRatings`, lets them submit /
  change / remove, calls `router.refresh()` after a successful mutation.
  Signed-out users see `<SignInPrompt>`. Errors render via `<Alert>`.

- **`<ReviewForm tmdbId mediaType />`** *(owned by Jonathan, J1)* — Accessible
  MUI form (label association, `aria-describedby`, focus-on-error). Validates
  body 1–5000, maps server `fieldErrors` (Zod 400) onto inputs, recovers from
  `409` by paginating `/reviews/me` and switching to edit mode. Calls
  `router.refresh()` after success.

- **`<ReviewList />`** *(owned by Jonathan, J2)* — Renders the community review
  list with Edit + Delete on the user's own review. Must be wrapped in
  `<ReviewsProvider reviews={…} tmdbId={…} mediaType={…}>` (also from
  [reviews-context.tsx](../src/components/reviews-context.tsx)) — the provider
  shares the review list and ownership info with `ReviewForm`, so an
  Edit-on-the-list click populates the form below.

- The detail page wires all three together — see
  [title/[id]/page.tsx](../src/app/title/%5Bid%5D/page.tsx).

## Page template

```tsx
import { PageContainer, PageTitle, MovieCard, EmptyState } from "@/components";
import { fetchGroupOneApi } from "@/lib/api";
import type { SearchResults } from "@/types/media";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const data = q ? await fetchGroupOneApi<SearchResults>("/movies/search", { query: { query: q } }) : null;

  return (
    <PageContainer>
      <PageTitle title="Search" subtitle={q ? `Results for "${q}"` : "Type a query to start"} />
      {data && data.results.length > 0 ? (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(5, 1fr)" }, gap: 3 }}>
          {data.results.map(m => <MovieCard key={m.id} movie={m} />)}
        </Box>
      ) : (
        <EmptyState message="No results." detail="Try a different query." />
      )}
    </PageContainer>
  );
}
```

> Our app's URL convention is `/search?q=...`; Group 1's parameter is `query`.
> Map `q` → `query` at the call site (as above).

## What NOT to do

- **No inline `style={{}}`** — use MUI's `sx`.
- **No hardcoded colors / hex codes** — use `theme.palette.*` via `sx`.
- **No raw `fetch`** — use `fetchGroupOneApi` or a Server Action.
- **No redundant `fontFamily: "var(--font-fraunces), …"` on `<Typography variant="h*">`** —
  the theme already applies Fraunces to all headings.
- **No new card styles for movies** — extend `<MovieCard>` instead.
- **No write affordance that 401s for signed-out visitors** — use
  `<SignInPrompt>` (Story 5).
- **No `RatingControl` / `ReviewForm` / `ReviewList` outside a coordinated
  context** — Edit-on-list ↔ form sync depends on `<ReviewsProvider>` wrapping
  both.
- **No tailwind classes** — Tailwind is installed but not actively used.
