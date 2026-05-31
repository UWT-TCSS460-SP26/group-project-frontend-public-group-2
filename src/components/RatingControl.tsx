"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Rating from "@mui/material/Rating";
import Typography from "@mui/material/Typography";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { SignInPrompt } from "@/components/SignInPrompt";
import {
  createRating,
  deleteRating,
  getMyRatings,
  updateRating,
} from "@/lib/actions/ratings";
import type { MediaType } from "@/types/media";

export interface RatingControlProps {
  /** TMDB id of the title being rated (the detail route's [id]). */
  tmdbId: string;
  mediaType: MediaType;
}

/**
 * 5-star half-star rating widget (maps to Group 1's 0–10 integer score).
 * Conversion: apiScore = Math.round(starValue * 2)  e.g. 3.5 stars → 7
 *
 * Mounted by the detail page as <RatingControl tmdbId mediaType />.
 * After a successful mutation calls router.refresh() so the server-rendered
 * aggregate on the detail page re-fetches without a manual reload.
 */
export function RatingControl({ tmdbId, mediaType }: RatingControlProps) {
  const { status } = useSession();
  const router = useRouter();

  // Existing rating for this title (null = none or not loaded yet)
  const [existingRatingId, setExistingRatingId] = useState<number | null>(null);
  // Star widget value (0.5–5.0). null = nothing selected yet.
  const [starValue, setStarValue] = useState<number | null>(null);

  // Start in the loading state so we don't briefly flash the empty form while
  // the existing-rating lookup is in flight. Avoids a synchronous setState
  // inside useEffect (react-hooks/set-state-in-effect).
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [savedScore, setSavedScore] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // When authenticated, check whether this user already rated this title.
  useEffect(() => {
    if (status !== "authenticated") return;
    getMyRatings().then((result) => {
      setLoadingExisting(false);
      if (!result.ok) return;
      const mine = result.data.find(
        (item) => item.tmdbId === tmdbId && item.mediaType === mediaType,
      );
      if (mine) {
        setExistingRatingId(mine.id);
        setStarValue(mine.score / 2);
        setSavedScore(mine.score);
      }
    });
  }, [status, tmdbId, mediaType]);

  // ── Loading states ──────────────────────────────────────────────────────────

  if (status === "loading" || (status === "authenticated" && loadingExisting)) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 2 }}>
        <CircularProgress size={16} color="primary" />
        <Typography sx={{ color: "text.secondary", fontSize: "0.9rem" }}>
          Loading…
        </Typography>
      </Box>
    );
  }

  if (status === "unauthenticated") {
    return <SignInPrompt action="rate this title" />;
  }

  // ── Authenticated widget ────────────────────────────────────────────────────

  const busy = isSubmitting || isDeleting;

  async function handleSubmit() {
    const score = Math.round((starValue ?? 0) * 2);
    if (score < 0 || score > 10) return;

    setErrorMessage(null);
    setIsSubmitting(true);

    const result = existingRatingId
      ? await updateRating(existingRatingId, { score })
      : await createRating({ tmdbId, mediaType, score });

    setIsSubmitting(false);

    if (!result.ok) {
      setErrorMessage(result.error.message);
      return;
    }

    setExistingRatingId(result.data.id);
    setSavedScore(score);
    router.refresh();
  }

  async function handleDelete() {
    if (!existingRatingId) return;

    setErrorMessage(null);
    setIsDeleting(true);

    const result = await deleteRating(existingRatingId);

    setIsDeleting(false);
    setConfirmOpen(false);

    if (!result.ok) {
      setErrorMessage(result.error.message);
      return;
    }

    // Reset to unrated state
    setExistingRatingId(null);
    setStarValue(null);
    setSavedScore(null);
    router.refresh();
  }

  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Typography variant="overline" sx={{ color: "text.secondary" }}>
          Your rating
        </Typography>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Rating
            value={starValue}
            onChange={(_, newValue) => {
              setStarValue(newValue);
              setSavedScore(null);
              setErrorMessage(null);
            }}
            precision={0.5}
            max={5}
            disabled={busy}
            sx={{
              "& .MuiRating-iconFilled": { color: "primary.main" },
              "& .MuiRating-iconHover": { color: "primary.light" },
            }}
          />
          {starValue !== null && (
            <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
              {Math.round(starValue * 2)} / 10
            </Typography>
          )}
        </Box>

        {savedScore !== null && !errorMessage && (
          <Typography sx={{ color: "primary.main", fontSize: "0.85rem" }}>
            Saved — {savedScore} / 10
          </Typography>
        )}

        {errorMessage && (
          <Typography sx={{ color: "error.main", fontSize: "0.85rem" }}>
            {errorMessage}
          </Typography>
        )}

        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={handleSubmit}
            disabled={busy || starValue === null}
            startIcon={
              isSubmitting ? (
                <CircularProgress size={14} color="inherit" />
              ) : undefined
            }
          >
            {isSubmitting
              ? "Saving…"
              : existingRatingId
                ? "Update rating"
                : "Submit rating"}
          </Button>

          {existingRatingId && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={() => setConfirmOpen(true)}
              disabled={busy}
            >
              Remove rating
            </Button>
          )}
        </Box>
      </Box>

      <ConfirmDialog
        open={confirmOpen}
        title="Remove your rating?"
        description="This will delete your score for this title. You can rate it again any time."
        confirmLabel="Remove"
        confirmColor="error"
        busy={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
