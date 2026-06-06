import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import {
  ErrorState,
  GenreChip,
  MetaText,
  PageContainer,
  SectionHeading,
  SignInPrompt,
  StatBadge,
  TitleFacts,
  WatchlistButton,
} from "@/components";
import { RatingControl } from "@/components/RatingControl";
import { ReviewForm } from "@/components/ReviewForm";
import { ReviewList } from "@/components/ReviewList";
import { ReviewsProvider } from "@/components/reviews-context";
import { auth } from "@/auth";
import { fetchGroupOneApi } from "@/lib/api";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

type DetailRouteParams = Promise<{ id: string }>;

interface TitleDetailPageProps {
  params: DetailRouteParams;
}

type UnknownRecord = Record<string, unknown>;

interface DetailResult {
  mediaType: "movie" | "tv";
  payload: UnknownRecord;
}

interface ReviewItem {
  id: string | number;
  title?: string;
  description?: string;
  body?: string;
  createdAt?: string;
  author?: {
    displayName?: string;
  };
}

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

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && "name" in item) {
        return asString((item as { name?: unknown }).name);
      }
      return undefined;
    })
    .filter((item): item is string => Boolean(item));
}

function toImageUrl(pathOrUrl: string | undefined, width: "w500" | "w1280") {
  if (!pathOrUrl) return undefined;
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  return `${TMDB_IMAGE_BASE}/${width}${pathOrUrl}`;
}

function getYear(date: string | undefined) {
  if (!date) return undefined;
  const year = Number(date.slice(0, 4));
  return Number.isFinite(year) ? year : undefined;
}

// Group 1's enriched endpoint returns HTTP 200 with a TMDB error body when the
// id doesn't match that media type, so an HTTP-only check isn't enough — we
// have to look inside `tmdb` to know if the lookup actually succeeded.
function hasTmdbData(payload: UnknownRecord): boolean {
  const tmdb = asRecord(payload.tmdb);
  if (!tmdb) return false;
  if (tmdb.success === false) return false;
  if (typeof tmdb.status_message === "string") return false;
  return true;
}

type DetailAttempt = { payload: UnknownRecord | null; error: unknown };

async function tryFetchDetail(
  mediaType: "movie" | "tv",
  id: string,
): Promise<DetailAttempt> {
  try {
    const payload = await fetchGroupOneApi<UnknownRecord>(
      `/details/${mediaType}/${id}/enriched`,
      // Always refetch so a just-submitted rating/review is reflected when a
      // write control calls router.refresh() (the reflect-after-submit path).
      { init: { cache: "no-store" } },
    );
    // A wrong-media-type / unknown id comes back 200 with a TMDB error body, so
    // `null` here is a clean "miss" (lets the movie→TV fallback try the other type).
    return { payload: hasTmdbData(payload) ? payload : null, error: null };
  } catch (error) {
    return { payload: null, error };
  }
}

async function fetchDetail(id: string): Promise<DetailResult | null> {
  const movie = await tryFetchDetail("movie", id);
  if (movie.payload) return { mediaType: "movie", payload: movie.payload };

  const tv = await tryFetchDetail("tv", id);
  if (tv.payload) return { mediaType: "tv", payload: tv.payload };

  // Both attempts missed. If either genuinely errored (an outage, not a clean
  // miss), surface that instead of a misleading "Title not found".
  const attemptError = movie.error ?? tv.error;
  if (attemptError) throw attemptError;

  return null;
}

export default async function TitleDetailPage({
  params,
}: TitleDetailPageProps) {
  const { id } = await params;

  if (!id) {
    return (
      <PageContainer>
        <ErrorState message="Title not found." detail="Missing title id." />
      </PageContainer>
    );
  }
  let detailResult: DetailResult | null = null;
  let fetchError: unknown = null;
  try {
    detailResult = await fetchDetail(id);
  } catch (error) {
    fetchError = error;
  }

  if (!detailResult) {
    return (
      <PageContainer>
        <ErrorState
          message="Title not found."
          detail={
            fetchError instanceof Error
              ? fetchError.message
              : `No movie or TV show matched id ${id}.`
          }
        />
      </PageContainer>
    );
  }

  // Gate on the access token, not just the user: writes attach the bearer
  // token, so a session without one would render a control that 401s (Story 5).
  const session = await auth();
  const canWrite = Boolean(session?.user && session?.accessToken);

  const { mediaType, payload } = detailResult;
  const tmdb = asRecord(payload.tmdb) ?? payload;

  const title =
    asString(tmdb.title) ??
    asString(tmdb.name) ??
    asString(tmdb.original_title) ??
    asString(tmdb.original_name) ??
    "Untitled";
  const tagline = asString(tmdb.tagline);
  const overview = asString(tmdb.overview);
  const releaseDate =
    asString(tmdb.release_date) ?? asString(tmdb.first_air_date);
  const releaseYear = getYear(releaseDate);
  const runtime =
    asNumber(tmdb.runtime) ??
    (Array.isArray(tmdb.episode_run_time)
      ? asNumber(tmdb.episode_run_time[0])
      : undefined);
  const genres = asStringArray(tmdb.genres);
  const voteAverage = asNumber(tmdb.vote_average);

  const posterUrl = toImageUrl(
    asString(tmdb.poster_path) ?? asString(tmdb.posterUrl),
    "w500",
  );
  const backdropUrl = toImageUrl(
    asString(tmdb.backdrop_path) ?? asString(tmdb.backdropUrl),
    "w1280",
  );

  const community = asRecord(payload.community);
  const ratings = asRecord(payload.ratings);
  const averageScore =
    asNumber(community?.averageScore) ?? asNumber(ratings?.average);
  const ratingCount =
    asNumber(community?.reviewCount) ?? asNumber(ratings?.count);

  const reviewSource = payload.recentReviews ?? payload.reviews;
  const recentReviews: ReviewItem[] = Array.isArray(reviewSource)
    ? (reviewSource as ReviewItem[])
    : [];

  const typeLabel = mediaType === "tv" ? "TV show" : "Movie";
  const metaParts = [
    releaseYear ? String(releaseYear) : undefined,
    runtime ? `${runtime} min` : undefined,
    typeLabel,
  ].filter((part): part is string => Boolean(part));

  // The hero is an intentionally dark cinematic band in BOTH color schemes — its
  // text always sits over a dark scrim — so it uses fixed white/over-dark values
  // rather than the mode-dependent text tokens (matches <Hero>).
  const HERO_SCRIM =
    "linear-gradient(180deg, rgba(15,14,12,0.20) 0%, rgba(15,14,12,0.55) 52%, rgba(15,14,12,0.94) 100%)";
  const HERO_VIGNETTE =
    "radial-gradient(120% 90% at 50% 0%, rgba(15,14,12,0) 38%, rgba(15,14,12,0.55) 100%)";
  const HERO_FALLBACK =
    "radial-gradient(ellipse 70% 60% at 25% 30%, rgba(30,122,90,0.18) 0%, rgba(15,14,12,0) 60%)," +
    "linear-gradient(135deg, #1A1815 0%, #0F0E0C 60%, #15130F 100%)";

  // Watchlist entry needs a numeric tmdb id (route param is the id string).
  const numericId = Number(id);

  return (
    <>
      {/* ── Cinematic hero band: full-bleed backdrop + scrim/vignette, with the
          poster overlapping the bottom-left and the title/meta/tagline over the
          scrim. The backdrop layer is the only thing clipped, so the poster can
          dip below the band on md+ without being cut off. */}
      <Box
        component="section"
        sx={{
          position: "relative",
          width: "100%",
          overflow: "visible",
          bgcolor: "#0F0E0C",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box
          aria-hidden
          sx={{ position: "absolute", inset: 0, overflow: "hidden" }}
        >
          {backdropUrl ? (
            <Image
              src={backdropUrl}
              alt=""
              fill
              priority
              sizes="100vw"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                backgroundImage: HERO_FALLBACK,
              }}
            />
          )}
          <Box
            sx={{ position: "absolute", inset: 0, backgroundImage: HERO_SCRIM }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              backgroundImage: HERO_VIGNETTE,
            }}
          />
        </Box>

        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            maxWidth: 1280,
            mx: "auto",
            px: { xs: 3, md: 6 },
            pt: { xs: 12, sm: 18, md: 28 },
            pb: { xs: 4, md: 0 },
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "flex-start", md: "flex-end" },
            gap: { xs: 3, md: 5 },
          }}
        >
          {/* Poster — overlaps the band's bottom edge on md+ (transform-free,
              negative margin only on desktop so the 375px column stacks clean). */}
          <Box
            sx={{
              position: "relative",
              flexShrink: 0,
              width: { xs: 132, sm: 168, md: 232 },
              aspectRatio: "2 / 3",
              border: "1px solid",
              borderColor: "rgba(255,255,255,0.16)",
              bgcolor: "#0F0E0C",
              overflow: "hidden",
              boxShadow: "0 18px 44px rgba(0,0,0,0.5)",
              mb: { md: -5 },
            }}
          >
            {posterUrl ? (
              <Image
                src={posterUrl}
                alt={`${title} poster`}
                fill
                sizes="(max-width: 600px) 40vw, 232px"
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
                  color: "rgba(255,255,255,0.6)",
                  fontFamily: "var(--font-fraunces), serif",
                  fontStyle: "italic",
                  fontSize: "0.85rem",
                }}
              >
                no poster
              </Box>
            )}
          </Box>

          {/* Title / meta / tagline / actions — over the scrim, white. */}
          <Box sx={{ pb: { md: 1 }, minWidth: 0 }}>
            <Typography
              variant="overline"
              sx={{ color: "primary.main", display: "block", mb: 1.5 }}
            >
              {typeLabel}
            </Typography>

            <Typography
              variant="h1"
              sx={{
                color: "common.white",
                fontSize: { xs: "2.25rem", sm: "3rem", md: "3.75rem" },
                lineHeight: 1.04,
                maxWidth: 760,
              }}
            >
              {title}
            </Typography>

            {metaParts.length > 0 && (
              <MetaText
                sx={{
                  display: "block",
                  mt: 2,
                  color: "common.white",
                  opacity: 0.82,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {metaParts.join(" · ")}
              </MetaText>
            )}

            {tagline && (
              <Typography
                sx={{
                  mt: 2,
                  color: "common.white",
                  opacity: 0.86,
                  fontFamily: "var(--font-fraunces), Georgia, serif",
                  fontStyle: "italic",
                  fontSize: { xs: "1.05rem", md: "1.25rem" },
                  lineHeight: 1.4,
                  maxWidth: 620,
                }}
              >
                {tagline}
              </Typography>
            )}

            {Number.isFinite(numericId) && (
              <Box
                sx={{
                  mt: 3,
                  display: "inline-flex",
                  alignItems: "center",
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <WatchlistButton
                  item={{
                    id: numericId,
                    mediaType,
                    title,
                    posterPath:
                      asString(tmdb.poster_path) ??
                      asString(tmdb.posterUrl) ??
                      null,
                    year: releaseYear ? String(releaseYear) : undefined,
                  }}
                  size="medium"
                />
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      <PageContainer>
        {/* Stats row — community average + TMDB vote_average (★) + runtime +
            genre chips (mono), on the theme surface so tokens render correctly. */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1.25,
            mb: { xs: 4, md: 5 },
          }}
        >
          {averageScore !== undefined && (
            <StatBadge
              icon={
                <StarRoundedIcon sx={{ fontSize: 14, color: "primary.main" }} />
              }
            >
              {averageScore.toFixed(1)} community
              {ratingCount !== undefined ? ` · ${ratingCount}` : ""}
            </StatBadge>
          )}
          {voteAverage !== undefined && (
            <StatBadge
              icon={
                <StarRoundedIcon sx={{ fontSize: 14, color: "warning.main" }} />
              }
            >
              {voteAverage.toFixed(1)} TMDB
            </StatBadge>
          )}
          {runtime ? <StatBadge>{runtime} MIN</StatBadge> : null}
          {genres.map((genre) => (
            <GenreChip key={genre} label={genre} />
          ))}
        </Box>

        <SectionHeading>Synopsis</SectionHeading>
        <Typography
          sx={{ color: "text.primary", lineHeight: 1.7, maxWidth: 720 }}
        >
          {overview ?? "No synopsis available."}
        </Typography>

        {/* Facts panel — status, language, money, production, external links,
            straight from the enriched TMDB block (Jonathan, JO-2). Renders nothing
            when the payload carries none of these fields. */}
        <TitleFacts tmdb={tmdb} />

        {/* Your rating — signed-in users get the control (Collins, C1/C2);
            signed-out visitors get an inert sign-in prompt (Story 5). */}
        <Box
          sx={{
            mt: 6,
            pt: 3,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <SectionHeading>Your rating</SectionHeading>
          {canWrite ? (
            <RatingControl tmdbId={id} mediaType={mediaType} />
          ) : (
            <SignInPrompt action="rate this title" />
          )}
        </Box>

        {/* ReviewsProvider coordinates the community list and the review form
            so an Edit click on a row populates the form, and a delete from the
            form/list updates the other (Jonathan, J1/J2). */}
        <ReviewsProvider
          reviews={recentReviews}
          tmdbId={id}
          mediaType={mediaType}
        >
          <Box
            sx={{
              mt: 6,
              pt: 3,
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            <SectionHeading>Community</SectionHeading>

            {averageScore !== undefined && (
              <Typography sx={{ color: "text.secondary", mb: 1 }}>
                Average rating: {averageScore.toFixed(1)}
                {ratingCount !== undefined
                  ? ` (${ratingCount} ${ratingCount === 1 ? "rating" : "ratings"})`
                  : ""}
              </Typography>
            )}

            <ReviewList />
          </Box>

          {/* Write a review — signed-in users get the form (Jonathan, J1/J2);
              signed-out visitors get an inert sign-in prompt (Story 5). */}
          <Box
            sx={{
              mt: 6,
              pt: 3,
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            <SectionHeading>Write a review</SectionHeading>
            {canWrite ? (
              <ReviewForm tmdbId={id} mediaType={mediaType} />
            ) : (
              <SignInPrompt action="write a review" />
            )}
          </Box>
        </ReviewsProvider>
      </PageContainer>
    </>
  );
}
