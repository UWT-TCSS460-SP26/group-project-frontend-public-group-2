"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { deleteReview } from "@/lib/actions/reviews";
import { ConfirmDialog } from "./ConfirmDialog";
import {
  useReviewsContext,
  type DisplayReview,
} from "./reviews-context";

function reviewBody(review: DisplayReview): string {
  return review.description ?? review.body ?? "No review text provided.";
}

function formatReviewDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toLocaleDateString();
}

/**
 * Renders community reviews for a title. Mount inside {@link ReviewsProvider}
 * alongside {@link ReviewForm} so list-initiated edits populate the form and
 * `router.refresh()` keeps the list in sync after create/update/delete.
 */
export function ReviewList() {
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const {
    reviews,
    loadingOwnership,
    isOwnReview,
    requestEditReview,
    notifyReviewDeleted,
  } = useReviewsContext();

  const [deleteTarget, setDeleteTarget] = useState<DisplayReview | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setDeleteBusy(true);
    setActionError(null);

    try {
      const result = await deleteReview(deleteTarget.id);

      if (result.ok) {
        notifyReviewDeleted(deleteTarget.id);
        setDeleteTarget(null);
        router.refresh();
        return;
      }

      setActionError(result.error.message);
    } finally {
      setDeleteBusy(false);
    }
  };

  if (reviews.length === 0) {
    return (
      <Typography sx={{ color: "text.secondary" }}>
        No community reviews yet.
      </Typography>
    );
  }

  return (
    <>
      {actionError && (
        <Alert severity="error" role="alert" sx={{ mb: 2 }}>
          {actionError}
        </Alert>
      )}

      <Box
        component="ul"
        sx={{
          display: "grid",
          gap: 2,
          mt: 2,
          listStyle: "none",
          m: 0,
          p: 0,
        }}
        aria-label="Community reviews"
      >
        {reviews.map((review) => {
          const own =
            sessionStatus === "authenticated" &&
            !loadingOwnership &&
            isOwnReview(review);
          const reviewDate = formatReviewDate(review.createdAt);

          return (
            <Box
              component="li"
              key={review.id}
              sx={{
                p: 2,
                border: "1px solid",
                borderColor: own ? "primary.main" : "divider",
                borderRadius: 1,
                bgcolor: "background.paper",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 2,
                  mb: 0.5,
                }}
              >
                <Typography sx={{ fontWeight: 600 }}>
                  {review.title ?? "Review"}
                </Typography>
                {own && (
                  <Typography
                    variant="caption"
                    sx={{ color: "primary.main", whiteSpace: "nowrap" }}
                  >
                    Your review
                  </Typography>
                )}
              </Box>

              <Typography sx={{ color: "text.secondary", mb: 0.5 }}>
                {reviewBody(review)}
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                }}
              >
                <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
                  {review.author?.displayName ?? "Anonymous"}
                  {reviewDate ? ` • ${reviewDate}` : ""}
                </Typography>

                {own && (
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setActionError(null);
                        requestEditReview(review);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => {
                        setActionError(null);
                        setDeleteTarget(review);
                      }}
                    >
                      Delete
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>

      {sessionStatus === "authenticated" && loadingOwnership && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <CircularProgress size={22} aria-label="Loading your review" />
        </Box>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete review?"
        description="This permanently removes your review for this title."
        confirmLabel="Delete review"
        busy={deleteBusy}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          if (!deleteBusy) setDeleteTarget(null);
        }}
      />
    </>
  );
}

export { ReviewsProvider } from "./reviews-context";
export type { DisplayReview, ReviewsProviderProps } from "./reviews-context";
