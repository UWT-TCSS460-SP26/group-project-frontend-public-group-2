/**
 * Stable shared-element name used by the activated card and its detail poster.
 * The card name is applied only on activation so duplicate titles in separate
 * rails never mount with duplicate names.
 */
export function posterTransitionName(
  mediaType: "movie" | "tv",
  id: string | number,
): string {
  return `title-poster-${mediaType}-${String(id).replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}
