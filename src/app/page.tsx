import { Suspense } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import {
  EmptyState,
  ErrorState,
  Hero,
  Marquee,
  MovieCard,
  Numeral,
  PageContainer,
  Rail,
  RailSkeleton,
  StatBadge,
} from "@/components";
import { fetchGroupOneApi } from "@/lib/api";
import {
  getMostReviewedCommunityTitles,
  getTopRatedCommunityTitles,
  type CommunityRailItem,
} from "@/lib/community";
import type { Movie, SearchResults } from "@/types/media";

// Server-render on demand so the popular feed is fresh and the build never blocks
// on Group 1's API. (Caching/ISR can be tuned in the perf pass, RU-10.)
export const dynamic = "force-dynamic";
const RAIL_LIMIT = 12;

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

type UnknownRecord = Record<string, unknown>;

interface TvTitle {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  first_air_date?: string;
  language: string;
}

interface TvResults {
  results: TvTitle[];
}

interface FeaturedHeroData {
  featured: Movie | null;
  marqueeItems: string[];
  featuredBackdrop: string | null;
}

type LoadResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: unknown };

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

function railTitle(index: number, title: string, tag?: string) {
  return (
    <Box sx={{ display: "flex", alignItems: "baseline", gap: 2 }}>
      <Numeral value={index} sx={{ fontSize: { xs: "2rem", md: "2.5rem" } }} />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h2" sx={{ fontSize: { xs: "1.5rem", md: "1.85rem" } }}>
          {title}
        </Typography>
        {tag && (
          <Typography
            component="span"
            sx={{
              display: "block",
              mt: 0.5,
              color: "text.secondary",
              fontFamily: "var(--font-mono), ui-monospace, monospace",
              fontSize: "0.72rem",
              letterSpacing: "0.08em",
              lineHeight: 1.4,
              textTransform: "uppercase",
            }}
          >
            {tag}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

function RailFallback({ index, title, tag }: { index: number; title: string; tag?: string }) {
  return (
    <Box component="section" sx={{ mb: { xs: 6, md: 8 } }}>
      <Box sx={{ mb: 2 }}>{railTitle(index, title, tag)}</Box>
      <RailSkeleton count={RAIL_LIMIT} />
    </Box>
  );
}

function RailState({
  index,
  title,
  tag,
  kind,
  detail,
}: {
  index: number;
  title: string;
  tag?: string;
  kind: "empty" | "error";
  detail?: string;
}) {
  return (
    <Box component="section" sx={{ mb: { xs: 6, md: 8 } }}>
      <Box sx={{ mb: 2 }}>{railTitle(index, title, tag)}</Box>
      {kind === "empty" ? (
        <EmptyState message={`${title} is empty.`} detail={detail} />
      ) : (
        <ErrorState message={`${title} is unavailable.`} detail={detail} />
      )}
    </Box>
  );
}

function RailSection({
  index,
  title,
  tag,
  children,
}: {
  index: number;
  title: string;
  tag?: string;
  children: React.ReactNode;
}) {
  return (
    <Box component="section" sx={{ mb: { xs: 6, md: 8 } }}>
      <Rail title={railTitle(index, title, tag)}>{children}</Rail>
    </Box>
  );
}

function toMovieFromCommunity(item: CommunityRailItem): Movie {
  return {
    id: Number(item.tmdbId),
    title: item.title,
    overview: "",
    poster_path: item.poster_path,
    release_date: item.releaseYear ? `${item.releaseYear}` : "",
    language: "",
  };
}

function toMovieFromTv(item: TvTitle): Movie {
  return {
    id: item.id,
    title: item.title ?? item.name ?? "Untitled",
    overview: item.overview,
    poster_path: item.poster_path,
    release_date: item.first_air_date ?? "",
    language: item.language,
  };
}

function formatScore(score: number | null) {
  return typeof score === "number" ? score.toFixed(1) : "N/A";
}

function formatCount(count: number) {
  return `${count} ${count === 1 ? "review" : "reviews"}`;
}

function getErrorDetail(error: unknown) {
  return error instanceof Error ? error.message : "Try refreshing this rail.";
}

async function loadFeaturedHero(): Promise<LoadResult<FeaturedHeroData>> {
  try {
    const data = await fetchGroupOneApi<SearchResults>("/movies/popular");
    const movies = data.results;
    if (!data || movies.length === 0) {
      return { ok: true, data: { featured: null, marqueeItems: [], featuredBackdrop: null } };
    }

    const featured = movies[0];
    const marqueeItems = movies.slice(0, RAIL_LIMIT).map((m) => m.title);
    const featuredBackdrop = await fetchFeaturedBackdrop(featured.id);

    return { ok: true, data: { featured, marqueeItems, featuredBackdrop } };
  } catch (error) {
    return { ok: false, error };
  }
}

async function loadPopularMovies(): Promise<LoadResult<Movie[]>> {
  try {
    const data = await fetchGroupOneApi<SearchResults>("/movies/popular");
    return { ok: true, data: data.results.slice(1, RAIL_LIMIT + 1) };
  } catch (error) {
    return { ok: false, error };
  }
}

async function loadTopRated(): Promise<LoadResult<CommunityRailItem[]>> {
  try {
    return { ok: true, data: await getTopRatedCommunityTitles() };
  } catch (error) {
    return { ok: false, error };
  }
}

async function loadMostReviewed(): Promise<LoadResult<CommunityRailItem[]>> {
  try {
    return { ok: true, data: await getMostReviewedCommunityTitles() };
  } catch (error) {
    return { ok: false, error };
  }
}

async function loadTvShows(): Promise<LoadResult<Movie[]>> {
  try {
    const data = await fetchGroupOneApi<TvResults>("/tv/popular");
    return {
      ok: true,
      data: data.results.slice(0, RAIL_LIMIT).map(toMovieFromTv),
    };
  } catch (error) {
    return { ok: false, error };
  }
}

async function FeaturedHero() {
  const result = await loadFeaturedHero();
  if (!result.ok) {
    return (
      <PageContainer>
        <ErrorState
          message="Featured title is unavailable."
          detail={getErrorDetail(result.error)}
        />
      </PageContainer>
    );
  }

  const { featured, marqueeItems, featuredBackdrop } = result.data;
  if (!featured) {
    return (
      <PageContainer>
        <EmptyState
          message="Catalog is being prepared."
          detail="Featured titles will appear here shortly."
        />
      </PageContainer>
    );
  }

  const featuredYear = featured.release_date?.slice(0, 4);
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
    </>
  );
}

async function PopularRail() {
  const index = 1;
  const title = "Popular this week";
  const result = await loadPopularMovies();
  if (!result.ok) {
    return (
      <RailState
        index={index}
        title={title}
        kind="error"
        detail={getErrorDetail(result.error)}
      />
    );
  }

  const movies = result.data;
  if (movies.length === 0) {
    return (
      <RailState
        index={index}
        title={title}
        kind="empty"
        detail="Popular titles will appear here shortly."
      />
    );
  }

  return (
    <RailSection index={index} title={title}>
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </RailSection>
  );
}

async function TopRatedRail() {
  const index = 2;
  const title = "Top rated by the community";
  const result = await loadTopRated();
  if (!result.ok) {
    return (
      <RailState
        index={index}
        title={title}
        kind="error"
        detail={getErrorDetail(result.error)}
      />
    );
  }

  const items = result.data;
  if (items.length === 0) {
    return (
      <RailState
        index={index}
        title={title}
        kind="empty"
        detail="Community scores will appear after members rate titles."
      />
    );
  }

  return (
    <RailSection index={index} title={title}>
      {items.map((item) => (
        <MovieCard
          key={`${item.mediaType}-${item.tmdbId}`}
          movie={toMovieFromCommunity(item)}
          mediaType={item.mediaType}
          badge={
            <StatBadge
              icon={<StarRoundedIcon sx={{ fontSize: 14, color: "primary.main" }} />}
            >
              {formatScore(item._avg.score)}
            </StatBadge>
          }
        />
      ))}
    </RailSection>
  );
}

async function MostDiscussedRail() {
  const index = 3;
  const title = "Most discussed";
  const result = await loadMostReviewed();
  if (!result.ok) {
    return (
      <RailState
        index={index}
        title={title}
        kind="error"
        detail={getErrorDetail(result.error)}
      />
    );
  }

  const items = result.data;
  if (items.length === 0) {
    return (
      <RailState
        index={index}
        title={title}
        kind="empty"
        detail="Reviewed titles will appear after members start discussing them."
      />
    );
  }

  return (
    <RailSection index={index} title={title}>
      {items.map((item) => (
        <MovieCard
          key={`${item.mediaType}-${item.tmdbId}`}
          movie={toMovieFromCommunity(item)}
          mediaType={item.mediaType}
          badge={<StatBadge>{formatCount(item._count.score)}</StatBadge>}
        />
      ))}
    </RailSection>
  );
}

async function TvRail() {
  const index = 4;
  const title = "On TV now";
  const tag = "TV";
  const result = await loadTvShows();
  if (!result.ok) {
    return (
      <RailState
        index={index}
        title={title}
        tag={tag}
        kind="error"
        detail={getErrorDetail(result.error)}
      />
    );
  }

  const shows = result.data;
  if (shows.length === 0) {
    return (
      <RailState
        index={index}
        title={title}
        tag={tag}
        kind="empty"
        detail="Popular TV titles will appear here shortly."
      />
    );
  }

  return (
    <RailSection index={index} title={title} tag={tag}>
      {shows.map((show) => (
        <MovieCard key={show.id} movie={show} mediaType="tv" metaSuffix="TV" />
      ))}
    </RailSection>
  );
}

// Editorial "Repertory" reference home: a cinematic featured title, a NOW SHOWING
// marquee, and an editorial grid of popular titles. Wired to the popular feed;
// Mani's lane layers the community + TV rails, states, and features on top.
export default function Home() {
  return (
    <>
      <Suspense>
        <FeaturedHero />
      </Suspense>

      <PageContainer>
        <Suspense fallback={<RailFallback index={1} title="Popular this week" />}>
          <PopularRail />
        </Suspense>
        <Suspense fallback={<RailFallback index={2} title="Top rated by the community" />}>
          <TopRatedRail />
        </Suspense>
        <Suspense fallback={<RailFallback index={3} title="Most discussed" />}>
          <MostDiscussedRail />
        </Suspense>
        <Suspense fallback={<RailFallback index={4} title="On TV now" tag="TV" />}>
          <TvRail />
        </Suspense>
      </PageContainer>
    </>
  );
}
