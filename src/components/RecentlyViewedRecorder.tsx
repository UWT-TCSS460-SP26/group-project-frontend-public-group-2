"use client";

import { useEffect } from "react";
import {
  useRecentlyViewed,
  type RecentlyViewedItem,
} from "@/lib/recently-viewed";

export function RecentlyViewedRecorder({ item }: { item: RecentlyViewedItem }) {
  const { record } = useRecentlyViewed();

  useEffect(() => {
    record(item);
  }, [item, record]);

  return null;
}
