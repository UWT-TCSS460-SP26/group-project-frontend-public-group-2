"use client";

import { useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import {
  TITLE_ACCENT_FALLBACK,
  TITLE_ACCENT_VAR,
  extractTitleAccent,
} from "@/lib/title-color";

interface TitleColorScopeProps {
  /** Full poster URL (TMDB CDN). Omit when the title has no poster. */
  posterUrl?: string;
  children: React.ReactNode;
  sx?: SxProps<Theme>;
}

/**
 * Scopes the per-title accent (JO-2). Wraps the detail view in an element whose
 * `--title-accent` defaults to the mode-aware brand emerald/mint, then — once the
 * poster has loaded — overrides it with a luminance-clamped dominant color so the
 * page's rules / CTAs / score badge / rating stars / focused fields / hovers
 * adopt the title's own hue.
 *
 * Extraction runs one-time, off the critical path (requestIdleCallback), reads a
 * separate downscaled <img> (not the rendered poster), and degrades to the
 * emerald fallback on any failure. The accent is set as an inline CSS variable on
 * this wrapper, so it doesn't trigger layout and descendants opt in via
 * `var(--title-accent)`.
 */
export function TitleColorScope({ posterUrl, children, sx }: TitleColorScopeProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!posterUrl) return;
    let cancelled = false;

    const run = () => {
      void extractTitleAccent(posterUrl).then((accent) => {
        if (cancelled || !accent) return;
        ref.current?.style.setProperty(TITLE_ACCENT_VAR, accent);
      });
    };

    // Defer to idle so color work never competes with hydration/interaction.
    const ric = typeof window !== "undefined" ? window.requestIdleCallback : undefined;
    if (ric) {
      const handle = ric(run, { timeout: 2000 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback?.(handle);
      };
    }
    const timer = window.setTimeout(run, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [posterUrl]);

  return (
    <Box
      ref={ref}
      sx={[
        { [TITLE_ACCENT_VAR]: TITLE_ACCENT_FALLBACK },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Box>
  );
}
