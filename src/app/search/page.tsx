import type { Metadata } from "next";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import {
  PageContainer,
  PageTitle,
  MovieCard,
  EmptyState,
  ErrorState,
} from "@/components";
import { fetchGroupOneApi } from "@/lib/api";
import type { SearchResults } from "@/types/media";

export const metadata: Metadata = { title: "Search — Group 2" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const trimmedQ = q?.trim() ?? "";

  let data: SearchResults | null = null;
  let fetchError: string | null = null;

  if (trimmedQ) {
    try {
      // Group 1's search param is `query`; our URL param is `q` — map here.
      data = await fetchGroupOneApi<SearchResults>("/movies/search", {
        query: { query: trimmedQ },
      });
    } catch (err) {
      fetchError =
        err instanceof Error ? err.message : "Failed to fetch results.";
    }
  }

  const subtitle = trimmedQ
    ? data
      ? `${data.results.length} result${data.results.length !== 1 ? "s" : ""} for "${trimmedQ}"`
      : undefined
    : undefined;

  return (
    <PageContainer>
      <PageTitle title="Search" subtitle={subtitle} />

      {/* GET form — submits to /search?q=<value>, no JS required */}
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
        <TextField
          name="q"
          defaultValue={trimmedQ}
          placeholder="Search movies…"
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
          detail="Enter a title, keyword, or actor above."
        />
      ) : data && data.results.length > 0 ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              sm: "repeat(3, 1fr)",
              md: "repeat(5, 1fr)",
            },
            gap: 3,
          }}
        >
          {data.results.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
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
