"use server";

import { fetchGroupOneApi } from "@/lib/api";
import type {
  ActionResult,
  MyReviewsResponse,
  Review,
  ReviewInput,
  ReviewUpdateInput,
} from "@/types/media";
import { fail, ok } from "./result";

/**
 * POST /reviews — create a review. `title` optional, `body` required (1–5000).
 * Note callers must handle two non-generic failures via the returned error:
 *   - status 409 → the user already reviewed this (mediaType, tmdbId)
 *   - status 400 → `error.fieldErrors` carries Zod field messages
 */
export async function createReview(
  input: ReviewInput,
): Promise<ActionResult<Review>> {
  const bodyLength = input.body?.trim().length ?? 0;
  if (bodyLength < 1 || bodyLength > 5000) {
    const message = "Review must be between 1 and 5000 characters.";
    return {
      ok: false,
      error: { status: 400, message, fieldErrors: { body: [message] } },
    };
  }
  try {
    const data = await fetchGroupOneApi<Review>("/reviews", {
      method: "POST",
      body: input,
      withAuth: true,
    });
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

/** PUT /reviews/{id} — update a review the user owns. Send `description`, not `body`. */
export async function updateReview(
  id: number,
  input: ReviewUpdateInput,
): Promise<ActionResult<Review>> {
  try {
    const data = await fetchGroupOneApi<Review>(`/reviews/${id}`, {
      method: "PUT",
      body: input,
      withAuth: true,
    });
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

/** DELETE /reviews/{id} — remove a review the user owns (204, no body). */
export async function deleteReview(id: number): Promise<ActionResult<void>> {
  try {
    await fetchGroupOneApi<void>(`/reviews/${id}`, {
      method: "DELETE",
      withAuth: true,
    });
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

/** GET /reviews/me — the user's reviews, paginated (NOT TMDB-enriched). */
export async function getMyReviews(
  params: { page?: number; limit?: number } = {},
): Promise<ActionResult<MyReviewsResponse>> {
  try {
    const data = await fetchGroupOneApi<MyReviewsResponse>("/reviews/me", {
      withAuth: true,
      query: { page: params.page, limit: params.limit },
    });
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
