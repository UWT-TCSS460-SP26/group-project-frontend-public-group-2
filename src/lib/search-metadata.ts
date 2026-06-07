import "server-only";

import { fetchGroupOneApi } from "@/lib/api";
import type { MediaType, Movie } from "@/types/media";

type UnknownRecord = Record<string, unknown>;

export interface SearchMetadataResult {
  failedCount: number;
  items: Movie[];
}

function asRecord(value: unknown): UnknownRecord | null {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string" || !value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function genreNames(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((genre) => {
      if (typeof genre === "string") return genre.trim();
      const record = asRecord(genre);
      return typeof record?.name === "string" ? record.name.trim() : "";
    })
    .filter(Boolean);
}

function hasTmdbData(payload: UnknownRecord): boolean {
  const tmdb = asRecord(payload.tmdb) ?? payload;
  return (
    tmdb.success !== false &&
    typeof tmdb.status_message !== "string" &&
    typeof tmdb.status_code !== "number"
  );
}

async function enrichOne(
  item: Movie,
  mediaType: MediaType,
): Promise<Movie | null> {
  try {
    const payload = await fetchGroupOneApi<UnknownRecord>(
      `/details/${mediaType}/${item.id}/enriched`,
      { init: { next: { revalidate: 3600 } } },
    );
    if (!hasTmdbData(payload)) return null;

    const tmdb = asRecord(payload.tmdb) ?? payload;
    return {
      ...item,
      genres: genreNames(tmdb.genres),
      rating: asNumber(tmdb.vote_average) ?? asNumber(tmdb.rating),
    };
  } catch {
    return null;
  }
}

/**
 * Search list responses omit genre and rating. Resolve those fields only when
 * advanced filters need them, preserving the partner's original result order.
 */
export async function enrichSearchMetadata(
  items: Movie[],
  mediaType: MediaType,
): Promise<SearchMetadataResult> {
  const enriched = await Promise.all(
    items.map((item) => enrichOne(item, mediaType)),
  );

  return {
    items: enriched.filter((item): item is Movie => item !== null),
    failedCount: enriched.filter((item) => item === null).length,
  };
}
