import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { ErrorState, PageContainer, PageTitle } from "@/components";
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

async function fetchDetail(id: string): Promise<DetailResult> {
  try {
    const movie = await fetchGroupOneApi<UnknownRecord>(
      `/details/movie/${id}/enriched`,
    );
    return { mediaType: "movie", payload: movie };
  } catch {
    const tv = await fetchGroupOneApi<UnknownRecord>(
      `/details/tv/${id}/enriched`,
    );
    return { mediaType: "tv", payload: tv };
  }
}

export default async function TitleDetailPage({ params }: TitleDetailPageProps) {
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
          message="Could not load this title."
          detail={
            fetchError instanceof Error
              ? fetchError.message
              : "Please try again later."
          }
        />
      </PageContainer>
    );
  }

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
  const ratingCount = asNumber(community?.reviewCount) ?? asNumber(ratings?.count);

  const reviewSource = payload.recentReviews ?? payload.reviews;
  const recentReviews: ReviewItem[] = Array.isArray(reviewSource)
    ? (reviewSource as ReviewItem[])
    : [];

  const subtitleParts = [
    releaseYear ? String(releaseYear) : undefined,
    runtime ? `${runtime} min` : undefined,
    mediaType === "tv" ? "TV show" : "Movie",
  ].filter((part): part is string => Boolean(part));

  return (
    <PageContainer>
      {backdropUrl && (
        <Box
          sx={{
            mb: 4,
            borderRadius: 1,
            overflow: "hidden",
            border: "1px solid",
            borderColor: "divider",
            minHeight: { xs: 180, md: 260 },
            backgroundImage: `linear-gradient(to top, rgba(15, 14, 12, 0.9), rgba(15, 14, 12, 0.2)), url(${backdropUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Box
            sx={{
              width: "100%",
              aspectRatio: "2 / 3",
              borderRadius: 1,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              backgroundImage: posterUrl ? `url(${posterUrl})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {!posterUrl && (
              <Typography
                sx={{
                  color: "text.secondary",
                  fontStyle: "italic",
                  fontFamily: "var(--font-fraunces), serif",
                }}
              >
                no poster
              </Typography>
            )}
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <PageTitle
            title={title}
            subtitle={subtitleParts.length > 0 ? subtitleParts.join(" • ") : undefined}
          />

          {tagline && (
            <Typography sx={{ color: "text.secondary", mb: 2 }}>
              {tagline}
            </Typography>
          )}

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
            {releaseDate && (
              <Typography sx={{ color: "text.secondary", fontSize: "0.95rem" }}>
                Release date: {releaseDate}
              </Typography>
            )}
            {genres.length > 0 && (
              <Typography sx={{ color: "text.secondary", fontSize: "0.95rem" }}>
                Genres: {genres.join(", ")}
              </Typography>
            )}
          </Box>

          <Typography
            variant="h6"
            sx={{ mb: 1, fontFamily: "var(--font-fraunces), serif" }}
          >
            Synopsis
          </Typography>
          <Typography sx={{ color: "text.primary", lineHeight: 1.7 }}>
            {overview ?? "No synopsis available."}
          </Typography>
        </Grid>
      </Grid>

      <Box
        sx={{
          mt: 6,
          pt: 3,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography
          variant="h6"
          sx={{ mb: 1.5, fontFamily: "var(--font-fraunces), serif" }}
        >
          Community
        </Typography>

        {averageScore !== undefined && (
          <Typography sx={{ color: "text.secondary", mb: 1 }}>
            Average rating: {averageScore.toFixed(1)}
            {ratingCount !== undefined ? ` (${ratingCount} ratings/reviews)` : ""}
          </Typography>
        )}

        {recentReviews.length > 0 ? (
          <Box sx={{ display: "grid", gap: 2, mt: 2 }}>
            {recentReviews.slice(0, 5).map((review) => (
              <Box
                key={String(review.id)}
                sx={{
                  p: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  bgcolor: "background.paper",
                }}
              >
                <Typography sx={{ fontWeight: 600, mb: 0.5 }}>
                  {review.title ?? "Review"}
                </Typography>
                <Typography sx={{ color: "text.secondary", mb: 0.5 }}>
                  {review.description ?? review.body ?? "No review text provided."}
                </Typography>
                {(review.author?.displayName || review.createdAt) && (
                  <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
                    {review.author?.displayName ?? "Anonymous"}
                    {review.createdAt
                      ? ` • ${new Date(review.createdAt).toLocaleDateString()}`
                      : ""}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        ) : (
          <Typography sx={{ color: "text.secondary" }}>
            No community reviews yet.
          </Typography>
        )}

        <Typography sx={{ mt: 2, color: "text.secondary", fontStyle: "italic" }}>
          Sign in to rate (coming in Sprint 7).
        </Typography>
      </Box>
    </PageContainer>
  );
}
