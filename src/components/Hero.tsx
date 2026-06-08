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

// Spotlight radius and falloff — the lit disc that follows the cursor.
const SPOTLIGHT =
  "radial-gradient(circle 300px at var(--mx, 70%) var(--my, 40%), transparent 0%, transparent 24%, #000 72%)";

// Diagonal cut: the still occupies the right wedge; the left stays dark for copy.
const CUT = "polygon(34% 0, 100% 0, 100% 100%, 14% 100%)";
const CUT_EDGE = "polygon(calc(34% - 2px) 0, 100% 0, 100% 100%, calc(14% - 2px) 100%)";

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
 * "Spotlight Cut" masthead — a dark cinema panel where the featured still lives
 * behind a diagonal cut and is hidden in ink until a soft spotlight, following the
 * cursor, reveals it. Oversized serif title + monospaced slate sit in the dark
 * wedge; an emerald keyline traces the cut. The panel fades into the page
 * background below so it merges with the existing sections.
 *
 * Interaction is pointer-driven (rAF-throttled CSS variables — transform/mask only,
 * no layout). Touch devices (no hover) get the still revealed with a cinematic
 * scrim instead of the spotlight; the image settle honors reduced-motion.
 */
export function Hero({ featured, ctaLabel = "View feature" }: HeroProps) {
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
      {/* Emerald keyline behind the diagonal cut (desktop). */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          display: { xs: "none", md: "block" },
          bgcolor: "primary.main",
          clipPath: CUT_EDGE,
        }}
      />

      {/* Diagonally-clipped still + spotlight ink. */}
      <Box aria-hidden sx={{ position: "absolute", inset: 0, clipPath: { md: CUT } }}>
        {featured.stillUrl && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              transformOrigin: "center",
              animation: "hero-image-in 1400ms cubic-bezier(0.22, 0.61, 0.36, 1) both",
            }}
          >
            <Image
              src={featured.stillUrl}
              alt={featured.title}
              fill
              priority
              sizes="100vw"
              style={{ objectFit: "cover" }}
            />
          </Box>
        )}

        {/* Ink veil with the spotlight punched out — hover/pointer devices only. */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            bgcolor: "color-mix(in srgb, var(--mui-palette-common-black) 86%, transparent)",
            WebkitMaskImage: SPOTLIGHT,
            maskImage: SPOTLIGHT,
            "@media (hover: none)": { display: "none" },
          }}
        />

        {/* Cinematic scrim: keep the left dark for legibility + edge vignette. */}
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage: [
              "linear-gradient(90deg, color-mix(in srgb, var(--mui-palette-common-black) 90%, transparent) 0%, color-mix(in srgb, var(--mui-palette-common-black) 55%, transparent) 32%, transparent 64%)",
              "radial-gradient(150% 120% at 62% 22%, transparent 50%, color-mix(in srgb, var(--mui-palette-common-black) 72%, transparent) 100%)",
            ].join(", "),
          }}
        />
      </Box>

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
        <Box sx={{ maxWidth: { xs: "100%", md: 520 } }}>
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
                "&:hover": {
                  color: "primary.main",
                  backgroundColor: "transparent",
                },
              }}
            >
              Browse all →
            </ButtonLink>
          </Box>
        </Box>

        {/* Interaction hint (pointer devices). */}
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

      {/* Merge: fade the dark panel into the page background below. */}
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
