import { fetchGroupOneApi } from "@/lib/api";
import type { MediaType } from "@/types/media";
import { titleKey, type TitleSummary, type TitleSummaryByKey } from "./title-summary";

// Group 1's bulk `/ratings/me/items` enrichment silently misses some TMDB ids
// (returns `tmdb: null` / `tmdbMissing: true`), and `/reviews/me` is never
// enriched at all. We fall back to the per-item read endpoints, which are
// public, lightweight, and reliable for the same ids — see
// docs/group-1-write-api.md.

type UnknownRecord = Record<string, unknown>;

interface EnrichTitlesOptions {
  init?: RequestInit;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function asRecord(value: unknown): UnknownRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as UnknownRecord;
}

function asYear(value: unknown): number | undefined {
  const s = asString(value);
  if (!s) return undefined;
  const year = Number(s.slice(0, 4));
  return Number.isFinite(year) ? year : undefined;
}

function hasTmdbErrorEnvelope(payload: UnknownRecord): boolean {
  return (
    payload.success === false
    || typeof payload.status_code === "number"
    || typeof payload.status_message === "string"
  );
}

function toSummary(payload: UnknownRecord): TitleSummary | null {
  const tmdb = asRecord(payload.tmdb) ?? payload;
  if (hasTmdbErrorEnvelope(tmdb)) return null;

  const title =
    asString(tmdb.title)
    ?? asString(tmdb.name)
    ?? asString(tmdb.original_title)
    ?? asString(tmdb.original_name);
  if (!title) return null;

  return {
    title,
    posterPath: asString(tmdb.poster_path) ?? null,
    releaseYear: asYear(tmdb.release_date) ?? asYear(tmdb.first_air_date),
  };
}

async function fetchByType(
  mediaType: MediaType,
  tmdbId: string,
  options: EnrichTitlesOptions,
): Promise<TitleSummary | null> {
  const path = mediaType === "movie" ? `/movies/${tmdbId}` : `/tv/${tmdbId}`;
  try {
    const payload = await fetchGroupOneApi<UnknownRecord>(path, {
      // Avoid sticky "details unavailable" rows when upstream TMDB or the
      // partner service has a transient miss; always refetch on profile loads.
      init: options.init ?? { cache: "no-store" },
    });
    return toSummary(payload);
  } catch {
    return null;
  }
}

async function fetchOne(
  mediaType: MediaType,
  tmdbId: string,
  options: EnrichTitlesOptions,
): Promise<TitleSummary | null> {
  const primary = await fetchByType(mediaType, tmdbId, options);
  if (primary) return primary;

  // Defensive fallback: older data can contain the wrong mediaType.
  const alternate: MediaType = mediaType === "movie" ? "tv" : "movie";
  return fetchByType(alternate, tmdbId, options);
}

/**
 * Resolve `{mediaType, tmdbId}` pairs to title + poster summaries, in parallel,
 * deduped by key. Returns a plain object keyed by `mediaType:tmdbId`; lookup misses
 * (e.g. an id that genuinely doesn't exist on TMDB) are omitted.
 */
export async function enrichTitles(
  pairs: { mediaType: MediaType; tmdbId: string }[],
  options: EnrichTitlesOptions = {},
): Promise<TitleSummaryByKey> {
  const unique = new Map<string, { mediaType: MediaType; tmdbId: string }>();
  for (const pair of pairs) {
    unique.set(titleKey(pair.mediaType, pair.tmdbId), pair);
  }

  const entries = await Promise.all(
    Array.from(unique.values()).map(async (pair) => {
      const summary = await fetchOne(pair.mediaType, pair.tmdbId, options);
      return [titleKey(pair.mediaType, pair.tmdbId), summary] as const;
    }),
  );

  const out: TitleSummaryByKey = {};
  for (const [key, summary] of entries) {
    if (summary) out[key] = summary;
  }
  return out;
}
