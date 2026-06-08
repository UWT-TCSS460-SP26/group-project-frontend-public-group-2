"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Image from "next/image";
import Typography from "@mui/material/Typography";
import { MetaText } from "./MetaText";
import { TitleLink } from "./TitleLink";
import { TMDB_IMG_BASE, type MediaType } from "@/types/media";

export interface DeckItem {
  id: number;
  title: string;
  posterPath: string | null;
  href: string;
  mediaType: MediaType;
  year?: string;
}

// How hard the deck curves in 3D: each step out from center rotates the poster
// this many degrees and pushes it this many px further back, so the row reads as a
// concave wall wrapping toward the viewer rather than a flat strip.
const ANGLE_STEP = 6;
const DEPTH_STEP = 34;

function posterUrl(path: string | null): string | null {
  if (!path) return null;
  return path.startsWith("http") ? path : `${TMDB_IMG_BASE}${path}`;
}

/**
 * 3D poster deck — the posters are arranged in real 3D space as a concave wall:
 * the center faces you, each one further out is rotated around Y and pushed back in
 * depth (perspective foreshortens the edges). On scroll-into-view they "deal in" —
 * flying up out of a flat, recessed stack into the curved formation, staggered. The
 * whole wall then parallax-tilts toward the cursor, and hovering a poster rotates it
 * flat-on and brings it forward out of the wall with a deeper shadow + a glass sheen
 * sweep. Clicking keeps the shared-element view transition.
 *
 * Real 3D: nested preserve-3d so each poster's rotateY/translateZ composes inside the
 * tilting wall. Transform/opacity only (GPU, 60fps). Reduced-motion users get a flat,
 * still grid; touch falls back to a flat horizontally scrollable row.
 */
export function PosterDeck({ items }: { items: DeckItem[] }) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const raf = useRef<number | null>(null);
  const [dealt, setDealt] = useState(false);
  const deck = items.slice(0, 8);
  const center = (deck.length - 1) / 2;

  // Deal the deck in only once it enters the viewport, so the entrance reads as
  // intentional rather than already-finished by the time you scroll down to it.
  // (Reduced motion shows the deck flat-and-still via the CSS media queries below,
  // independent of this flag.)
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      const id = requestAnimationFrame(() => setDealt(true));
      return () => cancelAnimationFrame(id);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setDealt(true);
          io.disconnect();
        }
      },
      { threshold: 0.18 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onMove = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      el.style.setProperty("--ry", `${px * 12}deg`);
      el.style.setProperty("--rx", `${-py * 6}deg`);
    });
  }, []);

  const reset = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }, []);

  return (
    <Box
      onMouseMove={onMove}
      onMouseLeave={reset}
      sx={{ perspective: "1200px", perspectiveOrigin: "center", py: { md: 4 } }}
    >
      <Box
        ref={trackRef}
        sx={{
          display: "grid",
          gridAutoFlow: { xs: "column", md: "row" },
          gridTemplateColumns: { xs: "none", md: `repeat(${deck.length}, 1fr)` },
          gridAutoColumns: { xs: "44%", sm: "30%", md: "auto" },
          gap: { xs: 2, md: 2.5 },
          transformStyle: "preserve-3d",
          transform: "rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))",
          transition: "transform 280ms ease-out",
          overflowX: { xs: "auto", md: "visible" },
          scrollSnapType: { xs: "x mandatory", md: "none" },
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
          "@media (prefers-reduced-motion: reduce)": { transform: "none" },
        }}
      >
        {deck.map((item, i) => {
          const src = posterUrl(item.posterPath);
          const offset = i - center;
          // Resting pose in the curved wall.
          const restPose = `rotateY(${(-offset * ANGLE_STEP).toFixed(2)}deg) translateZ(${(-Math.abs(offset) * DEPTH_STEP).toFixed(0)}px)`;
          // Pre-deal pose: flat, dropped back and down, so it flies into the wall.
          const dealPose = "rotateY(0deg) translateZ(-260px) translateY(52px)";
          return (
            // Outer wrapper: the curved-wall pose + staggered deal-in (slow, once).
            <Box
              key={`${item.mediaType}-${item.id}`}
              sx={{
                scrollSnapAlign: "start",
                transformStyle: "preserve-3d",
                opacity: dealt ? 1 : 0,
                transform: { xs: "none", md: dealt ? restPose : dealPose },
                transition:
                  "transform 820ms cubic-bezier(0.16, 1, 0.3, 1), opacity 600ms ease-out",
                transitionDelay: dealt ? `${Math.min(i, 7) * 65}ms` : "0ms",
                "@media (prefers-reduced-motion: reduce)": {
                  opacity: 1,
                  transform: "none",
                  transition: "none",
                },
              }}
            >
              {/* Inner card: hover rotates flat-on and lifts forward out of the wall
                  (snappy, separate so it never inherits the slow deal-in timing). */}
              <Box
                className="deck-card"
                sx={{
                  transformStyle: "preserve-3d",
                  transition: "transform 280ms ease",
                  "@media (hover: hover)": {
                    "&:hover": {
                      transform: `rotateY(${(offset * ANGLE_STEP).toFixed(2)}deg) translateZ(96px) translateY(-14px)`,
                      zIndex: 4,
                    },
                    "&:hover .deck-poster": {
                      boxShadow:
                        "0 48px 70px -28px color-mix(in srgb, var(--mui-palette-text-primary) 62%, transparent)",
                      borderColor:
                        "color-mix(in srgb, var(--mui-palette-primary-main) 50%, var(--mui-palette-divider))",
                    },
                    "&:hover .deck-sheen": {
                      transform: "translateX(120%) skewX(-14deg)",
                    },
                  },
                  "@media (prefers-reduced-motion: reduce)": {
                    transition: "none",
                  },
                }}
              >
                <TitleLink href={item.href} id={item.id} mediaType={item.mediaType}>
                  <Box
                    className="deck-poster"
                    sx={{
                      position: "relative",
                      aspectRatio: "2 / 3",
                      overflow: "hidden",
                      bgcolor: "background.paper",
                      border: "1px solid",
                      borderColor: "divider",
                      boxShadow:
                        "0 22px 36px -18px color-mix(in srgb, var(--mui-palette-text-primary) 48%, transparent)",
                      transition: "box-shadow 280ms ease, border-color 280ms ease",
                    }}
                  >
                    {src && (
                      <Image
                        data-title-poster
                        src={src}
                        alt={item.title}
                        fill
                        quality={85}
                        sizes="(max-width: 600px) 44vw, (max-width: 900px) 30vw, 220px"
                        style={{ objectFit: "cover" }}
                      />
                    )}
                    {/* Glass sheen — parked off the left edge, sweeps across on hover. */}
                    <Box
                      className="deck-sheen"
                      aria-hidden
                      sx={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        backgroundImage:
                          "linear-gradient(105deg, transparent 32%, color-mix(in srgb, var(--mui-palette-common-white) 32%, transparent) 48%, transparent 64%)",
                        transform: "translateX(-120%) skewX(-14deg)",
                        transition: "transform 850ms cubic-bezier(0.22, 0.61, 0.36, 1)",
                        "@media (prefers-reduced-motion: reduce)": {
                          display: "none",
                        },
                      }}
                    />
                  </Box>
                </TitleLink>
                <Typography
                  sx={{
                    mt: 1,
                    fontSize: "0.92rem",
                    lineHeight: 1.35,
                    color: "text.primary",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.title}
                </Typography>
                {item.year && (
                  <MetaText sx={{ display: "block", mt: 0.25 }}>{item.year}</MetaText>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
