import type { MediaType } from "@/types/media";

// Shared shape + key helper for the per-id title/poster enrichment used by the
// profile page. Lives in its own file (no server-only deps) so client
// components can import it without dragging `api.ts` into the client bundle.

export interface TitleSummary {
  title: string;
  posterPath: string | null;
  releaseYear?: number;
}

/** Serialized lookup keyed by `${mediaType}:${tmdbId}` for client props. */
export type TitleSummaryByKey = Record<string, TitleSummary>;

export function titleKey(mediaType: MediaType, tmdbId: string): string {
  return `${mediaType}:${tmdbId}`;
}
