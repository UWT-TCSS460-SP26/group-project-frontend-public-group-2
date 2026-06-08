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

function posterUrl(path: string | null): string | null {
  if (!path) return null;
  return path.startsWith("http") ? path : `${TMDB_IMG_BASE}${path}`;
}

/**
 * 3D poster deck — a perspective row that "deals in" the moment it scrolls into
 * view (each poster eases up out of a tilted, recessed pose, staggered like cards
 * dropping onto a table), then parallax-tilts toward the cursor as a whole. Hovering
 * a poster lifts it forward in depth with a richer drop shadow and a glass sheen
 * that sweeps across it. Clicking keeps the shared-element view transition.
 *
 * Two transform layers, deliberately: the outer wrapper owns the slow deal-in so it
 * never fights the snappy hover lift on the inner card. Transform/opacity only (GPU,
 * 60fps). Reduced-motion users get a flat, still deck with no deal-in or tilt; touch
 * falls back to a horizontally scrollable row.
 */
export function PosterDeck({ items }: { items: DeckItem[] }) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const raf = useRef<number | null>(null);
  const [dealt, setDealt] = useState(false);
  const deck = items.slice(0, 8);

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
      el.style.setProperty("--ry", `${px * 8}deg`);
      el.style.setProperty("--rx", `${-py * 5}deg`);
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
      sx={{ perspective: "1400px", perspectiveOrigin: "center", py: { md: 2 } }}
    >
      <Box
        ref={trackRef}
        sx={{
          display: "grid",
          gridAutoFlow: { xs: "column", md: "row" },
          gridTemplateColumns: { xs: "none", md: `repeat(${deck.length}, 1fr)` },
          gridAutoColumns: { xs: "44%", sm: "30%", md: "auto" },
          gap: { xs: 2, md: 3 },
          transformStyle: "preserve-3d",
          transform: "rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))",
          transition: "transform 260ms ease-out",
          overflowX: { xs: "auto", md: "visible" },
          scrollSnapType: { xs: "x mandatory", md: "none" },
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
          "@media (prefers-reduced-motion: reduce)": { transform: "none" },
        }}
      >
        {deck.map((item, i) => {
          const src = posterUrl(item.posterPath);
          return (
            // Outer wrapper: the staggered deal-in (slow, runs once on view).
            <Box
              key={`${item.mediaType}-${item.id}`}
              sx={{
                scrollSnapAlign: "start",
                transformStyle: "preserve-3d",
                opacity: dealt ? 1 : 0,
                transform: dealt
                  ? "none"
                  : "rotateX(-26deg) translateZ(-160px) translateY(44px)",
                transition:
                  "transform 760ms cubic-bezier(0.16, 1, 0.3, 1), opacity 560ms ease-out",
                transitionDelay: dealt ? `${Math.min(i, 7) * 70}ms` : "0ms",
                "@media (prefers-reduced-motion: reduce)": {
                  opacity: 1,
                  transform: "none",
                  transition: "none",
                },
              }}
            >
              {/* Inner card: the snappy hover lift (separate so it never inherits
                  the slow deal-in timing on the same property). */}
              <Box
                className="deck-card"
                sx={{
                  transformStyle: "preserve-3d",
                  transition: "transform 240ms ease, filter 240ms ease",
                  "@media (hover: hover)": {
                    "&:hover": {
                      transform: "translateZ(70px) translateY(-14px)",
                      zIndex: 3,
                    },
                    "&:hover .deck-poster": {
                      boxShadow:
                        "0 44px 60px -26px color-mix(in srgb, var(--mui-palette-text-primary) 60%, transparent)",
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
                        "0 18px 30px -16px color-mix(in srgb, var(--mui-palette-text-primary) 42%, transparent)",
                      transition: "box-shadow 240ms ease, border-color 240ms ease",
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
                          "linear-gradient(105deg, transparent 32%, color-mix(in srgb, var(--mui-palette-common-white) 30%, transparent) 48%, transparent 64%)",
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
