"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
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
import {
  TITLE_ACCENT,
  titleAccentButtonSx,
  titleAccentRatingSx,
} from "@/lib/title-color";

export interface RatingControlProps {
  /** TMDB id of the title being rated (the detail route's [id]). */
  tmdbId: string;
  mediaType: MediaType;
  /** When true, stars + submit CTA read `--title-accent` (detail page only). */
  useTitleAccent?: boolean;
}

/**
 * 5-star half-star rating widget (maps to Group 1's 0–10 integer score).
 * Conversion: apiScore = Math.round(starValue * 2)  e.g. 3.5 stars → 7
 *
 * Mounted by the detail page as <RatingControl tmdbId mediaType />.
 * After a successful mutation calls router.refresh() so the server-rendered
 * aggregate on the detail page re-fetches without a manual reload.
 */
export function RatingControl({
  tmdbId,
  mediaType,
  useTitleAccent = false,
}: RatingControlProps) {
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
    let active = true;
    getMyRatings()
      .then((result) => {
        if (!active || !result.ok) return;
        const mine = result.data.find(
          (item) => item.tmdbId === tmdbId && item.mediaType === mediaType,
        );
        if (mine) {
          setExistingRatingId(mine.id);
          setStarValue(mine.score / 2);
          setSavedScore(mine.score);
        }
      })
      // A failed lookup must not strand the widget on "Loading…" forever — fall
      // through to the empty form (resolved in `finally`) so the user can rate.
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingExisting(false);
      });
    return () => {
      active = false;
    };
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
      if (result.error.status === 401) {
        // Token expired between render and submit. Clear the stale session so
        // the gate flips to the sign-in prompt instead of more 401s.
        await signOut({ redirect: false });
        return;
      }
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
      if (result.error.status === 401) {
        await signOut({ redirect: false });
        return;
      }
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
      {/* "Your rating" heading is owned by the parent section in the detail page. */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
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
              // Larger on touch: the default 24px stars are a cramped half-star
              // target on a phone, which read as "nothing to tap".
              fontSize: { xs: "2.3rem", sm: "1.9rem" },
              // Empty stars must stay legible in dark mode — MUI's default
              // `action.disabled` (~30% white) all but vanishes on the dark panel,
              // so the control looked empty/inert on mobile.
              "& .MuiRating-iconEmpty": { color: "text.secondary" },
              ...(useTitleAccent
                ? titleAccentRatingSx
                : {
                    "& .MuiRating-iconFilled": { color: "primary.main" },
                    "& .MuiRating-iconHover": { color: "primary.light" },
                  }),
            }}
          />
          {starValue !== null && (
            <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
              {Math.round(starValue * 2)} / 10
            </Typography>
          )}
        </Box>

        {savedScore !== null && !errorMessage && (
          <Typography
            sx={{
              color: useTitleAccent ? TITLE_ACCENT : "primary.main",
              fontSize: "0.85rem",
            }}
          >
            Saved — {savedScore} / 10
          </Typography>
        )}

        {errorMessage && (
          <Alert severity="error" role="alert">
            {errorMessage}
          </Alert>
        )}

        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={handleSubmit}
            disabled={busy || starValue === null}
            sx={useTitleAccent ? titleAccentButtonSx : undefined}
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
