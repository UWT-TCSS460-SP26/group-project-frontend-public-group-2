"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { SectionHeading } from "@/components/SectionHeading";
import { deleteRating, updateRating } from "@/lib/actions/ratings";
import { deleteReview, updateReview } from "@/lib/actions/reviews";
import type { EnrichedRatedItem, Review } from "@/types/media";
import { TMDB_IMG_BASE } from "@/types/media";

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
      <SectionHeading id={id} mb={0}>
        {title}
      </SectionHeading>
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

function RowError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <Alert severity="error" sx={{ mt: 2 }}>
      {message}
    </Alert>
  );
}

function RatingRow({ item }: { item: EnrichedRatedItem }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [score, setScore] = useState(String(item.score));
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const title = ratingTitle(item);
  const imageUrl = posterUrl(item.tmdb.poster_path);

  async function saveRating() {
    setError(null);
    setBusy(true);
    const nextScore = Number(score);
    const result = await updateRating(item.id, { score: nextScore });
    if (!result.ok) {
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
          <Typography
            component={Link}
            href={`/title/${item.tmdbId}`}
            sx={{
              color: "inherit",
              textDecoration: "none",
              fontWeight: 700,
              "&:hover": { color: "primary.main" },
            }}
          >
            {title}
          </Typography>
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
              <Typography sx={{ fontWeight: 700, fontSize: "1.25rem" }}>
                {item.score}/10
              </Typography>
              <Typography sx={{ color: "text.secondary", fontSize: "0.8rem" }}>
                your rating
              </Typography>
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

function ReviewRow({ review }: { review: Review }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(review.title ?? "");
  const [description, setDescription] = useState(review.description ?? "");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const date = formatDate(review.updatedAt ?? review.createdAt);
  const displayTitle = review.title || `${mediaLabel(review.mediaType)} ${review.tmdbId}`;

  async function saveReview() {
    setError(null);
    setBusy(true);
    const result = await updateReview(review.id, {
      title: title.trim() || undefined,
      description: description.trim() || undefined,
    });
    if (!result.ok) {
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
        <>
          <Typography
            component={Link}
            href={`/title/${review.tmdbId}`}
            sx={{
              color: "inherit",
              textDecoration: "none",
              fontWeight: 700,
              "&:hover": { color: "primary.main" },
            }}
          >
            {displayTitle}
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
        </>
      )}

      <Typography sx={{ mt: 1, color: "text.secondary", fontSize: "0.85rem" }}>
        {mediaLabel(review.mediaType)} - TMDB {review.tmdbId}
        {date ? ` - ${date}` : ""}
      </Typography>

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
  ratingsError,
  reviewsError,
}: {
  ratings: EnrichedRatedItem[];
  reviews: Review[];
  ratingsError?: string;
  reviewsError?: string;
}) {
  const hasRatings = ratings.length > 0;
  const hasReviews = reviews.length > 0;

  return (
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
        {reviewsError ? (
          <Alert severity="error">{reviewsError}</Alert>
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
  );
}
