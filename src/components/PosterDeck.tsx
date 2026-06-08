"use client";

import { useCallback, useRef } from "react";
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
 * 3D poster deck — a perspective row of posters that parallax-tilts toward the
 * cursor, with each poster lifting on hover (translateZ depth + shadow). Clicking a
 * poster keeps the shared-element view transition (via <TitleLink>). Transform-only
 * (GPU); reduced-motion users get a flat, still deck. On touch it falls back to a
 * horizontally scrollable row with no tilt.
 */
export function PosterDeck({ items }: { items: DeckItem[] }) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const raf = useRef<number | null>(null);
  const deck = items.slice(0, 8);

  const onMove = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      el.style.setProperty("--ry", `${px * 9}deg`);
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
      sx={{ perspective: "1500px", perspectiveOrigin: "center", py: { md: 2 } }}
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
        {deck.map((item) => {
          const src = posterUrl(item.posterPath);
          return (
            <Box
              key={`${item.mediaType}-${item.id}`}
              sx={{
                scrollSnapAlign: "start",
                transformStyle: "preserve-3d",
                transition: "transform 240ms ease, box-shadow 240ms ease",
                "@media (hover: hover)": {
                  "&:hover": { transform: "translateZ(55px) translateY(-10px)", zIndex: 3 },
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
                  }}
                >
                  {src && (
                    <Image
                      data-title-poster
                      src={src}
                      alt={item.title}
                      fill
                      sizes="(max-width: 600px) 44vw, 200px"
                      style={{ objectFit: "cover" }}
                    />
                  )}
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
          );
        })}
      </Box>
    </Box>
  );
}
