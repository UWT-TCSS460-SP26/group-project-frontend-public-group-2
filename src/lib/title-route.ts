import type { MediaType } from "@/types/media";

export interface TitleIdentity {
  id: string | number;
  mediaType: MediaType;
}

export function titleIdentityKey({
  id,
  mediaType,
}: TitleIdentity): string {
  return `${mediaType}:${id}`;
}

export function titleHref(mediaType: MediaType, id: string | number): string {
  const params = new URLSearchParams({ type: mediaType });
  return `/title/${encodeURIComponent(String(id))}?${params.toString()}`;
}

export function parseMediaType(value: unknown): MediaType | undefined {
  return value === "movie" || value === "tv" ? value : undefined;
}
