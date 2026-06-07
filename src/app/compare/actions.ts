"use server";

import { fetchGroupOneApi } from "@/lib/api";
import type { SearchResults } from "@/types/media";

/**
 * Server action used by the TitlePicker client component to search for titles.
 * fetchGroupOneApi is server-only so search must go through a server action.
 */
export async function searchForCompare(
  query: string,
  type: "movies" | "tv",
): Promise<SearchResults | null> {
  if (!query.trim()) return null;
  try {
    return await fetchGroupOneApi<SearchResults>(`/${type}/search`, {
      query: { query: query.trim() },
    });
  } catch {
    return null;
  }
}
