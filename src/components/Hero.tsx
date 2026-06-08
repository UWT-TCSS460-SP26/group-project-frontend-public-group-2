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
  /** The featured film's own backdrop (TMDB w1280) — the single hero image. */
  stillUrl?: string | null;
  href: string;
}

interface HeroProps {
  featured: HeroFeatured;
  ctaLabel?: string;
}

const ctaSx = {
  fontFamily: "var(--font-mono), ui-monospace, monospace",
  fontSize: "0.75rem",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  px: 2.5,
} as const;

// The lit disc — keeps the featured backdrop bright where it falls and lets the
// rest sink into shadow. Its position is the animated --mx/--my pair: ambient drift
// by default, glides to the cursor on hover.
const SPOTLIGHT =
  "radial-gradient(circle 360px at var(--mx) var(--my), transparent 0%, transparent 26%, #000 74%)";

// A second, softer warm glow rides the same point for a richer falloff.
const SPOTLIGHT_GLOW =
  "radial-gradient(circle 440px at var(--mx) var(--my), color-mix(in srgb, var(--mui-palette-primary-main) 24%, transparent) 0%, transparent 60%)";

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
 * "Spotlight" masthead — the one featured film's own backdrop sits full-bleed in
 * ink. A soft spotlight keeps it lit where it falls: it drifts on a slow idle loop
 * by default and glides to the cursor when you move the pointer, so the still feels
 * lit-from-within rather than flatly displayed. The backdrop also breathes with a
 * gentle Ken Burns push. Oversized serif title + slate + CTAs sit in the darkened
 * foreground, and the bottom fades into the page background below.
 *
 * Pointer-driven (rAF-throttled CSS vars; transform/mask/opacity only — no layout).
 * Touch devices (no hover) drop the ink veil and show the backdrop under a scrim;
 * the drift and Ken Burns honor reduced-motion.
 */
export function Hero({ featured, ctaLabel = "View feature" }: HeroProps) {
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
        // Touch devices show the backdrop under a scrim, so the drift does nothing.
        "@media (hover: none)": { animation: "none" },
      }}
    >
      {/* The featured film's own backdrop, full-bleed. Fades up from black on load
          and slowly pushes in (Ken Burns) so the still has life under the spotlight. */}
      {featured.stillUrl && (
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            animation: "hero-image-in 1500ms cubic-bezier(0.22, 0.61, 0.36, 1) both",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              transformOrigin: "60% 40%",
              animation: "hero-kenburns 26s ease-in-out infinite alternate",
            }}
          >
            <Image
              src={featured.stillUrl}
              alt=""
              fill
              priority
              quality={90}
              sizes="100vw"
              style={{ objectFit: "cover" }}
            />
          </Box>
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
          falloff. Screen blend so it tints the lit area without washing it out. */}
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
