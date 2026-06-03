"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
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
    return Array.isArray(value) ? (value as WatchlistItem[]) : [];
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

  const has = useCallback((id: number) => items.some((i) => i.id === id), [items]);

  const toggle = useCallback((item: WatchlistItem) => {
    const current = parse(readRaw());
    const next = current.some((i) => i.id === item.id)
      ? current.filter((i) => i.id !== item.id)
      : [item, ...current];
    writeItems(next);
  }, []);

  const remove = useCallback((id: number) => {
    writeItems(parse(readRaw()).filter((i) => i.id !== id));
  }, []);

  const clear = useCallback(() => writeItems([]), []);

  return { items, has, toggle, remove, clear, count: items.length };
}
