"use client";

import { useCallback, useRef } from "react";
import Box from "@mui/material/Box";
import Image from "next/image";
import Typography from "@mui/material/Typography";
import { ButtonLink } from "./ButtonLink";
import { MetaText } from "./MetaText";

interface HeroFeatured {
  title: string;
  year?: string;
  runtime?: number;
  director?: string;
  genres?: string[];
  blurb?: string;
  href: string;
}

interface HeroProps {
  featured: HeroFeatured;
  /** Poster URLs for the diagonal panels behind the spotlight. */
  panels?: string[];
  ctaLabel?: string;
}

const ctaSx = {
  fontFamily: "var(--font-mono), ui-monospace, monospace",
  fontSize: "0.75rem",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  px: 2.5,
} as const;

// The lit disc that follows the cursor — reveals whichever panel it's over.
const SPOTLIGHT =
  "radial-gradient(circle 320px at var(--mx, 60%) var(--my, 45%), transparent 0%, transparent 22%, #000 70%)";

// Skew angle for the diagonal cut between panels.
const SKEW = 7;

function metaLine(f: HeroFeatured): string {
  return [
    f.year,
    f.runtime ? `${f.runtime} MIN` : undefined,
    f.director ? `DIR. ${f.director.toUpperCase()}` : undefined,
  ]
    .filter(Boolean)
    .join("  ·  ");
}

/**
 * "Spotlight Panels" masthead — the still wall is split into diagonal (skewed)
 * panels, each a different feature, sitting in ink. A soft spotlight follows the
 * cursor and reveals whichever panel you move over; the panel under it also lifts
 * slightly. Oversized serif title + slate + CTAs sit in the darkened foreground,
 * and the panel lights resolve from theme tokens so it stays cohesive. The bottom
 * fades into the page background so it merges with the sections below.
 *
 * Pointer-driven (rAF-throttled CSS vars; transform/mask only — no layout). Touch
 * devices (no hover) drop the ink veil and show the panels under a scrim; the panel
 * settle honors reduced-motion.
 */
export function Hero({ featured, panels = [], ctaLabel = "View feature" }: HeroProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const raf = useRef<number | null>(null);

  const onMove = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      el.style.setProperty("--mx", `${x}%`);
      el.style.setProperty("--my", `${y}%`);
    });
  }, []);

  const tiles = panels.slice(0, 6);

  return (
    <Box
      component="section"
      ref={rootRef}
      onMouseMove={onMove}
      sx={{
        position: "relative",
        overflow: "hidden",
        minHeight: { xs: 560, sm: 600, md: 660 },
        bgcolor: "common.black",
        color: "common.white",
      }}
    >
      {/* Diagonal panels — a skewed row of feature stills, slightly oversized so the
          slant bleeds off both edges. */}
      {tiles.length > 0 && (
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            width: "120%",
            left: "-10%",
            transform: `skewX(-${SKEW}deg)`,
            animation: "hero-image-in 1500ms cubic-bezier(0.22, 0.61, 0.36, 1) both",
          }}
        >
          {tiles.map((src, i) => (
            <Box
              key={i}
              sx={{
                position: "relative",
                flex: 1,
                overflow: "hidden",
                borderRight:
                  i < tiles.length - 1
                    ? "1px solid color-mix(in srgb, var(--mui-palette-primary-main) 70%, transparent)"
                    : "none",
                "@media (hover: hover)": {
                  "&:hover .panel-img": { transform: `skewX(${SKEW}deg) scale(1.34)` },
                },
              }}
            >
              <Box
                className="panel-img"
                sx={{
                  position: "absolute",
                  inset: 0,
                  transform: `skewX(${SKEW}deg) scale(1.26)`,
                  transformOrigin: "center",
                  transition: "transform 420ms cubic-bezier(0.22, 0.61, 0.36, 1)",
                }}
              >
                <Image src={src} alt="" fill sizes="22vw" style={{ objectFit: "cover" }} />
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Spotlight ink veil — hole follows the cursor (hover/pointer devices). */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          bgcolor: "color-mix(in srgb, var(--mui-palette-common-black) 84%, transparent)",
          WebkitMaskImage: SPOTLIGHT,
          maskImage: SPOTLIGHT,
          "@media (hover: none)": { display: "none" },
        }}
      />

      {/* Cinematic scrim: dark foreground (left + bottom) for legible copy, and a
          base reveal on touch where there's no spotlight. */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: [
            "linear-gradient(90deg, color-mix(in srgb, var(--mui-palette-common-black) 90%, transparent) 0%, color-mix(in srgb, var(--mui-palette-common-black) 50%, transparent) 38%, transparent 70%)",
            "linear-gradient(0deg, color-mix(in srgb, var(--mui-palette-common-black) 82%, transparent) 0%, transparent 55%)",
          ].join(", "),
        }}
      />

      {/* Copy */}
      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          maxWidth: 1280,
          mx: "auto",
          width: "100%",
          minHeight: { xs: 560, sm: 600, md: 660 },
          px: { xs: 3, md: 6 },
          pt: { xs: 12, md: 14 },
          pb: { xs: 7, md: 9 },
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
        }}
      >
        <Box sx={{ maxWidth: { xs: "100%", md: 540 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
            <Box sx={{ width: 36, height: "1px", bgcolor: "primary.main" }} />
            <MetaText sx={{ textTransform: "uppercase", letterSpacing: "0.24em", color: "primary.main" }}>
              Featured Film
            </MetaText>
          </Box>

          <Typography
            variant="h1"
            sx={{
              fontFamily: "var(--font-fraunces), Georgia, serif",
              fontSize: { xs: "2.9rem", sm: "3.6rem", md: "4.8rem" },
              lineHeight: 0.98,
              letterSpacing: "-0.02em",
              color: "common.white",
              mb: 3,
              overflowWrap: "anywhere",
            }}
          >
            {featured.title}
          </Typography>

          {metaLine(featured) && (
            <MetaText
              sx={{
                display: "block",
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: "color-mix(in srgb, var(--mui-palette-common-white) 82%, transparent)",
                mb: featured.genres?.length ? 1.5 : 3.5,
              }}
            >
              {metaLine(featured)}
            </MetaText>
          )}

          {featured.genres && featured.genres.length > 0 && (
            <MetaText
              sx={{
                display: "block",
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                color: "primary.main",
                mb: 3.5,
              }}
            >
              {featured.genres.slice(0, 3).join("  ·  ")}
            </MetaText>
          )}

          {featured.blurb && (
            <Typography
              sx={{
                color: "color-mix(in srgb, var(--mui-palette-common-white) 80%, transparent)",
                fontSize: { xs: "1rem", md: "1.08rem" },
                lineHeight: 1.7,
                maxWidth: 440,
                mb: 4.5,
                display: "-webkit-box",
                WebkitLineClamp: { xs: 3, md: 4 },
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {featured.blurb}
            </Typography>
          )}

          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 3 }}>
            <ButtonLink href={featured.href} variant="contained" color="primary" sx={ctaSx}>
              {ctaLabel}
            </ButtonLink>
            <ButtonLink
              href="/browse"
              variant="text"
              sx={{
                ...ctaSx,
                px: 0,
                color: "common.white",
                "&:hover": { color: "primary.main", backgroundColor: "transparent" },
              }}
            >
              Browse all →
            </ButtonLink>
          </Box>
        </Box>

        <MetaText
          aria-hidden
          sx={{
            display: { xs: "none", md: "block" },
            position: "absolute",
            right: 24,
            bottom: 24,
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            color: "color-mix(in srgb, var(--mui-palette-common-white) 45%, transparent)",
          }}
        >
          Move to explore ◯
        </MetaText>
      </Box>

      {/* Merge: fade into the page background below. */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 96,
          zIndex: 1,
          backgroundImage:
            "linear-gradient(to bottom, transparent, var(--mui-palette-background-default))",
        }}
      />
    </Box>
  );
}
