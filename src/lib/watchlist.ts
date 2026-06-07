"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { titleIdentityKey } from "@/lib/title-route";
import type { MediaType } from "@/types/media";

export interface WatchlistItem {
  id: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  year?: string;
}

const KEY = "g2:watchlist";
const CHANGE_EVENT = "g2:watchlist-change";

function readRaw(): string {
  try {
    return localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function parse(raw: string): WatchlistItem[] {
  try {
    const value = JSON.parse(raw);
    if (!Array.isArray(value)) return [];

    const items = value.filter(
      (item): item is WatchlistItem =>
        item !== null &&
        typeof item === "object" &&
        typeof item.id === "number" &&
        (item.mediaType === "movie" || item.mediaType === "tv") &&
        typeof item.title === "string" &&
        (typeof item.posterPath === "string" || item.posterPath === null),
    );
    const unique = new Map(
      items.map((item) => [titleIdentityKey(item), item] as const),
    );
    return Array.from(unique.values());
  } catch {
    return [];
  }
}

function writeItems(items: WatchlistItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
    // `storage` events fire in OTHER tabs only — notify this tab's subscribers too.
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    /* ignore quota / unavailable */
  }
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

const getServerSnapshot = () => "[]";

/**
 * Device-local watchlist backed by localStorage. No provider needed — every caller
 * subscribes to the same store via `useSyncExternalStore` and stays in sync (across
 * tabs too, via the `storage` event). SSR-safe: the server and first client render
 * see an empty list, then it hydrates to the stored value (no hydration mismatch).
 * Works signed-out — it's device-local, not tied to auth.
 */
export function useWatchlist() {
  const raw = useSyncExternalStore(subscribe, readRaw, getServerSnapshot);
  const items = useMemo(() => parse(raw), [raw]);

  const has = useCallback(
    (mediaType: MediaType, id: number) =>
      items.some(
        (item) => titleIdentityKey(item) === titleIdentityKey({ mediaType, id }),
      ),
    [items],
  );

  const toggle = useCallback((item: WatchlistItem) => {
    const current = parse(readRaw());
    const key = titleIdentityKey(item);
    const next = current.some((existing) => titleIdentityKey(existing) === key)
      ? current.filter((existing) => titleIdentityKey(existing) !== key)
      : [item, ...current];
    writeItems(next);
  }, []);

  const remove = useCallback((mediaType: MediaType, id: number) => {
    const key = titleIdentityKey({ mediaType, id });
    writeItems(
      parse(readRaw()).filter((item) => titleIdentityKey(item) !== key),
    );
  }, []);

  const clear = useCallback(() => writeItems([]), []);

  return { items, has, toggle, remove, clear, count: items.length };
}
