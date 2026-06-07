import type { Metadata } from "next";
import Alert from "@mui/material/Alert";
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
import { filterAndSortSearchResults } from "@/lib/search-filter";
import { enrichSearchMetadata } from "@/lib/search-metadata";
import type { MediaType, SearchResults } from "@/types/media";
import { SearchFilters } from "./SearchFilters";

export const metadata: Metadata = { title: "Search — Group 2" };

type SearchType = "movies" | "tv";

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    type?: string;
    genre?: string;
    yearFrom?: string;
    yearTo?: string;
    minRating?: string;
    sort?: string;
  }>;
}) {
  const {
    q,
    type: rawType = "movies",
    genre = "",
    yearFrom = "",
    yearTo = "",
    minRating = "",
    sort = "relevance",
  } = await searchParams;

  const searchType: SearchType = rawType === "tv" ? "tv" : "movies";
  const trimmedQ = q?.trim() ?? "";
  const mediaType: MediaType = searchType === "tv" ? "tv" : "movie";
  const endpoint = searchType === "tv" ? "/tv/search" : "/movies/search";

  const parsedYearFrom = yearFrom ? parseInt(yearFrom, 10) || null : null;
  const parsedYearTo = yearTo ? parseInt(yearTo, 10) || null : null;
  const parsedMinRating = minRating ? parseInt(minRating, 10) || null : null;

  let data: SearchResults | null = null;
  let fetchError: string | null = null;

  if (trimmedQ) {
    try {
      data = await fetchGroupOneApi<SearchResults>(endpoint, {
        query: { query: trimmedQ },
      });
    } catch (err) {
      fetchError =
        err instanceof Error ? err.message : "Failed to fetch results.";
    }
  }

  const rawResults = data?.results ?? [];
  const needsMetadata = Boolean(genre) || parsedMinRating !== null;
  const metadataResult =
    needsMetadata && rawResults.length > 0
      ? await enrichSearchMetadata(rawResults, mediaType)
      : { items: rawResults, failedCount: 0 };
  const metadataFailureCount = metadataResult.failedCount;

  const filteredResults = filterAndSortSearchResults(metadataResult.items, {
    genre,
    yearFrom: parsedYearFrom,
    yearTo: parsedYearTo,
    minRating: parsedMinRating,
    sort,
  });

  const hasActiveFilters =
    !!genre ||
    !!yearFrom ||
    !!yearTo ||
    !!minRating ||
    (!!sort && sort !== "relevance");
  const filteredByFilters =
    rawResults.length > 0 && filteredResults.length === 0;

  const itemLabel = searchType === "tv" ? "TV show" : "movie";
  const subtitle = trimmedQ
    ? data
      ? `${filteredResults.length} ${itemLabel}${filteredResults.length !== 1 ? "s" : ""} for "${trimmedQ}"${hasActiveFilters ? " · filtered" : ""}`
      : undefined
    : undefined;

  // Tab toggle preserves all active filters when switching Movies ↔ TV.
  function tabHref(type: SearchType) {
    const p = new URLSearchParams();
    if (trimmedQ) p.set("q", trimmedQ);
    p.set("type", type);
    if (genre) p.set("genre", genre);
    if (yearFrom) p.set("yearFrom", yearFrom);
    if (yearTo) p.set("yearTo", yearTo);
    if (minRating) p.set("minRating", minRating);
    if (sort && sort !== "relevance") p.set("sort", sort);
    return `/search?${p.toString()}`;
  }

  return (
    <PageContainer>
      <PageTitle title="Search" subtitle={subtitle} />

      {/* Movies / TV toggle — links so they work without JS */}
      <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
        <ButtonLink
          href={tabHref("movies")}
          variant={searchType === "movies" ? "contained" : "outlined"}
          color="primary"
          size="small"
        >
          Movies
        </ButtonLink>
        <ButtonLink
          href={tabHref("tv")}
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
        sx={{ display: "flex", gap: 2, mb: 3, maxWidth: 600 }}
      >
        {/* Preserve the active tab when the form submits */}
        <input type="hidden" name="type" value={searchType} />
        {/* Preserve active filters when the form submits */}
        {genre && <input type="hidden" name="genre" value={genre} />}
        {yearFrom && <input type="hidden" name="yearFrom" value={yearFrom} />}
        {yearTo && <input type="hidden" name="yearTo" value={yearTo} />}
        {minRating && (
          <input type="hidden" name="minRating" value={minRating} />
        )}
        {sort && sort !== "relevance" && (
          <input type="hidden" name="sort" value={sort} />
        )}
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

      {/* Filter + sort panel */}
      <SearchFilters
        q={trimmedQ}
        searchType={searchType}
        genre={genre}
        yearFrom={yearFrom}
        yearTo={yearTo}
        minRating={minRating}
        sort={sort}
      />

      {metadataFailureCount > 0 && (
        <Alert severity="warning" role="status" sx={{ mb: 3 }}>
          {metadataFailureCount} search{" "}
          {metadataFailureCount === 1 ? "result was" : "results were"} omitted
          because the required filter metadata could not be loaded.
        </Alert>
      )}

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
      ) : filteredByFilters ? (
        <EmptyState
          message="No matches for your filters."
          detail="Try widening the year range or clearing the filters above."
        />
      ) : filteredResults.length > 0 ? (
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
          {filteredResults.map((item, i) => (
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
