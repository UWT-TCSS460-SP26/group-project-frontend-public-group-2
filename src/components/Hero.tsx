import Box from "@mui/material/Box";
import Image from "next/image";
import Typography from "@mui/material/Typography";
import { ButtonLink } from "./ButtonLink";
import { MetaText } from "./MetaText";
import styles from "./Hero.module.css";

interface HeroProps {
  ctaHref?: string;
  ctaLabel?: string;
  title: string;
  eyebrow?: string;
  meta?: string;
  blurb?: string;
  backgroundImageUrl?: string | null;
}

export function Hero({
  ctaHref,
  ctaLabel = "View",
  eyebrow = "Featured",
  title,
  meta,
  blurb,
  backgroundImageUrl,
}: HeroProps) {
  return (
    <Box
      component="section"
      sx={{
        position: "relative",
        minHeight: { xs: 520, sm: 560, md: 680 },
        bgcolor: "common.black",
        display: "flex",
        alignItems: "flex-end",
        overflow: "hidden",
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      {backgroundImageUrl ? (
        <Image
          src={backgroundImageUrl}
          alt=""
          fill
          priority
          sizes="100vw"
          className={styles.heroImage}
        />
      ) : (
        <Box aria-hidden sx={{ position: "absolute", inset: 0, bgcolor: "background.paper" }} />
      )}

      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: [
            "radial-gradient(ellipse at center, transparent 0%, color-mix(in srgb, var(--mui-palette-common-black) 72%, transparent) 100%)",
            "linear-gradient(90deg, color-mix(in srgb, var(--mui-palette-common-black) 86%, transparent) 0%, color-mix(in srgb, var(--mui-palette-common-black) 62%, transparent) 42%, color-mix(in srgb, var(--mui-palette-common-black) 24%, transparent) 100%)",
            "linear-gradient(180deg, color-mix(in srgb, var(--mui-palette-common-black) 18%, transparent) 0%, color-mix(in srgb, var(--mui-palette-common-black) 88%, transparent) 100%)",
          ].join(", "),
        }}
      />

      <Box
        sx={{
          maxWidth: 1280,
          mx: "auto",
          width: "100%",
          px: { xs: 3, md: 6 },
          pt: { xs: 12, md: 16 },
          pb: { xs: 6, sm: 7, md: 9 },
          position: "relative",
          zIndex: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <Box
            sx={{ width: 40, height: 1, bgcolor: "primary.main", opacity: 0.9 }}
          />
          <Typography variant="overline" sx={{ color: "primary.main" }}>
            {eyebrow}
          </Typography>
        </Box>
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: "2.45rem", sm: "3.5rem", md: "5.25rem" },
            color: "common.white",
            maxWidth: 900,
            mb: 2,
            overflowWrap: "anywhere",
          }}
        >
          {title}
        </Typography>
        {meta && (
          <MetaText
            sx={{
              display: "block",
              color: "common.white",
              opacity: 0.82,
              mb: blurb ? 3 : ctaHref ? 4 : 0,
              textTransform: "uppercase",
            }}
          >
            {meta}
          </MetaText>
        )}
        {blurb && (
          <Typography
            sx={{
              fontSize: { xs: "1rem", md: "1.1rem" },
              color: "common.white",
              opacity: 0.78,
              maxWidth: 560,
              lineHeight: 1.6,
              mb: ctaHref ? 4 : 0,
              display: "-webkit-box",
              WebkitLineClamp: { xs: 3, md: 4 },
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {blurb}
          </Typography>
        )}
        {ctaHref && (
          <ButtonLink
            href={ctaHref}
            variant="contained"
            color="primary"
            sx={{
              fontFamily: "var(--font-mono), ui-monospace, monospace",
              fontSize: "0.75rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              px: 2.5,
            }}
          >
            {ctaLabel}
          </ButtonLink>
        )}
      </Box>
    </Box>
  );
}
