import type { Metadata } from "next";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import {
  ButtonLink,
  EmptyState,
  ErrorState,
  MovieCard,
  PageContainer,
  PageTitle,
  Reveal,
} from "@/components";
import { fetchGroupOneApi } from "@/lib/api";
import type { MediaType, SearchResults } from "@/types/media";

export const metadata: Metadata = { title: "Search — Group 2" };

type SearchType = "movies" | "tv";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { q, type: rawType = "movies" } = await searchParams;
  const searchType: SearchType = rawType === "tv" ? "tv" : "movies";
  const trimmedQ = q?.trim() ?? "";

  // Route to the correct Group 1 endpoint based on the active tab.
  const endpoint = searchType === "tv" ? "/tv/search" : "/movies/search";
  const mediaType: MediaType = searchType === "tv" ? "tv" : "movie";

  let data: SearchResults | null = null;
  let fetchError: string | null = null;

  if (trimmedQ) {
    try {
      // Group 1's search param is `query`; our URL param is `q` — map here.
      data = await fetchGroupOneApi<SearchResults>(endpoint, {
        query: { query: trimmedQ },
      });
    } catch (err) {
      fetchError =
        err instanceof Error ? err.message : "Failed to fetch results.";
    }
  }

  const resultCount = data?.results.length ?? 0;
  const itemLabel = searchType === "tv" ? "TV show" : "movie";
  const subtitle = trimmedQ
    ? data
      ? `${resultCount} ${itemLabel}${resultCount !== 1 ? "s" : ""} for "${trimmedQ}"`
      : undefined
    : undefined;

  // Preserve the current query when the user clicks the tab toggle.
  const qParam = trimmedQ ? `&q=${encodeURIComponent(trimmedQ)}` : "";

  return (
    <PageContainer>
      <PageTitle title="Search" subtitle={subtitle} />

      {/* Movies / TV toggle — links so they work without JS */}
      <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
        <ButtonLink
          href={`/search?type=movies${qParam}`}
          variant={searchType === "movies" ? "contained" : "outlined"}
          color="primary"
          size="small"
        >
          Movies
        </ButtonLink>
        <ButtonLink
          href={`/search?type=tv${qParam}`}
          variant={searchType === "tv" ? "contained" : "outlined"}
          color="primary"
          size="small"
        >
          TV Shows
        </ButtonLink>
      </Box>

      {/* Search form — GET submission updates the URL; works without JS */}
      <Box
        component="form"
        method="GET"
        action="/search"
        sx={{
          display: "flex",
          gap: 2,
          mb: { xs: 4, md: 6 },
          maxWidth: 600,
        }}
      >
        {/* Preserve the active tab when the form submits (GET forms only send their own fields). */}
        <input type="hidden" name="type" value={searchType} />
        <TextField
          name="q"
          defaultValue={trimmedQ}
          placeholder={
            searchType === "tv" ? "Search TV shows…" : "Search movies…"
          }
          size="small"
          fullWidth
          autoComplete="off"
          slotProps={{ htmlInput: { "aria-label": "Search query" } }}
        />
        <Button type="submit" variant="contained" color="primary">
          Search
        </Button>
      </Box>

      {/* Result states */}
      {fetchError ? (
        <ErrorState message="Search failed." detail={fetchError} />
      ) : !trimmedQ ? (
        <EmptyState
          message="What are you looking for?"
          detail={
            searchType === "tv"
              ? "Enter a show title, keyword, or actor above."
              : "Enter a movie title, keyword, or actor above."
          }
        />
      ) : data && data.results.length > 0 ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              sm: "repeat(3, 1fr)",
              md: "repeat(5, 1fr)",
              lg: "repeat(6, 1fr)",
            },
            gap: { xs: 2, md: 3 },
          }}
        >
          {data.results.map((item, i) => (
            <Reveal key={item.id} index={i}>
              <MovieCard
                  movie={item}
                  mediaType={mediaType}
                  metaSuffix={searchType === "tv" ? "TV" : undefined}
                />
            </Reveal>
          ))}
        </Box>
      ) : (
        <EmptyState
          message="No results."
          detail={`Nothing matched "${trimmedQ}". Try a different query.`}
        />
      )}
    </PageContainer>
  );
}
