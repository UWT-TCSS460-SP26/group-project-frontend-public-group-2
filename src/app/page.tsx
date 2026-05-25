import { Suspense } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { auth } from "@/auth";
import {
  EmptyState,
  ErrorState,
  Hero,
  LoadingState,
  PageContainer,
  PopularGrid,
} from "@/components";
import { fetchGroupOneApi } from "@/lib/api";
import type { GroupOneMovieResult, Movie, SearchResults } from "@/types/media";

const POPULAR_ENDPOINT = "/movies/popular";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

function toPosterUrl(result: GroupOneMovieResult) {
  const poster = result.posterUrl ?? result.poster_path ?? result.poster ?? null;

  if (!poster) {
    return null;
  }

  if (poster.startsWith("http://") || poster.startsWith("https://")) {
    return poster;
  }

  return `${TMDB_IMAGE_BASE_URL}${poster}`;
}

function toMovie(result: GroupOneMovieResult): Movie {
  const releaseDate = result.release_date ?? result.first_air_date;

  return {
    id: result.id,
    title: result.title ?? result.name ?? "Untitled",
    posterUrl: toPosterUrl(result),
    releaseYear: result.releaseYear ?? releaseDate?.slice(0, 4),
    overview: result.overview,
    rating: result.rating ?? result.vote_average,
  };
}

async function PopularSection() {
  let popular: Movie[] = [];
  let errorDetail: string | null = null;

  try {
    const data = await fetchGroupOneApi<SearchResults<GroupOneMovieResult>>(
      POPULAR_ENDPOINT,
    );
    popular = (data.results ?? []).map(toMovie);
  } catch (error) {
    errorDetail =
      error instanceof Error
        ? error.message
        : "We couldn't load popular titles right now.";
  }

  if (errorDetail) {
    return (
      <ErrorState
        message="Popular titles are unavailable."
        detail={errorDetail}
      />
    );
  }

  if (popular.length === 0) {
    return (
      <EmptyState
        message="Catalog is being prepared."
        detail="Popular titles will appear here shortly."
      />
    );
  }

  return <PopularGrid movies={popular} />;
}

export default async function Home() {
  const session = await auth();

  return (
    <>
      <Hero
        eyebrow="Featured"
        title="Find your next watch."
        blurb="Search, browse, and discover movies and shows pulled live from our upstream partner's catalog."
      />
      <PageContainer>
        <Box
          component="form"
          action="/search"
          method="GET"
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 1.5,
            alignItems: { sm: "center" },
            mb: { xs: 5, md: 6 },
          }}
        >
          <TextField
            name="q"
            variant="outlined"
            fullWidth
            placeholder="Search titles, genres, and more"
            aria-label="Search for movies or shows"
          />
          <Button
            type="submit"
            variant="contained"
            sx={{
              alignSelf: { xs: "stretch", sm: "auto" },
              whiteSpace: "nowrap",
              px: 2.5,
            }}
          >
            Search →
          </Button>
        </Box>

        <Suspense
          fallback={<LoadingState message="Loading popular titles..." />}
        >
          <PopularSection />
        </Suspense>

        {session?.accessToken && (
          <Box
            component="details"
            sx={{
              mt: { xs: 8, md: 12 },
              color: "text.secondary",
              fontSize: "0.85rem",
              maxWidth: 720,
            }}
          >
            <Box component="summary" sx={{ cursor: "pointer", mb: 1 }}>
              Dev: access token (paste into jwt.io to verify iss + aud)
            </Box>
            <Typography
              component="pre"
              sx={{
                fontFamily: "monospace",
                fontSize: "0.72rem",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
                p: 2,
                borderRadius: 1,
              }}
            >
              {session.accessToken}
            </Typography>
          </Box>
        )}
      </PageContainer>
    </>
  );
}
