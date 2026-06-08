"use client";

import { useEffect, useRef, useState } from "react";
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
 * Popular-this-week poster rail — a clean, flat row of posters (snap-scroll on
 * mobile, an even grid on desktop). On scroll-into-view the posters reveal with a
 * smooth, staggered fade-up; hovering one lifts it with a deepening shadow, an
 * emerald frame, and a single glass-sheen sweep. Clicking keeps the shared-element
 * poster view-transition.
 *
 * The premium feel comes from timing and restraint, not gimmicks: transform/opacity
 * only (GPU, 60fps), no global parallax and no per-poster 3D warping (which is what
 * made the old "deck" read as wobbly and distorted). Reduced-motion users get a
 * static grid.
 */
export function PosterDeck({ items }: { items: DeckItem[] }) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [revealed, setRevealed] = useState(false);
  const deck = items.slice(0, 8);

  // Reveal once the rail scrolls into view so the stagger reads as intentional
  // rather than already finished. Reduced motion shows it static via CSS below.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      const id = requestAnimationFrame(() => setRevealed(true));
      return () => cancelAnimationFrame(id);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setRevealed(true);
          io.disconnect();
        }
      },
      { threshold: 0.18 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Box
      ref={trackRef}
      sx={{
        display: "grid",
        gridAutoFlow: { xs: "column", md: "row" },
        gridTemplateColumns: { xs: "none", md: `repeat(${deck.length}, 1fr)` },
        gridAutoColumns: { xs: "44%", sm: "30%", md: "auto" },
        gap: { xs: 2, md: 2.5 },
        // Vertical breathing room so the hover lift + resting shadow aren't clipped.
        py: { xs: 0.5, md: 2 },
        overflowX: { xs: "auto", md: "visible" },
        scrollSnapType: { xs: "x mandatory", md: "none" },
        scrollPaddingLeft: "16px",
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { display: "none" },
      }}
    >
      {deck.map((item, i) => {
        const src = posterUrl(item.posterPath);
        return (
          // Outer wrapper: staggered fade-up reveal (runs once, on scroll-in).
          <Box
            key={`${item.mediaType}-${item.id}`}
            sx={{
              scrollSnapAlign: "start",
              opacity: revealed ? 1 : 0,
              transform: revealed ? "translateY(0)" : "translateY(26px)",
              transition:
                "opacity 520ms ease-out, transform 640ms cubic-bezier(0.16, 1, 0.3, 1)",
              transitionDelay: revealed ? `${Math.min(i, 7) * 70}ms` : "0ms",
              "@media (prefers-reduced-motion: reduce)": {
                opacity: 1,
                transform: "none",
                transition: "none",
              },
            }}
          >
            {/* Inner card: snappy hover lift, kept separate so it never inherits the
                slow reveal timing. */}
            <Box
              className="deck-card"
              sx={{
                transition: "transform 260ms cubic-bezier(0.16, 1, 0.3, 1)",
                "@media (hover: hover)": {
                  "&:hover": {
                    transform: "translateY(-10px) scale(1.035)",
                    zIndex: 3,
                  },
                  "&:hover .deck-poster": {
                    boxShadow:
                      "0 34px 52px -24px color-mix(in srgb, var(--mui-palette-text-primary) 55%, transparent)",
                    borderColor:
                      "color-mix(in srgb, var(--mui-palette-primary-main) 55%, var(--mui-palette-divider))",
                  },
                  "&:hover .deck-sheen": {
                    transform: "translateX(130%) skewX(-14deg)",
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
                      "0 14px 26px -18px color-mix(in srgb, var(--mui-palette-text-primary) 42%, transparent)",
                    transition: "box-shadow 260ms ease, border-color 260ms ease",
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
                        "linear-gradient(105deg, transparent 34%, color-mix(in srgb, var(--mui-palette-common-white) 28%, transparent) 50%, transparent 66%)",
                      transform: "translateX(-130%) skewX(-14deg)",
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
  );
}
