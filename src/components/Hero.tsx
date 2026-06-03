import Box from "@mui/material/Box";
import Image from "next/image";
import Typography from "@mui/material/Typography";

interface HeroProps {
  eyebrow?: string;
  title: string;
  blurb?: string;
  backgroundImageUrl?: string | null;
}

// The hero is an intentionally dark cinematic band in BOTH color schemes (its text
// always sits over a dark scrim / gradient), so it uses fixed dark/ light values
// rather than the mode-dependent surface + text tokens. (Full hero redesign lands
// with the home work.)
const FALLBACK_GRADIENT =
  "radial-gradient(ellipse 70% 60% at 25% 35%, rgba(30, 122, 90, 0.16) 0%, rgba(15, 14, 12, 0) 60%)," +
  "radial-gradient(ellipse 50% 40% at 80% 70%, rgba(30, 122, 90, 0.08) 0%, rgba(15, 14, 12, 0) 60%)," +
  "linear-gradient(135deg, #1A1815 0%, #0F0E0C 55%, #15130F 100%)";

export function Hero({
  eyebrow = "Featured",
  title,
  blurb,
  backgroundImageUrl,
}: HeroProps) {
  return (
    <Box
      sx={{
        position: "relative",
        minHeight: { xs: 380, md: 500 },
        backgroundColor: "#0F0E0C",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      {backgroundImageUrl ? (
        <>
          <Image
            src={backgroundImageUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover" }}
          />
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "linear-gradient(180deg, rgba(15,14,12,0.30) 0%, rgba(15,14,12,0.95) 100%)",
            }}
          />
        </>
      ) : (
        <Box
          aria-hidden
          sx={{ position: "absolute", inset: 0, backgroundImage: FALLBACK_GRADIENT }}
        />
      )}

      <Box
        sx={{
          maxWidth: 1280,
          mx: "auto",
          width: "100%",
          px: { xs: 3, md: 6 },
          py: { xs: 6, md: 8 },
          position: "relative",
          zIndex: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <Box
            sx={{ width: 40, height: 1, backgroundColor: "primary.main", opacity: 0.8 }}
          />
          <Typography variant="overline" sx={{ color: "primary.main" }}>
            {eyebrow}
          </Typography>
        </Box>
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: "2.75rem", sm: "3.5rem", md: "4.5rem" },
            color: "common.white",
            maxWidth: 820,
            mb: blurb ? 3 : 0,
          }}
        >
          {title}
        </Typography>
        {blurb && (
          <Typography
            sx={{
              fontSize: { xs: "1rem", md: "1.1rem" },
              color: "common.white",
              opacity: 0.78,
              maxWidth: 560,
              lineHeight: 1.6,
            }}
          >
            {blurb}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
