import "server-only";

import { fetchGroupOneApi } from "@/lib/api";
import { enrichTitles } from "@/lib/enrich-titles";
import { titleKey } from "@/lib/title-summary";
import type { TitleSummaryByKey } from "@/lib/title-summary";
import type { MediaType } from "@/types/media";

const COMMUNITY_RAIL_LIMIT = 12;
const COMMUNITY_REVALIDATE_SECONDS = 300;

type UnknownRecord = Record<string, unknown>;

interface CommunityRatingsResponse {
  results?: unknown[];
}

interface RawCommunityRating {
  tmdbId: string;
  mediaType: MediaType;
  _avg: {
    score: number | null;
  };
  _count: {
    score: number;
  };
}

export interface CommunityRailItem {
  tmdbId: string;
  mediaType: MediaType;
  title: string;
  poster_path: string | null;
  releaseYear?: number;
  resolved: boolean;
  _avg: {
    score: number | null;
  };
  _count: {
    score: number;
  };
}

export interface CommunityRails {
  topRated: CommunityRailItem[];
  mostReviewed: CommunityRailItem[];
}

function asRecord(value: unknown): UnknownRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as UnknownRecord;
}

function asString(value: unknown): string | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function asMediaType(value: unknown): MediaType | undefined {
  return value === "movie" || value === "tv" ? value : undefined;
}

function mediaLabel(mediaType: MediaType) {
  return mediaType === "tv" ? "TV show" : "Movie";
}

function normalizeCommunityRating(value: unknown): RawCommunityRating | null {
  const item = asRecord(value);
  if (!item) return null;

  const tmdbId = asString(item.tmdbId);
  const mediaType = asMediaType(item.mediaType);
  if (!tmdbId || !mediaType) return null;

  const avg = asRecord(item._avg);
  const count = asRecord(item._count);

  return {
    tmdbId,
    mediaType,
    _avg: {
      score: asNumber(avg?.score) ?? null,
    },
    _count: {
      score: asNumber(count?.score) ?? 0,
    },
  };
}

async function fetchCommunityRatings(path: string): Promise<RawCommunityRating[]> {
  const payload = await fetchGroupOneApi<CommunityRatingsResponse | unknown[]>(path, {
    init: { next: { revalidate: COMMUNITY_REVALIDATE_SECONDS } },
  });
  const rawItems = Array.isArray(payload) ? payload : payload.results;
  if (!Array.isArray(rawItems)) return [];

  return rawItems
    .map(normalizeCommunityRating)
    .filter((item): item is RawCommunityRating => Boolean(item))
    .slice(0, COMMUNITY_RAIL_LIMIT);
}

function toRailItems(
  items: RawCommunityRating[],
  titles: TitleSummaryByKey,
): CommunityRailItem[] {
  return items.map((item) => {
    const summary = titles[titleKey(item.mediaType, item.tmdbId)];

    return {
      tmdbId: item.tmdbId,
      mediaType: item.mediaType,
      title: summary?.title ?? `${mediaLabel(item.mediaType)} ${item.tmdbId}`,
      poster_path: summary?.posterPath ?? null,
      releaseYear: summary?.releaseYear,
      resolved: Boolean(summary),
      _avg: item._avg,
      _count: item._count,
    };
  });
}

async function buildCommunityRail(path: string): Promise<CommunityRailItem[]> {
  const rawItems = await fetchCommunityRatings(path);
  const titles = await enrichTitles(rawItems, {
    init: { next: { revalidate: COMMUNITY_REVALIDATE_SECONDS } },
  });

  return toRailItems(rawItems, titles);
}

export async function getCommunityRails(): Promise<CommunityRails> {
  const [topRated, mostReviewed] = await Promise.all([
    buildCommunityRail("/ratings/top-rated"),
    buildCommunityRail("/ratings/most-reviewed"),
  ]);

  return {
    topRated,
    mostReviewed,
  };
}

export async function getTopRatedCommunityTitles(): Promise<CommunityRailItem[]> {
  return buildCommunityRail("/ratings/top-rated");
}

export async function getMostReviewedCommunityTitles(): Promise<CommunityRailItem[]> {
  return buildCommunityRail("/ratings/most-reviewed");
}
