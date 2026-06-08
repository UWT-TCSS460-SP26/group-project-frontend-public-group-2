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

// The lit disc — reveals whichever panel sits under it. Its position is the
// animated --mx/--my pair: ambient drift by default, glides to the cursor on hover.
const SPOTLIGHT =
  "radial-gradient(circle 340px at var(--mx) var(--my), transparent 0%, transparent 24%, #000 72%)";

// A second, softer warm glow rides the same point for a richer falloff.
const SPOTLIGHT_GLOW =
  "radial-gradient(circle 420px at var(--mx) var(--my), color-mix(in srgb, var(--mui-palette-primary-main) 26%, transparent) 0%, transparent 60%)";

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

  // Pointer takes over: pause the ambient drift and write the cursor position.
  // The CSS transition on --mx/--my lets the spotlight glide rather than snap.
  const onMove = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      el.style.animationPlayState = "paused";
      el.style.setProperty("--mx", `${x}%`);
      el.style.setProperty("--my", `${y}%`);
    });
  }, []);

  // Pointer leaves: drop the inline override and let the idle drift resume.
  const onLeave = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    if (raf.current) cancelAnimationFrame(raf.current);
    el.style.removeProperty("--mx");
    el.style.removeProperty("--my");
    el.style.animationPlayState = "running";
  }, []);

  const tiles = panels.slice(0, 6);

  return (
    <Box
      component="section"
      ref={rootRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      sx={{
        position: "relative",
        overflow: "hidden",
        minHeight: { xs: 560, sm: 600, md: 660 },
        bgcolor: "common.black",
        color: "common.white",
        // Ambient searchlight; the transition smooths the hand-off to the cursor.
        animation: "hero-spotlight-drift 26s ease-in-out infinite",
        transition: "--mx 480ms ease-out, --my 480ms ease-out",
        // Touch devices reveal the panels under a scrim, so the drift does nothing.
        "@media (hover: none)": { animation: "none" },
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
                    ? "1px solid color-mix(in srgb, var(--mui-palette-common-white) 8%, transparent)"
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
                <Image
                  src={src}
                  alt=""
                  fill
                  priority={i === 0}
                  quality={90}
                  sizes="(max-width: 900px) 60vw, 30vw"
                  style={{ objectFit: "cover" }}
                />
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

      {/* Warm emerald bloom that rides the spotlight for a richer, lit-from-within
          falloff. Screen blend so it tints the lit panel without washing it out. */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          mixBlendMode: "screen",
          backgroundImage: SPOTLIGHT_GLOW,
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
