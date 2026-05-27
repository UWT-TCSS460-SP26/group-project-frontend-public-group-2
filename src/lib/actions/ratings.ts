"use server";

import { fetchGroupOneApi } from "@/lib/api";
import type {
  ActionResult,
  EnrichedRatedItem,
  Rating,
  RatingInput,
} from "@/types/media";
import { fail, ok } from "./result";

const SCORE_MESSAGE = "Score must be a whole number from 0 to 10.";

function invalidScore(score: number): boolean {
  return !Number.isInteger(score) || score < 0 || score > 10;
}

/** POST /ratings — create a rating (score 0–10) for the authenticated user. */
export async function createRating(
  input: RatingInput,
): Promise<ActionResult<Rating>> {
  if (invalidScore(input.score)) {
    return {
      ok: false,
      error: { status: 400, message: SCORE_MESSAGE, fieldErrors: { score: [SCORE_MESSAGE] } },
    };
  }
  try {
    const data = await fetchGroupOneApi<Rating>("/ratings", {
      method: "POST",
      body: input,
      withAuth: true,
    });
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

/** PUT /ratings/{id} — change the score of a rating the user owns. */
export async function updateRating(
  id: number,
  input: { score: number },
): Promise<ActionResult<Rating>> {
  if (invalidScore(input.score)) {
    return {
      ok: false,
      error: { status: 400, message: SCORE_MESSAGE, fieldErrors: { score: [SCORE_MESSAGE] } },
    };
  }
  try {
    const data = await fetchGroupOneApi<Rating>(`/ratings/${id}`, {
      method: "PUT",
      body: input,
      withAuth: true,
    });
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

/** DELETE /ratings/{id} — remove a rating the user owns (204, no body). */
export async function deleteRating(id: number): Promise<ActionResult<void>> {
  try {
    await fetchGroupOneApi<void>(`/ratings/${id}`, {
      method: "DELETE",
      withAuth: true,
    });
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

/**
 * GET /ratings/me/items — the user's ratings, TMDB-enriched. Use for the
 * profile ratings list, and to find the user's existing score for a title
 * (there is no single "my rating for this title" endpoint — filter this).
 */
export async function getMyRatings(): Promise<ActionResult<EnrichedRatedItem[]>> {
  try {
    const data = await fetchGroupOneApi<EnrichedRatedItem[]>(
      "/ratings/me/items",
      { withAuth: true },
    );
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
