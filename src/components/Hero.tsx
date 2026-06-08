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
  /** The featured film's own backdrop (TMDB original) — the single hero image. */
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

// Registration ticks sit just outside the frame corners — the editorial "this is a
// mounted print" cue.
const CORNERS = [
  { top: -7, left: -7, borderTop: "1px solid", borderLeft: "1px solid" },
  { top: -7, right: -7, borderTop: "1px solid", borderRight: "1px solid" },
  { bottom: -7, left: -7, borderBottom: "1px solid", borderLeft: "1px solid" },
  { bottom: -7, right: -7, borderBottom: "1px solid", borderRight: "1px solid" },
] as const;

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
 * Editorial gallery-plate masthead. On bone paper, the featured still is presented
 * in full inside a hairline frame with a slim paper mat, a soft print shadow, and
 * corner registration ticks — a mounted gallery print, never bled or cropped through
 * the subject. The oversized serif title, mono catalog, emerald genres, and CTAs sit
 * in the negative space beside it, layered over a faint giant index numeral.
 *
 * The still is static (a print doesn't move) beyond a quiet load fade, so it always
 * reads sharp and whole; reduced-motion is honored via the global reduce reset.
 */
export function Hero({ featured, ctaLabel = "View feature" }: HeroProps) {
  return (
    <Box
      component="section"
      sx={{
        position: "relative",
        overflow: "hidden",
        bgcolor: "background.default",
        color: "text.primary",
      }}
    >
      <Box
        sx={{
          maxWidth: 1280,
          mx: "auto",
          width: "100%",
          minHeight: { xs: 600, md: 620 },
          px: { xs: 3, md: 6 },
          py: { xs: 6, md: 10 },
          display: "flex",
          flexDirection: { xs: "column-reverse", md: "row" },
          alignItems: "center",
          gap: { xs: 4, md: 7 },
        }}
      >
        {/* Type — in the bone negative space, over a faint giant numeral. */}
        <Box sx={{ position: "relative", flex: 1, minWidth: 0, width: { xs: "100%", md: "auto" } }}>
          <Typography
            aria-hidden
            sx={{
              position: "absolute",
              top: { xs: -28, md: -56 },
              left: { xs: -6, md: -10 },
              zIndex: 0,
              fontFamily: "var(--font-fraunces), Georgia, serif",
              fontWeight: 500,
              lineHeight: 0.8,
              fontSize: { xs: "8rem", md: "13rem" },
              color: "primary.main",
              opacity: 0.07,
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            01
          </Typography>

          <Box sx={{ position: "relative", zIndex: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
              <Box sx={{ width: 36, height: "1px", bgcolor: "primary.main" }} />
              <MetaText sx={{ textTransform: "uppercase", letterSpacing: "0.24em", color: "primary.dark" }}>
                Featured Film
              </MetaText>
            </Box>

            <Typography
              variant="h1"
              sx={{
                fontFamily: "var(--font-fraunces), Georgia, serif",
                fontSize: { xs: "3rem", sm: "3.6rem", md: "4.8rem" },
                lineHeight: 0.98,
                letterSpacing: "-0.025em",
                color: "text.primary",
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
                  color: "text.secondary",
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
                  color: "primary.dark",
                  mb: 3.5,
                }}
              >
                {featured.genres.slice(0, 3).join("  ·  ")}
              </MetaText>
            )}

            {featured.blurb && (
              <Typography
                sx={{
                  color: "text.secondary",
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
                  color: "text.primary",
                  "&:hover": { color: "primary.dark", backgroundColor: "transparent" },
                }}
              >
                Browse all →
              </ButtonLink>
            </Box>
          </Box>
        </Box>

        {/* Framed still — the mounted print, shown in full. */}
        <Box
          sx={{
            position: "relative",
            flexShrink: 0,
            width: { xs: "100%", md: "52%" },
            animation: "hero-image-in 1400ms cubic-bezier(0.22, 0.61, 0.36, 1) both",
          }}
        >
          {CORNERS.map((corner, idx) => (
            <Box
              key={idx}
              aria-hidden
              sx={{
                position: "absolute",
                width: 18,
                height: 18,
                borderColor: "text.secondary",
                opacity: 0.5,
                pointerEvents: "none",
                zIndex: 2,
                ...corner,
              }}
            />
          ))}

          <Box
            sx={{
              p: { xs: 1, md: 1.5 },
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              boxShadow: "0 40px 64px -32px color-mix(in srgb, var(--mui-palette-common-black) 45%, transparent)",
            }}
          >
            <Box
              sx={{
                position: "relative",
                aspectRatio: "16 / 9",
                overflow: "hidden",
                bgcolor: "background.default",
              }}
            >
              {featured.stillUrl ? (
                <Image
                  src={featured.stillUrl}
                  alt={featured.title}
                  fill
                  priority
                  quality={90}
                  sizes="(max-width: 900px) 100vw, 52vw"
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "text.secondary",
                    fontFamily: "var(--font-fraunces), Georgia, serif",
                    fontStyle: "italic",
                  }}
                >
                  no still
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
