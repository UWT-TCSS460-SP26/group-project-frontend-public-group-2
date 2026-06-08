import type { Movie } from "@/types/media";

export interface SearchFilterParams {
  genre: string;
  yearFrom: number | null;
  yearTo: number | null;
  minRating: number | null;
  sort: string;
}

export function yearOf(item: Movie): number {
  return (
    Number.parseInt(
      (item.release_date ?? item.first_air_date ?? "0").slice(0, 4),
      10,
    ) || 0
  );
}

export function filterAndSortSearchResults(
  items: Movie[],
  params: SearchFilterParams,
): Movie[] {
  let result = [...items];

  if (params.yearFrom !== null || params.yearTo !== null) {
    result = result.filter((item) => {
      const year = yearOf(item);
      if (!year) return false;
      if (params.yearFrom !== null && year < params.yearFrom) return false;
      if (params.yearTo !== null && year > params.yearTo) return false;
      return true;
    });
  }

  if (params.genre) {
    result = result.filter(
      (item) =>
        item.genres?.some(
          (genre) => genre.toLowerCase() === params.genre.toLowerCase(),
        ) ?? false,
    );
  }

  if (params.minRating !== null) {
    result = result.filter(
      (item) =>
        item.rating !== undefined && item.rating >= params.minRating!,
    );
  }

  if (params.sort === "year_desc") {
    result.sort((a, b) => yearOf(b) - yearOf(a));
  } else if (params.sort === "year_asc") {
    result.sort((a, b) => yearOf(a) - yearOf(b));
  } else if (params.sort === "title") {
    result.sort((a, b) => a.title.localeCompare(b.title));
  }

  return result;
}
