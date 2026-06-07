import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import {
  ButtonLink,
  EmptyState,
  ErrorState,
  Marquee,
  MetaText,
  MovieCard,
  Numeral,
  PageContainer,
  Rail,
  Reveal,
} from "@/components";
import { fetchGroupOneApi } from "@/lib/api";
import { TMDB_IMG_BASE } from "@/types/media";
import type { PopularResponse, SearchResults } from "@/types/media";

// Server-render on demand so the popular feed is fresh and the build never blocks
// on Group 1's API. (Caching/ISR can be tuned in the perf pass, RU-10.)
export const dynamic = "force-dynamic";

// Editorial "Repertory" reference home: a NOW SHOWING marquee, a numbered serif
// featured film, a popular movies grid, and an "On TV Now" rail.
// Mani's lane (MA-2/3/4) layers the community rails and features on top.
export default async function Home() {
  // Fetch movies and TV in parallel — TV failure doesn't block the page.
  const [moviesResult, tvResult] = await Promise.allSettled([
    fetchGroupOneApi<SearchResults>("/movies/popular"),
    fetchGroupOneApi<PopularResponse>("/tv/popular"),
  ]);

  const moviesData =
    moviesResult.status === "fulfilled" ? moviesResult.value : null;
  const moviesError =
    moviesResult.status === "rejected"
      ? moviesResult.reason instanceof Error
        ? moviesResult.reason.message
        : "We couldn't load popular titles right now."
      : null;

  const tvShows =
    tvResult.status === "fulfilled" ? tvResult.value.results : [];

  if (moviesError) {
    return (
      <PageContainer>
        <ErrorState message="Popular titles are unavailable." detail={moviesError} />
      </PageContainer>
    );
  }

  if (!moviesData || moviesData.results.length === 0) {
    return (
      <PageContainer>
        <EmptyState
          message="Catalog is being prepared."
          detail="Popular titles will appear here shortly."
        />
      </PageContainer>
    );
  }

  const movies = moviesData.results;
  const featured = movies[0];
  const rest = movies.slice(1);
  const marqueeItems = movies.slice(0, 12).map((m) => m.title);
  const featuredYear = featured.release_date?.slice(0, 4);
  const featuredPoster = featured.poster_path
    ? featured.poster_path.startsWith("http")
      ? featured.poster_path
      : `${TMDB_IMG_BASE}${featured.poster_path}`
    : null;

  return (
    <>
      <Marquee items={marqueeItems} label="Now Showing" />

      <PageContainer>
        {/* 01 · Featured */}
        <Box component="section" sx={{ mb: { xs: 8, md: 12 } }}>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 2, mb: { xs: 3, md: 4 } }}>
            <Numeral value={1} sx={{ fontSize: { xs: "2rem", md: "2.5rem" } }} />
            <MetaText sx={{ letterSpacing: "0.18em", textTransform: "uppercase" }}>
              Featured
            </MetaText>
            <Box sx={{ flex: 1, height: "1px", backgroundColor: "divider" }} />
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1.4fr 1fr" },
              gap: { xs: 4, md: 6 },
              alignItems: "center",
            }}
          >
            <Box>
              <Typography
                variant="h1"
                sx={{ fontSize: { xs: "2.5rem", sm: "3.25rem", md: "4rem" }, mb: 2 }}
              >
                {featured.title}
              </Typography>
              {featuredYear && (
                <MetaText
                  sx={{
                    display: "block",
                    mb: 3,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  {featuredYear} · Movie
                </MetaText>
              )}
              {featured.overview && (
                <Typography
                  sx={{
                    color: "text.secondary",
                    lineHeight: 1.7,
                    maxWidth: 520,
                    mb: 4,
                    display: "-webkit-box",
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {featured.overview}
                </Typography>
              )}
              <ButtonLink
                href={`/title/${featured.id}`}
                variant="contained"
                color="primary"
                sx={{
                  fontFamily: "var(--font-mono), ui-monospace, monospace",
                  fontSize: "0.75rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  px: 2.5,
                }}
              >
                View →
              </ButtonLink>
            </Box>

            <Box
              sx={{
                position: "relative",
                aspectRatio: "2 / 3",
                width: "100%",
                maxWidth: { xs: 280, md: "none" },
                mx: { xs: "auto", md: 0 },
                border: "1px solid",
                borderColor: "divider",
                overflow: "hidden",
                bgcolor: "background.paper",
              }}
            >
              {featuredPoster && (
                <Image
                  src={featuredPoster}
                  alt={featured.title}
                  fill
                  priority
                  sizes="(max-width: 900px) 280px, 33vw"
                  style={{ objectFit: "cover" }}
                />
              )}
            </Box>
          </Box>
        </Box>

        {/* 02 · Popular this week */}
        <Box component="section" sx={{ mb: { xs: 8, md: 12 } }}>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 2, mb: { xs: 3, md: 4 } }}>
            <Numeral value={2} sx={{ fontSize: { xs: "2rem", md: "2.5rem" } }} />
            <Typography variant="h2" sx={{ fontSize: { xs: "1.5rem", md: "1.85rem" } }}>
              Popular this week
            </Typography>
            <Box sx={{ flex: 1, height: "1px", backgroundColor: "divider" }} />
          </Box>

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
            {rest.map((movie, index) => (
              <Reveal key={movie.id} index={index}>
                <MovieCard movie={movie} />
              </Reveal>
            ))}
          </Box>
        </Box>

        {/* 03 · On TV Now — always rendered; hidden only if fetch failed */}
        {tvShows.length > 0 && (
          <Box component="section">
            <Box
              sx={{
                display: "flex",
                alignItems: "baseline",
                gap: 2,
                mb: { xs: 3, md: 4 },
                flexWrap: "wrap",
              }}
            >
              <Numeral value={3} sx={{ fontSize: { xs: "2rem", md: "2.5rem" } }} />
              <Typography variant="h2" sx={{ fontSize: { xs: "1.5rem", md: "1.85rem" } }}>
                On TV now
              </Typography>
              <Box sx={{ flex: 1, height: "1px", backgroundColor: "divider" }} />
              <ButtonLink
                href="/browse?tab=tv"
                variant="text"
                size="small"
                sx={{
                  fontFamily: "var(--font-mono), ui-monospace, monospace",
                  fontSize: "0.7rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "text.secondary",
                  "&:hover": { color: "text.primary" },
                }}
              >
                Browse all →
              </ButtonLink>
            </Box>

            <Rail>
              {tvShows.map((show) => (
                <MovieCard
                  key={show.id}
                  movie={show}
                  mediaType="tv"
                  metaSuffix="TV"
                />
              ))}
            </Rail>
          </Box>
        )}
      </PageContainer>
    </>
  );
}
