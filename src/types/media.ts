export interface Movie {
  id: number | string;
  title: string;
  posterUrl?: string | null;
  releaseYear?: number | string;
  overview?: string;
  rating?: number;
}

export interface GroupOneMovieResult {
  id: number | string;
  title?: string;
  name?: string;
  posterUrl?: string | null;
  poster_path?: string | null;
  poster?: string | null;
  releaseYear?: number | string;
  release_date?: string | null;
  first_air_date?: string | null;
  overview?: string;
  rating?: number;
  vote_average?: number;
}

export interface SearchResults<T = Movie> {
  results: T[];
  page?: number;
  totalPages?: number;
  totalResults?: number;
}
