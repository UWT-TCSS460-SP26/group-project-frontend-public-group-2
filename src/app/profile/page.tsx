import type { Metadata } from "next";
import Link from "next/link";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { auth } from "@/auth";
import {
  EmptyState,
  ErrorState,
  PageContainer,
  PageTitle,
  SignInPrompt,
} from "@/components";
import { getMyRatings } from "@/lib/actions/ratings";
import { getMyReviews } from "@/lib/actions/reviews";
import type { EnrichedRatedItem, Review } from "@/types/media";
import { TMDB_IMG_BASE } from "@/types/media";

export const metadata: Metadata = { title: "Profile - Group 2" };

const REVIEW_LIMIT = 100;

function mediaLabel(mediaType: string) {
  return mediaType === "tv" ? "TV show" : "Movie";
}

function formatDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function ratingTitle(item: EnrichedRatedItem) {
  return (
    item.tmdb.title ??
    item.tmdb.name ??
    `${mediaLabel(item.mediaType)} ${item.tmdbId}`
  );
}

function posterUrl(path?: string | null) {
  if (!path) return undefined;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${TMDB_IMG_BASE}${path}`;
}

function SectionTitle({
  id,
  title,
  count,
}: {
  id: string;
  title: string;
  count?: number;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        mb: 2,
      }}
    >
      <Typography
        id={id}
        variant="h2"
        sx={{
          fontSize: { xs: "1.4rem", md: "1.75rem" },
          fontFamily: "var(--font-fraunces), serif",
        }}
      >
        {title}
      </Typography>
      {count !== undefined && (
        <Chip
          label={`${count} ${count === 1 ? "item" : "items"}`}
          size="small"
          variant="outlined"
        />
      )}
    </Box>
  );
}

function RatingRow({ item }: { item: EnrichedRatedItem }) {
  const title = ratingTitle(item);
  const imageUrl = posterUrl(item.tmdb.poster_path);

  return (
    <Box
      component={Link}
      href={`/title/${item.tmdbId}`}
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "72px 1fr", sm: "88px 1fr auto" },
        gap: 2,
        alignItems: "center",
        p: 2,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        bgcolor: "background.paper",
        color: "inherit",
        textDecoration: "none",
        transition: "border-color 120ms ease, background-color 120ms ease",
        "&:hover": {
          borderColor: "primary.main",
          bgcolor: "action.hover",
        },
      }}
    >
      <Box
        sx={{
          width: "100%",
          aspectRatio: "2 / 3",
          borderRadius: 1,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.default",
          backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {!imageUrl && (
          <Typography sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
            no poster
          </Typography>
        )}
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
        <Typography sx={{ mt: 0.5, color: "text.secondary", fontSize: "0.9rem" }}>
          {mediaLabel(item.mediaType)} - TMDB {item.tmdbId}
          {item.tmdbMissing ? " - details unavailable" : ""}
        </Typography>
      </Box>

      <Box
        sx={{
          gridColumn: { xs: "2", sm: "auto" },
          justifySelf: { xs: "start", sm: "end" },
          textAlign: { xs: "left", sm: "right" },
        }}
      >
        <Typography sx={{ fontWeight: 700, fontSize: "1.25rem" }}>
          {item.score}/10
        </Typography>
        <Typography sx={{ color: "text.secondary", fontSize: "0.8rem" }}>
          your rating
        </Typography>
      </Box>
    </Box>
  );
}

function ReviewRow({ review }: { review: Review }) {
  const date = formatDate(review.updatedAt ?? review.createdAt);

  return (
    <Box
      component={Link}
      href={`/title/${review.tmdbId}`}
      sx={{
        display: "block",
        p: 2,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        bgcolor: "background.paper",
        color: "inherit",
        textDecoration: "none",
        transition: "border-color 120ms ease, background-color 120ms ease",
        "&:hover": {
          borderColor: "primary.main",
          bgcolor: "action.hover",
        },
      }}
    >
      <Typography sx={{ fontWeight: 700 }}>
        {review.title || `${mediaLabel(review.mediaType)} ${review.tmdbId}`}
      </Typography>
      <Typography
        sx={{
          mt: 1,
          color: "text.secondary",
          lineHeight: 1.6,
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {review.description || "No review text provided."}
      </Typography>
      <Typography sx={{ mt: 1, color: "text.secondary", fontSize: "0.85rem" }}>
        {mediaLabel(review.mediaType)} - TMDB {review.tmdbId}
        {date ? ` - ${date}` : ""}
      </Typography>
    </Box>
  );
}

export default async function ProfilePage() {
  const session = await auth();
  const canReadProfile = Boolean(session?.user && session?.accessToken);

  if (!canReadProfile) {
    return (
      <PageContainer>
        <PageTitle
          title="Profile"
          subtitle="Sign in to see everything you have rated and reviewed."
        />
        <SignInPrompt action="view your profile" />
      </PageContainer>
    );
  }

  const [ratingsResult, reviewsResult] = await Promise.all([
    getMyRatings(),
    getMyReviews({ limit: REVIEW_LIMIT }),
  ]);

  const ratings = ratingsResult.ok ? ratingsResult.data : [];
  const reviews = reviewsResult.ok ? reviewsResult.data.results : [];
  const hasRatings = ratings.length > 0;
  const hasReviews = reviews.length > 0;

  return (
    <PageContainer>
      <PageTitle
        title="Profile"
        subtitle="Everything you have rated and reviewed."
      />

      {!hasRatings && !hasReviews && ratingsResult.ok && reviewsResult.ok ? (
        <EmptyState
          message="You haven't rated or reviewed anything yet."
          detail="Your ratings and reviews will appear here after you add them."
        />
      ) : (
        <Box sx={{ display: "grid", gap: { xs: 5, md: 7 } }}>
          <Box component="section" aria-labelledby="profile-ratings-heading">
            <SectionTitle
              id="profile-ratings-heading"
              title="Your ratings"
              count={ratings.length}
            />
            {!ratingsResult.ok ? (
              <ErrorState
                message="Could not load your ratings."
                detail={ratingsResult.error.message}
              />
            ) : hasRatings ? (
              <Box sx={{ display: "grid", gap: 2 }}>
                {ratings.map((item) => (
                  <RatingRow key={item.id} item={item} />
                ))}
              </Box>
            ) : (
              <EmptyState
                message="You haven't rated anything yet."
                detail="Rate a movie or TV show and it will show up here."
              />
            )}
          </Box>

          <Box component="section" aria-labelledby="profile-reviews-heading">
            <SectionTitle
              id="profile-reviews-heading"
              title="Your reviews"
              count={reviews.length}
            />
            {!reviewsResult.ok ? (
              <ErrorState
                message="Could not load your reviews."
                detail={reviewsResult.error.message}
              />
            ) : hasReviews ? (
              <Box sx={{ display: "grid", gap: 2 }}>
                {/* /reviews/me is intentionally thin, so this list renders only
                    the returned review fields and links to the detail route
                    instead of issuing one enrichment request per row. */}
                {reviews.map((review) => (
                  <ReviewRow key={review.id} review={review} />
                ))}
              </Box>
            ) : (
              <EmptyState
                message="You haven't reviewed anything yet."
                detail="Write a review and it will show up here."
              />
            )}
          </Box>
        </Box>
      )}
    </PageContainer>
  );
}
