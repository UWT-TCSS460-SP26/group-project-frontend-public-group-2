"use client";

import { useCallback, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  createReview,
  getMyReviews,
  updateReview,
} from "@/lib/actions/reviews";
import type { MediaType, Review } from "@/types/media";
import { SignInPrompt } from "./SignInPrompt";

export interface ReviewFormProps {
  /** TMDB id of the title being reviewed (the detail route's [id]). */
  tmdbId: string;
  mediaType: MediaType;
}

type FormMode = "create" | "edit";

interface FieldErrors {
  title?: string;
  body?: string;
}

const BODY_RANGE_MESSAGE = "Review must be between 1 and 5000 characters.";
const BODY_REQUIRED_MESSAGE = "Review text is required.";

function mapServerFieldErrors(
  fieldErrors?: Record<string, string[]>,
): FieldErrors {
  return {
    title: fieldErrors?.title?.[0],
    body: fieldErrors?.body?.[0] ?? fieldErrors?.description?.[0],
  };
}

function hasFieldErrors(errors: FieldErrors): boolean {
  return Boolean(errors.title || errors.body);
}

function validateBody(body: string): string | undefined {
  const trimmed = body.trim();
  if (trimmed.length < 1) return BODY_REQUIRED_MESSAGE;
  if (trimmed.length > 5000) return BODY_RANGE_MESSAGE;
  return undefined;
}

async function findExistingReview(
  tmdbId: string,
  mediaType: MediaType,
): Promise<Review | null> {
  let page = 1;
  const limit = 50;

  while (true) {
    const result = await getMyReviews({ page, limit });
    if (!result.ok) return null;

    const match = result.data.results.find(
      (review) => review.tmdbId === tmdbId && review.mediaType === mediaType,
    );
    if (match) return match;

    if (page >= result.data.totalPages) break;
    page += 1;
  }

  return null;
}

/**
 * Create / edit review form for a title. On a 409 from create, loads the user's
 * existing review and switches into edit mode (`updateReview` uses `description`).
 *
 * After a successful create/update, calls `router.refresh()` so the detail page
 * refetches the enriched review list.
 */
export function ReviewForm({ tmdbId, mediaType }: ReviewFormProps) {
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const formId = useId();
  const titleFieldId = `${formId}-title`;
  const bodyFieldId = `${formId}-body`;

  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<FormMode>("create");
  const [reviewId, setReviewId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  const focusFirstError = useCallback((errors: FieldErrors) => {
    if (errors.title) {
      titleRef.current?.focus();
      return;
    }
    if (errors.body) {
      bodyRef.current?.focus();
    }
  }, []);

  const enterEditMode = useCallback(async (notice?: string) => {
    const existing = await findExistingReview(tmdbId, mediaType);
    if (!existing) {
      setFormError(
        notice ??
          "You already reviewed this title, but we could not load your review. Try refreshing the page.",
      );
      return;
    }

    setMode("edit");
    setReviewId(existing.id);
    setTitle(existing.title ?? "");
    setBody(existing.description ?? "");
    setFieldErrors({});
    setFormError(null);
    setSuccessMessage(
      notice ?? "You already reviewed this title. Update your review below.",
    );
    successRef.current?.focus();
  }, [mediaType, tmdbId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const nextFieldErrors: FieldErrors = {};
    const bodyError = validateBody(body);
    if (bodyError) nextFieldErrors.body = bodyError;

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      focusFirstError(nextFieldErrors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();

    try {
      if (mode === "create") {
        const result = await createReview({
          tmdbId,
          mediaType,
          ...(trimmedTitle ? { title: trimmedTitle } : {}),
          body: trimmedBody,
        });

        if (result.ok) {
          setTitle("");
          setBody("");
          setSuccessMessage("Review posted successfully.");
          router.refresh();
          successRef.current?.focus();
          return;
        }

        if (result.error.status === 401) {
          setSessionExpired(true);
          return;
        }

        if (result.error.status === 409) {
          await enterEditMode(
            "You already reviewed this title. Update your review below.",
          );
          return;
        }

        const mapped = mapServerFieldErrors(result.error.fieldErrors);
        if (hasFieldErrors(mapped)) {
          setFieldErrors(mapped);
          focusFirstError(mapped);
          return;
        }

        setFormError(result.error.message);
        return;
      }

      if (reviewId === null) {
        setFormError("Missing review id for update.");
        return;
      }

      const result = await updateReview(reviewId, {
        ...(trimmedTitle ? { title: trimmedTitle } : {}),
        description: trimmedBody,
      });

      if (result.ok) {
        setSuccessMessage("Review updated successfully.");
        router.refresh();
        successRef.current?.focus();
        return;
      }

      if (result.error.status === 401) {
        setSessionExpired(true);
        return;
      }

      const mapped = mapServerFieldErrors(result.error.fieldErrors);
      if (hasFieldErrors(mapped)) {
        setFieldErrors(mapped);
        focusFirstError(mapped);
        return;
      }

      setFormError(result.error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (sessionStatus === "loading") {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
        <CircularProgress size={28} aria-label="Loading review form" />
      </Box>
    );
  }

  if (sessionStatus === "unauthenticated" || sessionExpired) {
    return <SignInPrompt action="write a review" />;
  }

  const submitLabel = mode === "create" ? "Post review" : "Update review";

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      noValidate
      aria-label={
        mode === "create"
          ? `Write a review for ${mediaType} ${tmdbId}`
          : `Edit your review for ${mediaType} ${tmdbId}`
      }
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        p: 2,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        bgcolor: "background.paper",
      }}
    >
      {mode === "edit" && (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Editing your review
        </Typography>
      )}

      {successMessage && (
        <Box
          ref={successRef}
          tabIndex={-1}
          role="status"
          aria-live="polite"
          sx={{ outline: "none" }}
        >
          <Alert severity="success">{successMessage}</Alert>
        </Box>
      )}

      {formError && (
        <Alert severity="error" role="alert">
          {formError}
        </Alert>
      )}

      <TextField
        id={titleFieldId}
        inputRef={titleRef}
        label="Review title (optional)"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        disabled={submitting}
        fullWidth
        error={Boolean(fieldErrors.title)}
        helperText={fieldErrors.title}
        slotProps={{
          formHelperText: { id: `${titleFieldId}-helper-text` },
          htmlInput: {
            "aria-describedby": fieldErrors.title
              ? `${titleFieldId}-helper-text`
              : undefined,
          },
        }}
      />

      <TextField
        id={bodyFieldId}
        inputRef={bodyRef}
        label="Review"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        disabled={submitting}
        required
        fullWidth
        multiline
        minRows={4}
        error={Boolean(fieldErrors.body)}
        helperText={
          fieldErrors.body ??
          `${body.trim().length} / 5000 characters`
        }
        slotProps={{
          formHelperText: { id: `${bodyFieldId}-helper-text` },
          htmlInput: {
            "aria-describedby": `${bodyFieldId}-helper-text`,
            "aria-required": true,
            maxLength: 5000,
          },
        }}
      />

      <Box>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={submitting}
          startIcon={
            submitting ? (
              <CircularProgress size={18} color="inherit" aria-hidden />
            ) : undefined
          }
        >
          {submitting ? "Saving…" : submitLabel}
        </Button>
      </Box>
    </Box>
  );
}
