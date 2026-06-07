import Box from "@mui/material/Box";
import Image from "next/image";
import Typography from "@mui/material/Typography";
import { ButtonLink } from "./ButtonLink";

interface HeroCta {
  href: string;
  label: string;
}

interface HeroProps {
  title: string;
  eyebrow?: string;
  blurb?: string;
  /** Poster image URLs used to build the abstract film-wall backdrop. */
  posters?: string[];
  primaryCta?: HeroCta;
  secondaryCta?: HeroCta;
}

// A tilted mosaic of posters reads as "cinema" without leaning on a single
// movie still. We cycle the available posters to fill the wall edge-to-edge.
const TILE_COUNT = 28;

// Staggered fade-up for the masthead copy — reuses the global `reveal-up` keyframe
// (defined in globals.css so emotion can't mis-scope the name). `both` fill keeps
// each block visible if the animation never runs; reduced-motion users skip it.
function rise(delayMs: number) {
  return {
    animation: "reveal-up 560ms cubic-bezier(0.22, 0.61, 0.36, 1) both",
    animationDelay: `${delayMs}ms`,
    "@media (prefers-reduced-motion: reduce)": { animation: "none" },
  } as const;
}

const ctaSx = {
  fontFamily: "var(--font-mono), ui-monospace, monospace",
  fontSize: "0.75rem",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  px: 2.5,
} as const;

/**
 * Brand masthead — an abstract, tilted "film wall" of posters behind an editorial
 * scrim, rather than a single movie still. The poster grid is decorative
 * (aria-hidden); the copy and CTAs carry the meaning. Entrance is transform +
 * opacity only (GPU) and honors reduced-motion (see globals.css + `rise`).
 */
export function Hero({
  title,
  eyebrow = "Featured",
  blurb,
  posters = [],
  primaryCta,
  secondaryCta,
}: HeroProps) {
  const tiles = posters.length
    ? Array.from({ length: TILE_COUNT }, (_, i) => posters[i % posters.length])
    : [];

  return (
    <Box
      component="section"
      sx={{
        position: "relative",
        minHeight: { xs: 560, sm: 600, md: 680 },
        bgcolor: "common.black",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      {/* Abstract film wall: a rotated, oversized poster mosaic. Decorative only. */}
      {tiles.length > 0 && (
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: "-16%",
            transform: "rotate(-7deg)",
            transformOrigin: "center",
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(4, 1fr)",
                sm: "repeat(5, 1fr)",
                md: "repeat(7, 1fr)",
              },
              gap: { xs: 1, md: 1.5 },
              transform: "scale(1.2)",
              transformOrigin: "center",
              // Reuses the masthead settle keyframe (opacity + slight zoom-out).
              animation: "hero-image-in 1500ms cubic-bezier(0.22, 0.61, 0.36, 1) both",
            }}
          >
            {tiles.map((src, i) => (
              <Box
                key={i}
                sx={{
                  position: "relative",
                  aspectRatio: "2 / 3",
                  borderRadius: 1,
                  overflow: "hidden",
                  boxShadow:
                    "0 12px 28px color-mix(in srgb, var(--mui-palette-common-black) 55%, transparent)",
                }}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="160px"
                  style={{ objectFit: "cover" }}
                />
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Editorial scrim — left-heavy for legibility, plus a top/bottom vignette so
          the wall blends into the header above and the page below. */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: [
            "linear-gradient(90deg, color-mix(in srgb, var(--mui-palette-common-black) 95%, transparent) 0%, color-mix(in srgb, var(--mui-palette-common-black) 80%, transparent) 40%, color-mix(in srgb, var(--mui-palette-common-black) 52%, transparent) 100%)",
            "linear-gradient(180deg, color-mix(in srgb, var(--mui-palette-common-black) 72%, transparent) 0%, color-mix(in srgb, var(--mui-palette-common-black) 28%, transparent) 32%, color-mix(in srgb, var(--mui-palette-common-black) 80%, transparent) 100%)",
          ].join(", "),
        }}
      />

      {/* Brand accent: a soft emerald bloom behind the copy so the masthead reads as
          designed, not a generic darkened photo. `screen` lifts it over the scrim. */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          mixBlendMode: "screen",
          backgroundImage:
            "radial-gradient(60% 95% at 6% 55%, color-mix(in srgb, var(--mui-palette-primary-main) 32%, transparent) 0%, transparent 60%)",
        }}
      />

      <Box
        sx={{
          maxWidth: 1280,
          mx: "auto",
          width: "100%",
          px: { xs: 3, md: 6 },
          position: "relative",
          zIndex: 1,
        }}
      >
        <Box sx={{ maxWidth: 640 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3, ...rise(80) }}>
            <Box sx={{ width: 40, height: 1, bgcolor: "primary.main", opacity: 0.9 }} />
            <Typography variant="overline" sx={{ color: "primary.main" }}>
              {eyebrow}
            </Typography>
          </Box>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: "2.6rem", sm: "3.6rem", md: "4.75rem" },
              lineHeight: 1.05,
              color: "common.white",
              mb: 3,
              overflowWrap: "anywhere",
              ...rise(160),
            }}
          >
            {title}
          </Typography>
          {blurb && (
            <Typography
              sx={{
                fontSize: { xs: "1.02rem", md: "1.15rem" },
                color: "common.white",
                opacity: 0.8,
                maxWidth: 520,
                lineHeight: 1.6,
                mb: 4,
                ...rise(260),
              }}
            >
              {blurb}
            </Typography>
          )}
          {(primaryCta || secondaryCta) && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center", ...rise(360) }}>
              {primaryCta && (
                <ButtonLink href={primaryCta.href} variant="contained" color="primary" sx={ctaSx}>
                  {primaryCta.label}
                </ButtonLink>
              )}
              {secondaryCta && (
                <ButtonLink
                  href={secondaryCta.href}
                  variant="outlined"
                  sx={{
                    ...ctaSx,
                    color: "common.white",
                    borderColor: "color-mix(in srgb, var(--mui-palette-common-white) 42%, transparent)",
                    "&:hover": {
                      borderColor: "common.white",
                      backgroundColor: "color-mix(in srgb, var(--mui-palette-common-white) 8%, transparent)",
                    },
                  }}
                >
                  {secondaryCta.label}
                </ButtonLink>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
