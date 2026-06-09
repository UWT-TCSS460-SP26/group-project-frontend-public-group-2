import Image from "next/image";
import { cache, Suspense } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import {
  ButtonLink,
  EmptyState,
  ErrorState,
  GenreChip,
  Hero,
  LoadingState,
  Marquee,
  MetaText,
  MovieCard,
  Numeral,
  PageContainer,
  PosterDeck,
  Rail,
  RailSkeleton,
  RecentlyViewedRail,
  Reveal,
  StatBadge,
  WatchlistButton,
} from "@/components";
import { fetchGroupOneApi } from "@/lib/api";
import { titleHref } from "@/lib/title-route";
import {
  getCommunityRails,
  type CommunityRails,
  type CommunityRailItem,
} from "@/lib/community";
import {
  TMDB_IMG_BASE,
  type MediaType,
  type Movie,
  type SearchResults,
} from "@/types/media";

// Server-render on demand so the popular feed is fresh and the build never blocks
// on Group 1's API. (Caching/ISR can be tuned in the perf pass, RU-10.)
export const dynamic = "force-dynamic";
const RAIL_LIMIT = 12;

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

/** The single featured film shown in the editorial hero. */
export interface HeroFeatured {
  title: string;
  year?: string;
  runtime?: number;
  director?: string;
  genres: string[];
  blurb?: string;
  stillUrl: string | null;
  href: string;
}

interface FeaturedHeroData {
  featured: HeroFeatured | null;
  marqueeItems: string[];
}

interface EditorialFeature {
  id: number;
  mediaType: MediaType;
  title: string;
  href: string;
  year?: string;
  runtime?: string;
  tagline?: string;
  overview?: string;
  genres: string[];
  posterPath: string | null;
  posterUrl: string | null;
  stillUrl: string | null;
  tmdbScore?: number;
}

interface DoubleFeatureData {
  movie: EditorialFeature | null;
  tv: EditorialFeature | null;
}

type LoadResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: unknown };

type UnknownRecord = Record<string, unknown>;

// Full-res backdrop source for the full-bleed hero. next/image downscales it to
// the actual viewport, so a large source reads crisp on wide screens instead of the
// soft, upscaled look w1280 gave above 1280px.
const TMDB_STILL_BASE = "https://image.tmdb.org/t/p/original";

function asRecord(value: unknown): UnknownRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as UnknownRecord;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return undefined;
}

function asNames(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => asString(asRecord(item)?.name) ?? (typeof item === "string" ? item : undefined))
    .filter((name): name is string => Boolean(name));
}

/** Full-bleed still: prefer the TMDB backdrop, fall back to the poster. */
function stillUrl(backdrop: string | undefined, poster: string | null): string | null {
  const path = backdrop ?? poster ?? undefined;
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return backdrop ? `${TMDB_STILL_BASE}${path}` : `${TMDB_IMG_BASE}${path}`;
}

function posterUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return path.startsWith("http") ? path : `${TMDB_IMG_BASE}${path}`;
}

/** Pull the credited director out of the enriched TMDB credits block, if present. */
function extractDirector(tmdb: UnknownRecord): string | undefined {
  const crew = asRecord(tmdb.credits)?.crew;
  if (!Array.isArray(crew)) return undefined;
  const director = crew.find((member) => asRecord(member)?.job === "Director");
  return asString(asRecord(director)?.name);
}

function formatRuntimeMinutes(minutes: number | undefined) {
  if (!minutes) return undefined;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) return `${remainder} min`;
  return remainder === 0 ? `${hours}h` : `${hours}h ${remainder}m`;
}

function runtimeLabel(tmdb: UnknownRecord | null): string | undefined {
  const runtime =
    asNumber(tmdb?.runtime)
    ?? (Array.isArray(tmdb?.episode_run_time)
      ? asNumber(tmdb.episode_run_time[0])
      : undefined);
  return formatRuntimeMinutes(runtime);
}

async function fetchEnrichedTitle(
  mediaType: MediaType,
  id: number,
): Promise<UnknownRecord | null> {
  try {
    const payload = await fetchGroupOneApi<UnknownRecord>(
      `/details/${mediaType}/${id}/enriched`,
    );
    const tmdb = asRecord(payload.tmdb);
    // A wrong id / failed lookup comes back 200 with a TMDB error body.
    if (!tmdb || tmdb.success === false || typeof tmdb.status_message === "string") {
      return null;
    }
    return tmdb;
  } catch {
    return null;
  }
}

const getPopularMoviesFeed = cache(async () =>
  fetchGroupOneApi<SearchResults>("/movies/popular"),
);

const getPopularTvFeed = cache(async () =>
  fetchGroupOneApi<TvResults>("/tv/popular"),
);

const getCommunityRailsCached = cache(async (): Promise<CommunityRails> =>
  getCommunityRails(),
);

const getEnrichedTitleCached = cache(
  async (mediaType: MediaType, id: number): Promise<UnknownRecord | null> =>
    fetchEnrichedTitle(mediaType, id),
);

function buildMovieFeature(item: Movie, tmdb: UnknownRecord | null): EditorialFeature {
  const rawPoster = asString(tmdb?.poster_path) ?? item.poster_path ?? null;
  return {
    id: item.id,
    mediaType: "movie",
    title: item.title || asString(tmdb?.title) || "Untitled",
    href: titleHref("movie", item.id),
    year: (item.release_date || asString(tmdb?.release_date))?.slice(0, 4) || undefined,
    runtime: runtimeLabel(tmdb),
    tagline: asString(tmdb?.tagline),
    overview: item.overview || asString(tmdb?.overview),
    genres: tmdb ? asNames(tmdb.genres) : [],
    posterPath: rawPoster,
    posterUrl: posterUrl(rawPoster),
    stillUrl: stillUrl(asString(tmdb?.backdrop_path), rawPoster),
    tmdbScore: asNumber(tmdb?.vote_average) ?? (typeof item.rating === "number" ? item.rating : undefined),
  };
}

function buildTvFeature(item: TvTitle, tmdb: UnknownRecord | null): EditorialFeature {
  const rawPoster = asString(tmdb?.poster_path) ?? item.poster_path ?? null;
  return {
    id: item.id,
    mediaType: "tv",
    title:
      asString(tmdb?.title)
      ?? asString(tmdb?.name)
      ?? item.title
      ?? item.name
      ?? "Untitled",
    href: titleHref("tv", item.id),
    year: (item.first_air_date || asString(tmdb?.first_air_date))?.slice(0, 4) || undefined,
    runtime: runtimeLabel(tmdb),
    tagline: asString(tmdb?.tagline),
    overview: item.overview || asString(tmdb?.overview),
    genres: tmdb ? asNames(tmdb.genres) : [],
    posterPath: rawPoster,
    posterUrl: posterUrl(rawPoster),
    stillUrl: stillUrl(asString(tmdb?.backdrop_path), rawPoster),
    tmdbScore: asNumber(tmdb?.vote_average) ?? asNumber(tmdb?.rating),
  };
}

function railTitle(index: number, title: string, tag?: string) {
  return (
    <Box sx={{ display: "flex", alignItems: "baseline", gap: { xs: 1.25, sm: 2 }, minWidth: 0 }}>
      <Numeral value={index} sx={{ flexShrink: 0, fontSize: { xs: "1.75rem", sm: "2rem", md: "2.5rem" } }} />
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="h2"
          sx={{
            fontSize: { xs: "clamp(1.25rem, 6vw, 1.5rem)", md: "1.85rem" },
            overflowWrap: "anywhere",
          }}
        >
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

function FeatureSectionFallback({ message }: { message: string }) {
  return (
    <Box component="section" sx={{ mb: { xs: 6, md: 8 } }}>
      <Box
        sx={{
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <LoadingState message={message} />
      </Box>
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

function uniqueTitles(titles: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const title of titles) {
    const trimmed = title.trim();
    const key = trimmed.toLocaleLowerCase();
    if (!trimmed || seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

async function loadFeaturedHero(): Promise<LoadResult<FeaturedHeroData>> {
  try {
    const [data, community] = await Promise.all([
      getPopularMoviesFeed(),
      getCommunityRailsCached(),
    ]);
    const movies = data.results;
    if (!data || movies.length === 0) {
      return { ok: true, data: { featured: null, marqueeItems: [] } };
    }

    const top = movies[0];
    const tmdb = await getEnrichedTitleCached("movie", top.id);
    const featured: HeroFeatured = {
      title: top.title,
      year: (top.release_date || asString(tmdb?.release_date))?.slice(0, 4) || undefined,
      runtime: asNumber(tmdb?.runtime),
      director: tmdb ? extractDirector(tmdb) : undefined,
      genres: tmdb ? asNames(tmdb.genres) : [],
      blurb: top.overview || asString(tmdb?.overview),
      stillUrl: stillUrl(asString(tmdb?.backdrop_path), top.poster_path),
      href: titleHref("movie", top.id),
    };

    const popularTitles = movies.slice(0, RAIL_LIMIT).map((m) => m.title);
    const discussedTitles = community.mostReviewed.map((item) => item.title);
    const marqueeItems = uniqueTitles([...popularTitles, ...discussedTitles]).slice(
      0,
      RAIL_LIMIT + 4,
    );

    return { ok: true, data: { featured, marqueeItems } };
  } catch (error) {
    return { ok: false, error };
  }
}

async function loadPopularMovies(): Promise<LoadResult<Movie[]>> {
  try {
    const data = await getPopularMoviesFeed();
    return { ok: true, data: data.results.slice(1, RAIL_LIMIT + 1) };
  } catch (error) {
    return { ok: false, error };
  }
}

async function loadTopRated(): Promise<LoadResult<CommunityRailItem[]>> {
  try {
    return { ok: true, data: (await getCommunityRailsCached()).topRated };
  } catch (error) {
    return { ok: false, error };
  }
}

async function loadMostReviewed(): Promise<LoadResult<CommunityRailItem[]>> {
  try {
    return { ok: true, data: (await getCommunityRailsCached()).mostReviewed };
  } catch (error) {
    return { ok: false, error };
  }
}

async function loadTvShows(): Promise<LoadResult<Movie[]>> {
  try {
    const data = await getPopularTvFeed();
    return {
      ok: true,
      data: data.results.slice(0, RAIL_LIMIT).map(toMovieFromTv),
    };
  } catch (error) {
    return { ok: false, error };
  }
}

async function loadTonightsPick(): Promise<LoadResult<EditorialFeature | null>> {
  try {
    const data = await getPopularMoviesFeed();
    const candidate = data.results[1] ?? data.results[0];
    if (!candidate) return { ok: true, data: null };

    const tmdb = await getEnrichedTitleCached("movie", candidate.id);
    return { ok: true, data: buildMovieFeature(candidate, tmdb) };
  } catch (error) {
    return { ok: false, error };
  }
}

async function loadDoubleFeature(): Promise<LoadResult<DoubleFeatureData | null>> {
  try {
    const [movies, tv] = await Promise.all([
      getPopularMoviesFeed(),
      getPopularTvFeed(),
    ]);
    const moviePick = movies.results[2] ?? movies.results[1] ?? movies.results[0] ?? null;
    const tvPick = tv.results[0] ?? null;
    if (!moviePick && !tvPick) return { ok: true, data: null };

    const [movieTmdb, tvTmdb] = await Promise.all([
      moviePick ? getEnrichedTitleCached("movie", moviePick.id) : Promise.resolve(null),
      tvPick ? getEnrichedTitleCached("tv", tvPick.id) : Promise.resolve(null),
    ]);

    return {
      ok: true,
      data: {
        movie: moviePick ? buildMovieFeature(moviePick, movieTmdb) : null,
        tv: tvPick ? buildTvFeature(tvPick, tvTmdb) : null,
      },
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

  const { featured, marqueeItems } = result.data;
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

  return (
    <>
      <Hero featured={featured} />

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

  const deckItems = movies.map((movie) => ({
    id: movie.id,
    title: movie.title,
    posterPath: movie.poster_path,
    href: titleHref("movie", movie.id),
    mediaType: "movie" as const,
    year: movie.release_date?.slice(0, 4) || undefined,
    rating: typeof movie.rating === "number" ? movie.rating : undefined,
    overview: movie.overview || undefined,
  }));

  return (
    <Box component="section" sx={{ mb: { xs: 6, md: 8 } }}>
      <Box sx={{ mb: 3 }}>{railTitle(index, title)}</Box>
      <PosterDeck items={deckItems} />
    </Box>
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
      {items.map((item, i) => (
        <Reveal key={`${item.mediaType}-${item.tmdbId}`} index={i}>
          <MovieCard
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
        </Reveal>
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
      {items.map((item, i) => (
        <Reveal key={`${item.mediaType}-${item.tmdbId}`} index={i}>
          <MovieCard
            movie={toMovieFromCommunity(item)}
            mediaType={item.mediaType}
            badge={<StatBadge>{formatCount(item._count.score)}</StatBadge>}
          />
        </Reveal>
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
      {shows.map((show, i) => (
        <Reveal key={show.id} index={i}>
          <MovieCard movie={show} mediaType="tv" metaSuffix="TV" />
        </Reveal>
      ))}
    </RailSection>
  );
}

async function TonightsPickSection() {
  const result = await loadTonightsPick();
  if (!result.ok) {
    return (
      <Box component="section" sx={{ mb: { xs: 6, md: 8 } }}>
        <ErrorState
          message="Tonight’s Pick is unavailable."
          detail={getErrorDetail(result.error)}
        />
      </Box>
    );
  }

  const feature = result.data;
  if (!feature) return null;

  return (
    <Box component="section" sx={{ mb: { xs: 6, md: 8 } }}>
      <Box sx={{ mb: { xs: 2, md: 2.5 }, maxWidth: 620 }}>
        <MetaText sx={{ display: "block", color: "primary.dark" }}>
          Tonight&apos;s Pick
        </MetaText>
        <Typography variant="h2" sx={{ mt: 1, fontSize: { xs: "1.55rem", md: "1.95rem" } }}>
          One title, one reason to watch.
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.15fr) 380px" },
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "relative",
            minHeight: { xs: 236, sm: 280, md: 430 },
            aspectRatio: { xs: "16 / 11", md: "auto" },
            overflow: "hidden",
          }}
        >
          {feature.stillUrl ? (
            <Image
              src={feature.stillUrl}
              alt={`${feature.title} still`}
              fill
              sizes="(max-width: 900px) 100vw, 60vw"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                backgroundImage:
                  "linear-gradient(135deg, color-mix(in srgb, var(--mui-palette-primary-main) 18%, transparent) 0%, var(--mui-palette-common-black) 100%)",
              }}
            />
          )}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, color-mix(in srgb, var(--mui-palette-common-black) 10%, transparent) 0%, color-mix(in srgb, var(--mui-palette-common-black) 78%, transparent) 100%)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              p: { xs: 2, md: 3.5 },
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              gap: { xs: 0.7, md: 1 },
            }}
          >
            <MetaText sx={{ color: "common.white", opacity: 0.82 }}>
              Tonight&apos;s Pick
            </MetaText>
            <Typography
              variant="h2"
              sx={{
                color: "common.white",
                fontSize: { xs: "1.8rem", sm: "2rem", md: "3rem" },
                lineHeight: 1.04,
                maxWidth: { xs: "92%", md: 560 },
              }}
            >
              {feature.title}
            </Typography>
            <MetaText
              sx={{
                color: "common.white",
                opacity: 0.78,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {[feature.year, feature.runtime, "Movie"].filter(Boolean).join(" · ")}
            </MetaText>
          </Box>
        </Box>

        <Box
          sx={{
            p: { xs: 2, md: 3.25 },
            display: "flex",
            flexDirection: "column",
            gap: { xs: 1.5, md: 2 },
          }}
        >
          {feature.tmdbScore !== undefined && (
            <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
              <StatBadge icon={<StarRoundedIcon sx={{ fontSize: 14, color: "primary.main" }} />}>
                {feature.tmdbScore.toFixed(1)} TMDB
              </StatBadge>
            </Box>
          )}

          {feature.tagline && (
            <Typography
              sx={{
                fontFamily: "var(--font-fraunces), Georgia, serif",
                fontStyle: "italic",
                fontSize: { xs: "0.98rem", md: "1.15rem" },
                lineHeight: 1.45,
              }}
            >
              {feature.tagline}
            </Typography>
          )}

          <Typography
            sx={{
              color: "text.secondary",
              fontSize: { xs: "0.94rem", md: "1rem" },
              lineHeight: 1.75,
              display: { xs: "-webkit-box", md: "block" },
              WebkitLineClamp: { xs: 4, md: "unset" },
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {feature.overview ?? "A strong place to start tonight’s watch."}
          </Typography>

          {feature.genres.length > 0 && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              {feature.genres.slice(0, 3).map((genre) => (
                <GenreChip key={genre} label={genre} />
              ))}
            </Box>
          )}

          <Box
            sx={{
              mt: "auto",
              display: "grid",
              gridTemplateColumns: { xs: "1fr auto", sm: "auto auto" },
              gap: 1,
              alignItems: "stretch",
              width: { xs: "100%", sm: "auto" },
            }}
          >
            <ButtonLink
              href={feature.href}
              variant="contained"
              color="primary"
              fullWidth
              sx={{ minHeight: { xs: 42, sm: "auto" } }}
            >
              View title
            </ButtonLink>
            <Box
              sx={{
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.default",
              }}
            >
              <WatchlistButton
                item={{
                  id: feature.id,
                  mediaType: feature.mediaType,
                  title: feature.title,
                  posterPath: feature.posterPath,
                  year: feature.year,
                }}
                size="medium"
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

async function DoubleFeatureSection() {
  const result = await loadDoubleFeature();
  if (!result.ok) {
    return (
      <Box component="section" sx={{ mb: { xs: 6, md: 8 } }}>
        <ErrorState
          message="Double Feature is unavailable."
          detail={getErrorDetail(result.error)}
        />
      </Box>
    );
  }

  const features = result.data
    ? [result.data.movie, result.data.tv].filter((item): item is EditorialFeature => Boolean(item))
    : [];
  if (features.length === 0) return null;

  return (
    <Box component="section" sx={{ mb: { xs: 6, md: 8 } }}>
      <Box sx={{ mb: { xs: 2, md: 2.5 }, maxWidth: 680 }}>
        <MetaText sx={{ display: "block", color: "primary.dark" }}>
          Double Feature
        </MetaText>
        <Typography variant="h2" sx={{ mt: 1, fontSize: { xs: "1.55rem", md: "1.95rem" } }}>
          A movie and a series worth pairing tonight.
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: features.length > 1 ? "repeat(2, 1fr)" : "1fr" },
          gap: { xs: 2, md: 2.5 },
        }}
      >
        {features.map((feature, i) => (
          <Reveal key={`${feature.mediaType}-${feature.id}`} index={i}>
            <Box
              sx={{
                height: "100%",
                display: "grid",
                gridTemplateColumns: { xs: "88px minmax(0, 1fr)", sm: "104px minmax(0, 1fr)" },
                gap: { xs: 1.4, md: 2 },
                p: { xs: 1.75, md: 2.5 },
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
                alignItems: "start",
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "2 / 3",
                  overflow: "hidden",
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.default",
                }}
              >
                {feature.posterUrl ? (
                  <Image
                    src={feature.posterUrl}
                    alt={`${feature.title} poster`}
                    fill
                    sizes="(max-width: 600px) 88px, 104px"
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "text.secondary",
                      fontFamily: "var(--font-fraunces), Georgia, serif",
                      fontStyle: "italic",
                      fontSize: "0.82rem",
                    }}
                  >
                    no poster
                  </Box>
                )}
              </Box>

              <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", gap: { xs: 0.9, md: 1.2 } }}>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
                  <MetaText sx={{ color: "primary.dark" }}>
                    {feature.mediaType === "tv" ? "Series selection" : "Film selection"}
                  </MetaText>
                  {feature.tmdbScore !== undefined && (
                    <StatBadge icon={<StarRoundedIcon sx={{ fontSize: 14, color: "primary.main" }} />}>
                      {feature.tmdbScore.toFixed(1)}
                    </StatBadge>
                  )}
                </Box>

                <Typography
                  variant="h3"
                  sx={{
                    fontSize: { xs: "1.16rem", sm: "1.28rem", md: "1.55rem" },
                    lineHeight: 1.12,
                    overflowWrap: "anywhere",
                  }}
                >
                  {feature.title}
                </Typography>

                <MetaText
                  sx={{
                    color: "text.secondary",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    lineHeight: 1.45,
                  }}
                >
                  {[feature.year, feature.runtime, feature.mediaType === "tv" ? "TV" : "Movie"].filter(Boolean).join(" · ")}
                </MetaText>

                {feature.genres.length > 0 && (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.65 }}>
                    {feature.genres.slice(0, 2).map((genre) => (
                      <GenreChip key={genre} label={genre} />
                    ))}
                  </Box>
                )}

                <Typography
                  sx={{
                    color: "text.secondary",
                    fontSize: { xs: "0.88rem", md: "0.92rem" },
                    lineHeight: 1.7,
                    display: "-webkit-box",
                    WebkitLineClamp: { xs: 2, md: 3 },
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {feature.overview ?? "Worth pairing with tonight’s other pick."}
                </Typography>

                <Box
                  sx={{
                    mt: "auto",
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr auto", sm: "auto auto" },
                    gap: 1,
                    alignItems: "stretch",
                    width: { xs: "100%", sm: "auto" },
                  }}
                >
                  <ButtonLink
                    href={feature.href}
                    variant="outlined"
                    color="primary"
                    fullWidth
                    sx={{ minHeight: { xs: 40, sm: "auto" } }}
                  >
                    View
                  </ButtonLink>
                  <Box
                    sx={{
                      display: "inline-flex",
                      justifyContent: "center",
                      alignItems: "center",
                      border: "1px solid",
                      borderColor: "divider",
                      bgcolor: "background.default",
                    }}
                  >
                    <WatchlistButton
                      item={{
                        id: feature.id,
                        mediaType: feature.mediaType,
                        title: feature.title,
                        posterPath: feature.posterPath,
                        year: feature.year,
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>
          </Reveal>
        ))}
      </Box>
    </Box>
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
        {/* The last rail's bottom margin would otherwise stack with the container
            padding and footer margin into a large dead gap above the footer. */}
        <Box sx={{ "& > section:last-of-type": { mb: 0 } }}>
          <RecentlyViewedRail />
          <Suspense fallback={<FeatureSectionFallback message="Loading Tonight’s Pick…" />}>
            <TonightsPickSection />
          </Suspense>
          <Suspense fallback={<RailFallback index={1} title="Popular this week" />}>
            <PopularRail />
          </Suspense>
          <Suspense fallback={<FeatureSectionFallback message="Loading Double Feature…" />}>
            <DoubleFeatureSection />
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
        </Box>
      </PageContainer>
    </>
  );
}
