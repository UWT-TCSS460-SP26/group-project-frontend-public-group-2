import { NextResponse } from "next/server";
import { fetchGroupOneApi } from "@/lib/api";
import { titleHref } from "@/lib/title-route";
import type { MediaType, Movie, SearchResults } from "@/types/media";

const RESULT_LIMIT = 6;

interface TvTitle {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  first_air_date?: string;
  release_date?: string;
  language: string;
}

interface TvResults {
  results: TvTitle[];
}

interface CommandSearchResult {
  id: string;
  href: string;
  title: string;
  mediaType: MediaType;
  year?: string;
}

function yearFrom(value?: string) {
  return value && value.length >= 4 ? value.slice(0, 4) : undefined;
}

function movieResult(movie: Movie): CommandSearchResult {
  return {
    id: `movie-${movie.id}`,
    href: titleHref("movie", movie.id),
    title: movie.title,
    mediaType: "movie",
    year: yearFrom(movie.release_date),
  };
}

function tvResult(show: TvTitle): CommandSearchResult {
  return {
    id: `tv-${show.id}`,
    href: titleHref("tv", show.id),
    title: show.title ?? show.name ?? "Untitled",
    mediaType: "tv",
    year: yearFrom(show.first_air_date ?? show.release_date),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return NextResponse.json({ results: [] satisfies CommandSearchResult[] });
  }

  const [movieData, tvData] = await Promise.all([
    fetchGroupOneApi<SearchResults>("/movies/search", {
      query: { query },
    }).catch(() => null),
    fetchGroupOneApi<TvResults>("/tv/search", {
      query: { query },
    }).catch(() => null),
  ]);

  return NextResponse.json({
    results: [
      ...(movieData?.results ?? []).slice(0, RESULT_LIMIT).map(movieResult),
      ...(tvData?.results ?? []).slice(0, RESULT_LIMIT).map(tvResult),
    ],
  });
}
