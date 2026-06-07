import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {
  EmptyState,
  ErrorState,
  Hero,
  Marquee,
  MovieCard,
  Numeral,
  PageContainer,
  Reveal,
} from "@/components";
import { fetchGroupOneApi } from "@/lib/api";
import type { SearchResults } from "@/types/media";

// Server-render on demand so the popular feed is fresh and the build never blocks
// on Group 1's API. (Caching/ISR can be tuned in the perf pass, RU-10.)
export const dynamic = "force-dynamic";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as UnknownRecord;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function hasTmdbData(payload: UnknownRecord): boolean {
  const tmdb = asRecord(payload.tmdb);
  if (!tmdb) return false;
  if (tmdb.success === false) return false;
  if (typeof tmdb.status_message === "string") return false;
  return true;
}

function toBackdropUrl(pathOrUrl: string | undefined) {
  if (!pathOrUrl) return null;
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  return `${TMDB_IMAGE_BASE}/w1280${pathOrUrl}`;
}

async function fetchFeaturedBackdrop(id: number) {
  try {
    const payload = await fetchGroupOneApi<UnknownRecord>(
      `/details/movie/${id}/enriched`,
    );
    if (!hasTmdbData(payload)) return null;

    const tmdb = asRecord(payload.tmdb);
    return toBackdropUrl(
      asString(tmdb?.backdrop_path) ?? asString(tmdb?.backdropUrl),
    );
  } catch {
    return null;
  }
}

// Editorial "Repertory" reference home: a cinematic featured title, a NOW SHOWING
// marquee, and an editorial grid of popular titles. Wired to the popular feed;
// Mani's lane layers the community + TV rails, states, and features on top.
export default async function Home() {
  let data: SearchResults | null = null;
  let errorDetail: string | null = null;
  try {
    data = await fetchGroupOneApi<SearchResults>("/movies/popular");
  } catch (error) {
    errorDetail =
      error instanceof Error
        ? error.message
        : "We couldn't load popular titles right now.";
  }

  if (errorDetail) {
    return (
      <PageContainer>
        <ErrorState message="Popular titles are unavailable." detail={errorDetail} />
      </PageContainer>
    );
  }

  if (!data || data.results.length === 0) {
    return (
      <PageContainer>
        <EmptyState
          message="Catalog is being prepared."
          detail="Popular titles will appear here shortly."
        />
      </PageContainer>
    );
  }

  const movies = data.results;
  const featured = movies[0];
  const rest = movies.slice(1);
  const marqueeItems = movies.slice(0, 12).map((m) => m.title);
  const featuredYear = featured.release_date?.slice(0, 4);
  const featuredBackdrop = await fetchFeaturedBackdrop(featured.id);
  const featuredMeta = [featuredYear, "Movie"].filter(Boolean).join(" · ");

  return (
    <>
      <Hero
        eyebrow="Featured"
        title={featured.title}
        meta={featuredMeta}
        blurb={featured.overview}
        backgroundImageUrl={featuredBackdrop}
        ctaHref={`/title/${featured.id}`}
        ctaLabel="View"
      />

      <Marquee items={marqueeItems} label="Now Showing" />

      <PageContainer>
        {/* 01 · Popular this week */}
        <Box component="section">
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 2, mb: { xs: 3, md: 4 } }}>
            <Numeral value={1} sx={{ fontSize: { xs: "2rem", md: "2.5rem" } }} />
            <Typography variant="h2" sx={{ fontSize: { xs: "1.5rem", md: "1.85rem" } }}>
              Popular this week
            </Typography>
            <Box sx={{ flex: 1, height: "1px", bgcolor: "divider" }} />
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
      </PageContainer>
    </>
  );
}
