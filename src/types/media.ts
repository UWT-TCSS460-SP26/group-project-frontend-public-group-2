// Placeholder shapes for Group 1's API responses.
// Refine these once Jonathan's API scout (docs/group-1-api-notes.md) maps
// the actual field names from /api-docs.

export interface Movie {
  id: number | string;
  title: string;
  posterUrl?: string | null;
  releaseYear?: number | string;
  overview?: string;
  rating?: number;
}

export interface SearchResults {
  results: Movie[];
  page?: number;
  totalPages?: number;
  totalResults?: number;
}
