import { getMyReviews } from "@/lib/actions/reviews";
import type { MediaType, Review } from "@/types/media";

/** Paginated lookup for the signed-in user's review of a specific title. */
export async function findMyReviewForTitle(
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

/** Author id from any of the user's reviews (for matching enriched list items). */
export async function findMyAuthorId(): Promise<number | null> {
  const result = await getMyReviews({ page: 1, limit: 1 });
  if (!result.ok || result.data.results.length === 0) return null;
  return result.data.results[0]?.author.id ?? null;
}
