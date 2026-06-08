import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import {
  ErrorState,
  GenreChip,
  MetaText,
  PageContainer,
  RecentlyViewedRecorder,
  SectionHeading,
  ShareButton,
  SignInPrompt,
  TitleColorScope,
  TitleFacts,
  WatchlistButton,
} from "@/components";
import { RatingControl } from "@/components/RatingControl";
import { ReviewForm } from "@/components/ReviewForm";
import { ReviewList } from "@/components/ReviewList";
import { ReviewsProvider } from "@/components/reviews-context";
import { auth } from "@/auth";
import { fetchGroupOneApi } from "@/lib/api";
import { TITLE_ACCENT } from "@/lib/title-color";
import { parseMediaType } from "@/lib/title-route";
import { posterTransitionName } from "@/lib/view-transition";
import type { MediaType } from "@/types/media";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

type DetailRouteParams = Promise<{ id: string }>;

interface TitleDetailPageProps {
  params: DetailRouteParams;
  searchParams: Promise<{ type?: string }>;
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

function formatRuntime(minutes: number | undefined) {
  if (!minutes) return undefined;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) return `${remainder} min`;
  return remainder === 0 ? `${hours}h` : `${hours}h ${remainder}m`;
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

async function fetchTypedDetail(
  id: string,
  mediaType: MediaType | undefined,
): Promise<DetailResult | null> {
  if (!mediaType) return fetchDetail(id);

  const attempt = await tryFetchDetail(mediaType, id);
  if (attempt.payload) return { mediaType, payload: attempt.payload };
  if (attempt.error) throw attempt.error;
  return null;
}

export default async function TitleDetailPage({
  params,
  searchParams,
}: TitleDetailPageProps) {
  const { id } = await params;
  const { type } = await searchParams;
  const requestedMediaType = parseMediaType(type);

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
    detailResult = await fetchTypedDetail(id, requestedMediaType);
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
              : requestedMediaType
                ? `No ${requestedMediaType === "tv" ? "TV show" : "movie"} matched id ${id}.`
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
  const runtimeLabel = formatRuntime(runtime);
  const metaParts = [
    releaseYear ? String(releaseYear) : undefined,
    runtime ? `${runtime} min` : undefined,
    typeLabel,
  ].filter((part): part is string => Boolean(part));
  const numericId = Number(id);
  const recentlyViewedItem = Number.isFinite(numericId)
    ? {
        id: numericId,
        mediaType,
        title,
        posterPath: asString(tmdb.poster_path) ?? asString(tmdb.posterUrl) ?? null,
        year: releaseYear ? String(releaseYear) : undefined,
      }
    : null;

  // The hero is an intentionally dark cinematic band in BOTH color schemes — its
  // text always sits over a dark scrim — so it uses fixed white/over-dark values
  // rather than the mode-dependent text tokens (matches <Hero>).
  const HERO_SCRIM = [
    "linear-gradient(180deg,",
    "color-mix(in srgb, var(--mui-palette-common-black) 20%, transparent) 0%,",
    "color-mix(in srgb, var(--mui-palette-common-black) 55%, transparent) 52%,",
    "color-mix(in srgb, var(--mui-palette-common-black) 94%, transparent) 100%)",
  ].join(" ");
  const HERO_VIGNETTE = [
    "radial-gradient(120% 90% at 50% 0%,",
    "transparent 38%,",
    "color-mix(in srgb, var(--mui-palette-common-black) 55%, transparent) 100%)",
  ].join(" ");
  const HERO_FALLBACK =
    "radial-gradient(ellipse 70% 60% at 25% 30%, color-mix(in srgb, var(--mui-palette-primary-main) 22%, transparent) 0%, transparent 60%)," +
    "linear-gradient(135deg, color-mix(in srgb, var(--mui-palette-common-black) 88%, var(--mui-palette-primary-main)) 0%, var(--mui-palette-common-black) 100%)";

  return (
    // Per-title accent (JO-2): defaults to the brand emerald/mint, then adopts a
    // luminance-clamped color extracted from the poster client-side. Descendants
    // opt in via `var(--title-accent)` — never applied to body text.
    <TitleColorScope posterUrl={posterUrl}>
      {recentlyViewedItem && <RecentlyViewedRecorder item={recentlyViewedItem} />}

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
          bgcolor: "common.black",
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
              className="image-cover"
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
            data-title-poster-detail
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
              borderColor:
                "color-mix(in srgb, var(--mui-palette-common-white) 16%, transparent)",
              bgcolor: "common.black",
              overflow: "hidden",
              boxShadow:
                "0 18px 44px color-mix(in srgb, var(--mui-palette-common-black) 50%, transparent)",
              mb: { md: -5 },
              viewTransitionName: posterTransitionName(mediaType, id),
            }}
          >
            {posterUrl ? (
              <Image
                src={posterUrl}
                alt={`${title} poster`}
                fill
                sizes="(max-width: 600px) 40vw, 232px"
                className="image-cover"
              />
            ) : (
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "common.white",
                  opacity: 0.6,
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
              sx={{ color: TITLE_ACCENT, display: "block", mb: 1.5 }}
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
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 1,
                  "& .MuiIconButton-root:hover": {
                    color: TITLE_ACCENT,
                  },
                }}
              >
                <Box
                  sx={{
                    display: "inline-flex",
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
                <ShareButton title={title} />
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      <PageContainer>
        {/* A uniform information strip keeps values, labels, and touch-scale
            spacing consistent across narrow and wide screens. */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              sm: "repeat(4, minmax(0, 1fr))",
            },
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            mb: { xs: 4, md: 5 },
          }}
        >
          {[
            {
              label:
                ratingCount !== undefined
                  ? `${ratingCount} ${ratingCount === 1 ? "rating" : "ratings"}`
                  : "Community",
              value:
                averageScore !== undefined ? averageScore.toFixed(1) : "Not rated",
              icon:
                averageScore !== undefined ? (
                  <StarRoundedIcon sx={{ fontSize: 20, color: TITLE_ACCENT }} />
                ) : null,
            },
            {
              label: "TMDB score",
              value:
                voteAverage !== undefined ? voteAverage.toFixed(1) : "Unavailable",
              icon:
                voteAverage !== undefined ? (
                  <StarRoundedIcon sx={{ fontSize: 20, color: "warning.main" }} />
                ) : null,
            },
            { label: "Runtime", value: runtimeLabel ?? "Unavailable" },
            { label: "Format", value: typeLabel },
          ].map((item, index) => (
            <Box
              key={item.label}
              sx={{
                minWidth: 0,
                minHeight: { xs: 92, sm: 104 },
                px: { xs: 2, sm: 2.5 },
                py: { xs: 2, sm: 2.25 },
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                borderRight: {
                  xs: index % 2 === 0 ? "1px solid" : "none",
                  sm: index < 3 ? "1px solid" : "none",
                },
                borderBottom: {
                  xs: index < 2 ? "1px solid" : "none",
                  sm: "none",
                },
                borderColor: "divider",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
                {item.icon}
                <Typography
                  sx={{
                    fontFamily: "var(--font-fraunces), Georgia, serif",
                    fontSize: { xs: "1.15rem", sm: "1.35rem" },
                    lineHeight: 1.15,
                    color: "text.primary",
                    overflowWrap: "anywhere",
                  }}
                >
                  {item.value}
                </Typography>
              </Box>
              <MetaText
                sx={{
                  mt: 0.75,
                  color: "text.secondary",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {item.label}
              </MetaText>
            </Box>
          ))}
        </Box>

        {genres.length > 0 && (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 1,
              mt: -2.5,
              mb: { xs: 4, md: 5 },
            }}
          >
            <MetaText
              sx={{
                mr: 0.5,
                color: "text.secondary",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Genres
            </MetaText>
            {genres.map((genre) => (
              <GenreChip key={genre} label={genre} />
            ))}
          </Box>
        )}

        {/* Editorial two-column: synopsis + details on the left, a defined
            "Your rating" panel on the right. On md+ the panel is a sticky aside;
            on mobile the primary action comes before long-form content. */}
        <Box
          sx={{
            display: "grid",
            gap: { xs: 4, md: 6 },
            gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) 340px" },
            gridTemplateAreas: {
              xs: `"rating" "synopsis" "details"`,
              md: `"synopsis rating" "details rating"`,
            },
            alignItems: "start",
          }}
        >
          <Box component="section" sx={{ gridArea: "synopsis" }}>
            <SectionHeading>Synopsis</SectionHeading>
            <Typography sx={{ color: "text.primary", lineHeight: 1.7, maxWidth: 680 }}>
              {overview ?? "No synopsis available."}
            </Typography>
          </Box>

          {/* Facts panel — status, language, money, production, external links,
              straight from the enriched TMDB block (Jonathan, JO-2). Renders nothing
              when the payload carries none of these fields. */}
          <Box sx={{ gridArea: "details" }}>
            <TitleFacts tmdb={tmdb} />
          </Box>

          {/* Your rating — a defined surface panel so the primary action reads as
              intentional, not bare stars. Signed-in users get the control
              (Collins, C1/C2); signed-out visitors get an inert prompt (Story 5). */}
          <Box
            component="aside"
            sx={{
              gridArea: "rating",
              position: { md: "sticky" },
              top: { md: 92 },
              border: "1px solid",
              // Accent-tinted hairline — a subtle per-title mix over the neutral
              // divider so the panel picks up the poster's hue.
              borderColor: `color-mix(in srgb, ${TITLE_ACCENT} 30%, var(--mui-palette-divider))`,
              bgcolor: "background.paper",
              p: { xs: 2.5, md: 3 },
            }}
          >
            <SectionHeading mb={0.75}>Your rating</SectionHeading>
            <Typography sx={{ mb: 2.5, color: "text.secondary", fontSize: "0.9rem" }}>
              Add or update your score for this title.
            </Typography>
            {canWrite ? (
              <RatingControl tmdbId={id} mediaType={mediaType} useTitleAccent />
            ) : (
              <SignInPrompt action="rate this title" />
            )}
          </Box>
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
            component="section"
            sx={{
              mt: { xs: 6, md: 8 },
              pt: 4,
              borderTop: "1px solid",
              borderColor: `color-mix(in srgb, ${TITLE_ACCENT} 38%, var(--mui-palette-divider))`,
            }}
          >
            <SectionHeading>Reviews</SectionHeading>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) 380px" },
                gridTemplateAreas: {
                  xs: `"write" "community"`,
                  md: `"community write"`,
                },
                gap: { xs: 5, md: 6 },
                alignItems: "start",
              }}
            >
              <Box sx={{ gridArea: "community", minWidth: 0 }}>
                <SectionHeading>Community</SectionHeading>
                <ReviewList />
              </Box>

              {/* Keep the contribution action beside the list on desktop and
                  ahead of it on mobile, where discoverability matters more. */}
              <Box
                sx={{
                  gridArea: "write",
                  minWidth: 0,
                  position: { md: "sticky" },
                  top: { md: 92 },
                }}
              >
                <SectionHeading>Write a review</SectionHeading>
                {canWrite ? (
                  <ReviewForm tmdbId={id} mediaType={mediaType} useTitleAccent />
                ) : (
                  <SignInPrompt action="write a review" />
                )}
              </Box>
            </Box>
          </Box>
        </ReviewsProvider>
      </PageContainer>
    </TitleColorScope>
  );
}
