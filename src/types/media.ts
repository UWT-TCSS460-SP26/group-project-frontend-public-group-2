// Reconciled against Group 1's authoritative OpenAPI spec (group1openapi.yaml, 2026-05-24).
// Read endpoints (Sprint 6):
//   GET /movies/search   → MovieSearchResponse  (SearchResults below)
//   GET /movies/popular  → PopularMoviesResponse (same Movie item shape)
//   GET /movies/{id}     → MovieDetailsResponse  (detail page uses UnknownRecord — see title/[id]/page.tsx)
// Write endpoints (Sprint 7): see Rating/Review types + src/lib/actions/*. Quirks live
// in docs/group-1-write-api.md.

/**
 * TMDB image CDN base URL.
 * Prepend to poster_path / backdrop_path to build a full image URL.
 * The path from the API already includes the leading slash.
 *
 * Usage: `${TMDB_IMG_BASE}${movie.poster_path}`
 *   e.g. "https://image.tmdb.org/t/p/w500/abc123.jpg"
 */
export const TMDB_IMG_BASE = "https://image.tmdb.org/t/p/w500";

/** Group 1 only models movies and TV shows. */
export type MediaType = "movie" | "tv";

/**
 * One result item from GET /movies/search or GET /movies/popular.
 * All fields are required per the Group 1 OpenAPI spec.
 */
export interface Movie {
  id: number;
  title: string;
  overview: string;
  /** Relative TMDB path e.g. "/abc123.jpg". Prepend TMDB_IMG_BASE. Null when TMDB has no poster. */
  poster_path: string | null;
  /** ISO 8601 date string "YYYY-MM-DD". Slice [0, 4] for the 4-digit display year. */
  release_date: string;
  language: string;
}

/**
 * Paginated envelope returned by GET /movies/search.
 */
export interface SearchResults {
  query: string;
  language: string;
  page: number;
  results: Movie[];
}

// ---------------------------------------------------------------------------
// Sprint 7 — ratings & reviews (write surface)
// ---------------------------------------------------------------------------

/** Stable identity for whoever authored a rating or review. */
export interface Author {
  id: number;
  displayName: string;
}

/** A user-submitted numeric rating. Response shape from POST/PUT/GET /ratings. */
export interface Rating {
  id: number;
  userId: number;
  /** Integer 0–10. */
  score: number;
  tmdbId: string;
  mediaType: MediaType;
  author: Author;
  createdAt?: string;
  updatedAt?: string;
}

/** A user-submitted text review. Response shape from POST/PUT/GET /reviews. */
export interface Review {
  id: number;
  userId: number;
  title: string;
  /** The review text. NOTE: on POST you send `body`; the API stores/returns it here as `description`. */
  description: string;
  tmdbId: string;
  mediaType: MediaType;
  author: Author;
  createdAt?: string;
  updatedAt?: string;
}

/** Request body for POST /ratings. */
export interface RatingInput {
  tmdbId: string;
  mediaType: MediaType;
  /** Integer 0–10. */
  score: number;
}

/** Request body for POST /reviews. `title` optional; `body` (1–5000) is required. */
export interface ReviewInput {
  tmdbId: string;
  mediaType: MediaType;
  title?: string;
  /** 1–5000 chars. Stored/returned as `description` on the Review response. */
  body: string;
}

/** Request body for PUT /reviews/{id}. Both fields optional. NOTE: `description`, not `body`. */
export interface ReviewUpdateInput {
  title?: string;
  description?: string;
}

/** GET /ratings/me (paginated, NOT TMDB-enriched). */
export interface MyRatingsResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  results: Rating[];
}

/** GET /reviews/me (paginated, NOT TMDB-enriched). */
export interface MyReviewsResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  results: Review[];
}

/**
 * GET /ratings/me/items — the authenticated user's ratings enriched with TMDB
 * metadata. Use this for the profile ratings list. `tmdbMissing` is true when
 * the TMDB lookup failed (then `tmdb` may be empty).
 */
export interface EnrichedRatedItem {
  id: number;
  score: number;
  tmdbId: string;
  mediaType: MediaType;
  tmdbMissing: boolean;
  author: Author;
  tmdb: {
    title?: string;
    name?: string;
    poster_path?: string | null;
    [key: string]: unknown;
  };
}

/** GET /ratings/media/{mediaType}/{tmdbId} — community ratings + aggregate. */
export interface RatingsListResponse {
  page: number;
  limit: number;
  total: number;
  /** Average across all ratings for this media item. 0 when none. */
  averageScore: number;
  results: Rating[];
}

/** GET /reviews/media/{mediaType}/{tmdbId} — community reviews, newest first. */
export interface ReviewsListResponse {
  page: number;
  limit: number;
  results: Review[];
}

// ---------------------------------------------------------------------------
// Server Action result envelope
// ---------------------------------------------------------------------------

/**
 * Normalized error carried back from a Server Action. We return this instead of
 * throwing because Next.js strips custom error fields (status, fieldErrors) when
 * an error crosses the Server Action → client boundary.
 */
export interface ActionError {
  /** HTTP status from Group 1, or 0 for a network/unexpected error. */
  status: number;
  message: string;
  /** Optional diagnostic detail from Group 1's ErrorResponse. */
  detail?: string;
  /** Field-level messages from a Zod 400 (POST /reviews). */
  fieldErrors?: Record<string, string[]>;
}

/** Every write/read Server Action returns this so callers branch on `.ok`. */
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ActionError };
