// Reconciled against Group 1's authoritative OpenAPI spec (api-1.yaml, 2026-05-24).
// Endpoints covered here:
//   GET /movies/search   → MovieSearchResponse  (SearchResults below)
//   GET /movies/popular  → PopularMoviesResponse (same Movie item shape)
//   GET /movies/{id}     → MovieDetailsResponse  (detail page uses UnknownRecord — see title/[id]/page.tsx)

/**
 * TMDB image CDN base URL.
 * Prepend to poster_path / backdrop_path to build a full image URL.
 * The path from the API already includes the leading slash.
 *
 * Usage: `${TMDB_IMG_BASE}${movie.poster_path}`
 *   e.g. "https://image.tmdb.org/t/p/w500/abc123.jpg"
 */
export const TMDB_IMG_BASE = "https://image.tmdb.org/t/p/w500";

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
