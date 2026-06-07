"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { MediaType } from "@/types/media";

export interface RecentlyViewedItem {
  id: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  year?: string;
}

const KEY = "g2:recently-viewed";
const CHANGE_EVENT = "g2:recently-viewed-change";
const LIMIT = 12;

function itemKey(item: Pick<RecentlyViewedItem, "id" | "mediaType">) {
  return `${item.mediaType}:${item.id}`;
}

function readRaw(): string {
  try {
    return localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function parse(raw: string): RecentlyViewedItem[] {
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? (value as RecentlyViewedItem[]) : [];
  } catch {
    return [];
  }
}

function writeItems(items: RecentlyViewedItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
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

export function useRecentlyViewed() {
  const raw = useSyncExternalStore(subscribe, readRaw, getServerSnapshot);
  const items = useMemo(() => parse(raw), [raw]);

  const record = useCallback((item: RecentlyViewedItem) => {
    const current = parse(readRaw());
    const next = [
      item,
      ...current.filter((existing) => itemKey(existing) !== itemKey(item)),
    ].slice(0, LIMIT);
    writeItems(next);
  }, []);

  const clear = useCallback(() => writeItems([]), []);

  return { items, record, clear, count: items.length };
}
