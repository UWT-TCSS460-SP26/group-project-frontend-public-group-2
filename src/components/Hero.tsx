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
  /** Editorial catalog number, e.g. "NO. 07". */
  issue?: string;
  /** Edition label, e.g. "SPRING 2026". */
  edition?: string;
  ctaLabel?: string;
}

// Crisp print "hairline" — a touch darker than the global divider so the magazine
// compartments read as ruled, while still resolving from the ink text token (stays
// in sync with light/dark via CSS variables). This is the only place it lives.
const HAIRLINE = "1px solid color-mix(in srgb, var(--mui-palette-text-primary) 26%, transparent)";

// Same static SVG grain as <GrainOverlay>, scoped here over the still for a
// tactile, printed-film feel. Decorative, GPU-composited, no JS.
const NOISE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

const ctaSx = {
  fontFamily: "var(--font-mono), ui-monospace, monospace",
  fontSize: "0.75rem",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  px: 2.5,
} as const;

function metaLine(issue: string | undefined, f: HeroFeatured): string {
  const head = [issue, f.year, f.runtime ? `${f.runtime} MIN` : undefined]
    .filter(Boolean)
    .join("  /  ");
  return f.director ? `${head}  —  DIR. ${f.director.toUpperCase()}` : head;
}

/**
 * Boutique "Arthouse Print" masthead — an asymmetric magazine grid on warm bone
 * paper, ruled with print hairlines: an editorial text column (Swiss numeral +
 * oversized serif title + monospaced slate) beside a full-bleed cinematic still
 * with vignette + grain. Built entirely from existing theme tokens so it reads as
 * an evolution of the design system, not a separate skin. Fully responsive — the
 * two columns stack (still first, then copy) on small screens, keeping the rules.
 */
export function Hero({
  featured,
  issue,
  edition,
  ctaLabel = "View the feature",
}: HeroProps) {
  return (
    <Box
      component="section"
      sx={{
        bgcolor: "background.default",
        color: "text.primary",
        borderTop: HAIRLINE,
        // Closes the masthead and merges into the identical page background below.
        borderBottom: HAIRLINE,
      }}
    >
      <Box sx={{ maxWidth: 1280, mx: "auto" }}>
        {/* Masthead strip */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            px: { xs: 3, md: 6 },
            py: { xs: 1.25, md: 1.5 },
            borderBottom: HAIRLINE,
          }}
        >
          <MetaText
            sx={{
              textTransform: "uppercase",
              letterSpacing: "0.22em",
              color: "text.primary",
            }}
          >
            Repertory — The Feature
          </MetaText>
          {edition && (
            <MetaText sx={{ textTransform: "uppercase", letterSpacing: "0.22em" }}>
              {edition}
            </MetaText>
          )}
        </Box>

        {/* Asymmetric magazine grid: editorial column + full-bleed still. */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "minmax(0, 5fr) minmax(0, 7fr)" },
          }}
        >
          {/* Editorial column */}
          <Box
            sx={{
              order: { xs: 2, md: 1 },
              display: "flex",
              flexDirection: "column",
              px: { xs: 3, md: 6 },
              py: { xs: 4, md: 6 },
              // Hairline between stacked compartments (mobile) → vertical rule (desktop).
              borderTop: { xs: HAIRLINE, md: "none" },
              borderRight: { md: HAIRLINE },
            }}
          >
            {/* Oversized Swiss numeral + slate label */}
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2.5, mb: { xs: 3, md: 4 } }}>
              <Typography
                aria-hidden
                sx={{
                  fontFamily: "var(--font-inter), system-ui, sans-serif",
                  fontWeight: 800,
                  fontSize: { xs: "4.5rem", md: "7rem" },
                  lineHeight: 0.78,
                  letterSpacing: "-0.05em",
                  color: "text.primary",
                }}
              >
                1
              </Typography>
              <MetaText
                component="span"
                sx={{
                  mt: 0.5,
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  lineHeight: 1.5,
                  color: "primary.dark",
                }}
              >
                Featured
                <br />
                Film
              </MetaText>
            </Box>

            <Typography
              variant="h1"
              sx={{
                fontFamily: "var(--font-fraunces), Georgia, serif",
                fontSize: { xs: "2.6rem", sm: "3.2rem", md: "3.9rem" },
                lineHeight: 1.02,
                letterSpacing: "-0.01em",
                mb: 2.5,
                overflowWrap: "anywhere",
              }}
            >
              {featured.title}
            </Typography>

            <MetaText
              sx={{
                display: "block",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "text.secondary",
                mb: featured.genres?.length ? 1.25 : 3,
              }}
            >
              {metaLine(issue, featured)}
            </MetaText>

            {featured.genres && featured.genres.length > 0 && (
              <MetaText
                sx={{
                  display: "block",
                  textTransform: "uppercase",
                  letterSpacing: "0.16em",
                  color: "primary.dark",
                  mb: 3,
                }}
              >
                {featured.genres.slice(0, 3).join("  ·  ")}
              </MetaText>
            )}

            {featured.blurb && (
              <Typography
                sx={{
                  color: "text.secondary",
                  fontSize: { xs: "0.98rem", md: "1.02rem" },
                  lineHeight: 1.65,
                  maxWidth: 460,
                  mb: 4,
                  display: "-webkit-box",
                  WebkitLineClamp: { xs: 4, md: 5 },
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {featured.blurb}
              </Typography>
            )}

            <Box sx={{ mt: "auto" }}>
              <ButtonLink href={featured.href} variant="contained" color="primary" sx={ctaSx}>
                {ctaLabel}
              </ButtonLink>
            </Box>
          </Box>

          {/* Full-bleed cinematic still */}
          <Box
            sx={{
              order: { xs: 1, md: 2 },
              position: "relative",
              minHeight: { xs: 240, sm: 360, md: 560 },
              bgcolor: "common.black",
              overflow: "hidden",
            }}
          >
            {featured.stillUrl && (
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  transformOrigin: "center",
                  // Gentle settle-in (opacity + slight zoom-out). Keyframe in
                  // globals.css; reduced-motion users get the end state instantly.
                  animation: "hero-image-in 1300ms cubic-bezier(0.22, 0.61, 0.36, 1) both",
                }}
              >
                <Image
                  src={featured.stillUrl}
                  alt={featured.title}
                  fill
                  priority
                  sizes="(max-width: 900px) 100vw, 58vw"
                  style={{ objectFit: "cover" }}
                />
              </Box>
            )}

            {/* Cinematic vignette */}
            <Box
              aria-hidden
              sx={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                backgroundImage:
                  "radial-gradient(125% 125% at 50% 42%, transparent 55%, color-mix(in srgb, var(--mui-palette-common-black) 58%, transparent) 100%)",
              }}
            />
            {/* Printed-film grain */}
            <Box
              aria-hidden
              sx={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                opacity: 0.14,
                mixBlendMode: "overlay",
                backgroundImage: `url("${NOISE}")`,
                backgroundRepeat: "repeat",
              }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
