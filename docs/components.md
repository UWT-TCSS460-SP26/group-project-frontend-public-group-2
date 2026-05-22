# Components & Helpers — How to Use

Style consistency comes from everyone reaching for the **same building blocks**. Pages should be data + composition, not styling.

## Visual identity (set in `src/theme.ts`)

- **Background**: warm near-black `#0F0E0C`
- **Surface**: `#1A1815`
- **Text**: warm off-white `#EDE7DC`, muted `#A8A294`
- **Accent**: marigold `#D4A24A` (use for primary buttons, CTAs)
- **Headlines**: Fraunces (serif, variable)
- **Body**: Inter
- Corners: 6px radius
- Buttons: no shadows, lowercase preserved (no uppercase)

Anything visual that isn't covered here, add it to the theme — don't hardcode in components.

## API helper — `src/lib/api.ts`

```tsx
import { fetchGroupOneApi } from "@/lib/api";

// Public route:
const data = await fetchGroupOneApi<SearchResults>("/movies/search", {
  query: { q: "blade runner", page: 1 },
});

// Auth-protected route:
const data = await fetchGroupOneApi<Movie>(`/movies/${id}`, {
  withAuth: true,
});
```

**Always use this — do not write raw `fetch` calls.** The helper centralizes the base URL and the Bearer-token attachment.

## TypeScript types — `src/types/media.ts`

Placeholder shapes. Refine after Jonathan's API scout doc (`docs/group-1-api-notes.md`) lands with actual field names.

## Components — `src/components/`

All exported from `@/components`. Import like:

```tsx
import { Header, Hero, PopularGrid, PageContainer, PageTitle, MovieCard, EmptyState, LoadingState, ErrorState } from "@/components";
```

### `<Header />`
The global app header. **Rendered once in `app/layout.tsx`** — do not render it inside individual pages. Currently a stub by Rudolf (logo + Search/Browse nav + Sign In/Out). **Jonathan to replace** with the polished version: better mobile behavior, possibly a user-menu dropdown, anything the team agrees on. Keep the export name `Header`.

### `<Hero eyebrow? title blurb? backgroundImageUrl? />`
The full-bleed featured section on the home page. Eyebrow is the small uppercase tag above the title (default `"Featured"`). `backgroundImageUrl` is optional; without it, falls back to a warm gradient.

```tsx
<Hero
  eyebrow="Featured"
  title="Find your next watch."
  blurb="Search, browse, and discover movies and shows."
  backgroundImageUrl={movie?.backdropUrl}
/>
```

### `<PopularGrid title? movies />`
A section header + responsive grid of `<MovieCard>`s. Use for any "list of movies" surface (home page, browse page).

```tsx
<PopularGrid title="Popular this week" movies={results} />
```

### `<PageContainer>`
Wrap every page in this. Handles max-width, padding, responsive gutters.

```tsx
<PageContainer>
  {/* your page content */}
</PageContainer>
```

### `<PageTitle title subtitle? />`
The page heading. Uses the Fraunces serif font.

```tsx
<PageTitle title="Search" subtitle="Find a movie or show" />
```

### `<MovieCard movie hrefPrefix? />`
The card used in search + browse grids. Links to `${hrefPrefix}/${movie.id}` (default `/title`).

```tsx
<MovieCard movie={movie} />
```

Render a grid of them with MUI's `<Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(5, 1fr)" }, gap: 3 }}>`.

### `<EmptyState message? detail? />`
For "no results" states.

### `<LoadingState message? />`
For loading screens. Spinner + optional caption.

### `<ErrorState message? detail? />`
For caught errors.

## Page template (every search/browse page should look roughly like this)

```tsx
import { PageContainer, PageTitle, MovieCard, EmptyState } from "@/components";
import { fetchGroupOneApi } from "@/lib/api";
import type { SearchResults } from "@/types/media";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const data = q ? await fetchGroupOneApi<SearchResults>("/movies/search", { query: { q } }) : null;

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

## What NOT to do

- **No inline `style={{}}`** — use MUI's `sx` prop.
- **No raw colors or hex codes in components** — pull from `theme.palette.*` via `sx`.
- **No raw `fetch`** — use `fetchGroupOneApi`.
- **No tailwind classes** — we removed Tailwind from active use. The theme is the source of truth.
- **No new card styles for movies** — extend `<MovieCard>` instead.
- **No write affordances** (no rate, no review) — those are Sprint 7.
