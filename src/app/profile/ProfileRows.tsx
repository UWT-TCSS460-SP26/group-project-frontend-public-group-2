"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { MetaText } from "@/components/MetaText";
import { SectionHeading } from "@/components/SectionHeading";
import { StatBadge } from "@/components/StatBadge";
import { deleteRating, updateRating } from "@/lib/actions/ratings";
import { deleteReview, updateReview } from "@/lib/actions/reviews";
import { formatDisplayDate } from "@/lib/format-date";
import { titleKey, type TitleSummaryByKey } from "@/lib/title-summary";
import { titleHref } from "@/lib/title-route";
import type { EnrichedRatedItem, MediaType, Review } from "@/types/media";
import { TMDB_IMG_BASE } from "@/types/media";

/** Pick the best display title + poster path for a row, preferring the enriched
 *  payload from /ratings/me/items when present, then the per-item enrichment we
 *  fetched ourselves, then a fallback that at least labels the media type. */
function resolveSummary(
  mediaType: MediaType,
  tmdbId: string,
  enriched: { title?: string; name?: string; poster_path?: string | null } | null | undefined,
  titles: TitleSummaryByKey,
): { title: string; posterPath: string | null; releaseYear?: number; resolved: boolean } {
  const enrichedTitle =
    typeof enriched?.title === "string" && enriched.title.trim().length > 0
      ? enriched.title.trim()
      : typeof enriched?.name === "string" && enriched.name.trim().length > 0
        ? enriched.name.trim()
      : undefined;
  const enrichedPoster =
    typeof enriched?.poster_path === "string" ? enriched.poster_path : null;

  const lookup = titles[titleKey(mediaType, tmdbId)];

  if (enrichedTitle) {
    return {
      title: enrichedTitle,
      posterPath: enrichedPoster ?? lookup?.posterPath ?? null,
      releaseYear: lookup?.releaseYear,
      resolved: true,
    };
  }
  if (lookup) {
    return {
      title: lookup.title,
      posterPath: lookup.posterPath,
      releaseYear: lookup.releaseYear,
      resolved: true,
    };
  }
  return {
    title: `${mediaType === "tv" ? "TV show" : "Movie"} ${tmdbId}`,
    posterPath: null,
    resolved: false,
  };
}

function mediaLabel(mediaType: string) {
  return mediaType === "tv" ? "TV show" : "Movie";
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
      <SectionHeading id={id} mb={0}>
        {title}
      </SectionHeading>
      {count !== undefined && (
        <StatBadge>{`${count} ${count === 1 ? "item" : "items"}`}</StatBadge>
      )}
    </Box>
  );
}

/** Small editorial "X rated · Y reviewed" tally above the sections. */
function SummaryHeader({ rated, reviewed }: { rated: number; reviewed: number }) {
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25 }}>
      <StatBadge
        icon={<StarRoundedIcon sx={{ fontSize: 14, color: "primary.main" }} />}
      >
        {`${rated} rated`}
      </StatBadge>
      <StatBadge>{`${reviewed} reviewed`}</StatBadge>
    </Box>
  );
}

/**
 * Optimized poster thumbnail (next/image) linking to the title page. Shares the
 * gallery framing used by <MovieCard>: hairline-bordered 2:3 frame on the paper
 * surface, with an italic-serif "no poster" fallback. `alt` is always present.
 *
 * The poster is a redundant link to the same title page as the adjacent text
 * link, so it's hidden from keyboard/AT (`tabIndex=-1` + `aria-hidden`) to avoid
 * a duplicate tab stop and a double announcement — it stays clickable by mouse.
 */
function RowPoster({
  href,
  imageUrl,
  title,
}: {
  href: string;
  imageUrl?: string;
  title: string;
}) {
  return (
    <Box
      component={Link}
      href={href}
      tabIndex={-1}
      aria-hidden
      sx={{
        position: "relative",
        display: "block",
        width: "100%",
        aspectRatio: "2 / 3",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        overflow: "hidden",
      }}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={`${title} poster`}
          fill
          sizes="(max-width: 600px) 72px, 88px"
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
            color: "text.secondary",
            fontFamily: "var(--font-fraunces), Georgia, serif",
            fontStyle: "italic",
            fontSize: "0.8rem",
          }}
        >
          no poster
        </Box>
      )}
    </Box>
  );
}

function RowError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <Alert severity="error" sx={{ mt: 2 }}>
      {message}
    </Alert>
  );
}

function RatingRow({
  item,
  titles,
}: {
  item: EnrichedRatedItem;
  titles: TitleSummaryByKey;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [score, setScore] = useState(String(item.score));
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const summary = resolveSummary(item.mediaType, item.tmdbId, item.tmdb, titles);
  const title = summary.title;
  const imageUrl = posterUrl(summary.posterPath);

  async function saveRating() {
    setError(null);
    setBusy(true);
    const nextScore = Number(score);
    const result = await updateRating(item.id, { score: nextScore });
    if (!result.ok) {
      if (result.error.status === 401) {
        await signOut({ redirect: false });
        startTransition(() => router.refresh());
        setBusy(false);
        return;
      }
      setError(result.error.message);
      setBusy(false);
      return;
    }
    setEditing(false);
    startTransition(() => router.refresh());
    setBusy(false);
  }

  async function confirmDelete() {
    setError(null);
    setBusy(true);
    const result = await deleteRating(item.id);
    if (!result.ok) {
      setConfirmOpen(false);
      if (result.error.status === 401) {
        await signOut({ redirect: false });
        startTransition(() => router.refresh());
        setBusy(false);
        return;
      }
      setError(result.error.message);
      setBusy(false);
      return;
    }
    setConfirmOpen(false);
    startTransition(() => router.refresh());
    setBusy(false);
  }

  return (
    <Box
      sx={{
        p: 2,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        bgcolor: "background.paper",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "72px 1fr", sm: "88px 1fr auto" },
          gap: 2,
          alignItems: "center",
        }}
      >
        <RowPoster
          href={titleHref(item.mediaType, item.tmdbId)}
          imageUrl={imageUrl}
          title={title}
        />

        <Box sx={{ minWidth: 0 }}>
          <Typography
            component={Link}
            href={titleHref(item.mediaType, item.tmdbId)}
            sx={{
              color: "inherit",
              textDecoration: "none",
              fontWeight: 600,
              "&:hover": { color: "primary.main" },
            }}
          >
            {title}
          </Typography>
          <MetaText
            sx={{ display: "block", mt: 0.75, textTransform: "uppercase" }}
          >
            {[
              mediaLabel(item.mediaType),
              summary.releaseYear ? String(summary.releaseYear) : undefined,
              !summary.resolved ? "details unavailable" : undefined,
            ]
              .filter(Boolean)
              .join(" · ")}
          </MetaText>
        </Box>

        <Box
          sx={{
            gridColumn: { xs: "2", sm: "auto" },
            justifySelf: { xs: "start", sm: "end" },
            display: "flex",
            flexDirection: "column",
            alignItems: { xs: "flex-start", sm: "flex-end" },
            gap: 0.5,
          }}
        >
          {editing ? (
            <TextField
              label="Score"
              type="number"
              size="small"
              value={score}
              onChange={(event) => setScore(event.target.value)}
              slotProps={{ htmlInput: { min: 0, max: 10, step: 1 } }}
              sx={{ width: 112 }}
            />
          ) : (
            <>
              <StatBadge
                icon={
                  <StarRoundedIcon
                    sx={{ fontSize: 14, color: "primary.main" }}
                  />
                }
              >
                {`${item.score}/10`}
              </StatBadge>
              <MetaText sx={{ textTransform: "uppercase" }}>
                your rating
              </MetaText>
            </>
          )}
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>
        {editing ? (
          <>
            <Button
              variant="contained"
              size="small"
              onClick={saveRating}
              disabled={busy || isPending}
            >
              Save
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setEditing(false);
                setScore(String(item.score));
                setError(null);
              }}
              disabled={busy || isPending}
            >
              Cancel
            </Button>
          </>
        ) : (
          <Button
            variant="outlined"
            size="small"
            onClick={() => setEditing(true)}
            disabled={busy || isPending}
          >
            Edit
          </Button>
        )}
        <Button
          variant="outlined"
          color="error"
          size="small"
          onClick={() => setConfirmOpen(true)}
          disabled={busy || isPending}
        >
          Delete
        </Button>
      </Box>

      <RowError message={error} />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete rating?"
        description={`Delete your rating for ${title}?`}
        confirmLabel="Delete"
        busy={busy || isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
      />
    </Box>
  );
}

function ReviewRow({
  review,
  titles,
}: {
  review: Review;
  titles: TitleSummaryByKey;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(review.title ?? "");
  const [description, setDescription] = useState(review.description ?? "");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const date = formatDisplayDate(review.updatedAt ?? review.createdAt);
  const summary = resolveSummary(review.mediaType, review.tmdbId, null, titles);
  const imageUrl = posterUrl(summary.posterPath);
  // Group 1 stamps "Review of {tmdbId}" when the user posts with no title; we
  // hide that since the resolved movie title is more useful as the heading.
  const userTitle =
    review.title && review.title !== `Review of ${review.tmdbId}`
      ? review.title.trim()
      : "";
  const displayTitle = summary.title;

  async function saveReview() {
    setError(null);
    setBusy(true);
    const result = await updateReview(review.id, {
      title: title.trim() || undefined,
      description: description.trim() || undefined,
    });
    if (!result.ok) {
      if (result.error.status === 401) {
        await signOut({ redirect: false });
        startTransition(() => router.refresh());
        setBusy(false);
        return;
      }
      setError(result.error.message);
      setBusy(false);
      return;
    }
    setEditing(false);
    startTransition(() => router.refresh());
    setBusy(false);
  }

  async function confirmDelete() {
    setError(null);
    setBusy(true);
    const result = await deleteReview(review.id);
    if (!result.ok) {
      setConfirmOpen(false);
      if (result.error.status === 401) {
        await signOut({ redirect: false });
        startTransition(() => router.refresh());
        setBusy(false);
        return;
      }
      setError(result.error.message);
      setBusy(false);
      return;
    }
    setConfirmOpen(false);
    startTransition(() => router.refresh());
    setBusy(false);
  }

  return (
    <Box
      sx={{
        p: 2,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        bgcolor: "background.paper",
      }}
    >
      {editing ? (
        <Box sx={{ display: "grid", gap: 2 }}>
          <TextField
            label="Title"
            size="small"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <TextField
            label="Description"
            multiline
            minRows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "72px 1fr", sm: "88px 1fr" },
            gap: 2,
            alignItems: "start",
          }}
        >
          <RowPoster
            href={titleHref(review.mediaType, review.tmdbId)}
            imageUrl={imageUrl}
            title={displayTitle}
          />

          <Box sx={{ minWidth: 0 }}>
            <Typography
              component={Link}
              href={titleHref(review.mediaType, review.tmdbId)}
              sx={{
                color: "inherit",
                textDecoration: "none",
                fontWeight: 600,
                "&:hover": { color: "primary.main" },
              }}
            >
              {displayTitle}
            </Typography>
            {userTitle && (
              <Typography
                sx={{
                  mt: 0.5,
                  color: "text.secondary",
                  fontFamily: "var(--font-fraunces), Georgia, serif",
                  fontSize: "0.95rem",
                  fontStyle: "italic",
                }}
              >
                {userTitle}
              </Typography>
            )}
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
            <MetaText sx={{ display: "block", mt: 1, textTransform: "uppercase" }}>
              {[
                mediaLabel(review.mediaType),
                summary.releaseYear ? String(summary.releaseYear) : undefined,
                !summary.resolved ? `TMDB ${review.tmdbId}` : undefined,
                date,
              ]
                .filter(Boolean)
                .join(" · ")}
            </MetaText>
          </Box>
        </Box>
      )}

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>
        {editing ? (
          <>
            <Button
              variant="contained"
              size="small"
              onClick={saveReview}
              disabled={busy || isPending}
            >
              Save
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setEditing(false);
                setTitle(review.title ?? "");
                setDescription(review.description ?? "");
                setError(null);
              }}
              disabled={busy || isPending}
            >
              Cancel
            </Button>
          </>
        ) : (
          <Button
            variant="outlined"
            size="small"
            onClick={() => setEditing(true)}
            disabled={busy || isPending}
          >
            Edit
          </Button>
        )}
        <Button
          variant="outlined"
          color="error"
          size="small"
          onClick={() => setConfirmOpen(true)}
          disabled={busy || isPending}
        >
          Delete
        </Button>
      </Box>

      <RowError message={error} />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete review?"
        description={`Delete your review for ${displayTitle}?`}
        confirmLabel="Delete"
        busy={busy || isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
      />
    </Box>
  );
}

export function ProfileRows({
  ratings,
  reviews,
  titles,
  ratingsError,
  reviewsError,
}: {
  ratings: EnrichedRatedItem[];
  reviews: Review[];
  titles: TitleSummaryByKey;
  ratingsError?: string;
  reviewsError?: string;
}) {
  const hasRatings = ratings.length > 0;
  const hasReviews = reviews.length > 0;

  return (
    <Box sx={{ display: "grid", gap: { xs: 4, md: 5 } }}>
      <SummaryHeader rated={ratings.length} reviewed={reviews.length} />

      <Box sx={{ display: "grid", gap: { xs: 5, md: 7 } }}>
        <Box component="section" aria-labelledby="profile-ratings-heading">
          <SectionTitle
            id="profile-ratings-heading"
            title="Your ratings"
            count={ratings.length}
          />
          {ratingsError ? (
            <Alert severity="error">{ratingsError}</Alert>
          ) : hasRatings ? (
            <Box sx={{ display: "grid", gap: 2 }}>
              {ratings.map((item) => (
                <RatingRow key={item.id} item={item} titles={titles} />
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
          {reviewsError ? (
            <Alert severity="error">{reviewsError}</Alert>
          ) : hasReviews ? (
            <Box sx={{ display: "grid", gap: 2 }}>
              {/* /reviews/me is intentionally thin. The titles map carries
                  the per-id title + poster we resolved in profile/page.tsx
                  via /movies/{id} and /tv/{id}. */}
              {reviews.map((review) => (
                <ReviewRow key={review.id} review={review} titles={titles} />
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
    </Box>
  );
}
