import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

interface HeroProps {
  eyebrow?: string;
  title: string;
  blurb?: string;
  backgroundImageUrl?: string | null;
}

export function Hero({
  eyebrow = "Featured",
  title,
  blurb,
  backgroundImageUrl,
}: HeroProps) {
  const backgroundImage = backgroundImageUrl
    ? `linear-gradient(180deg, rgba(15,14,12,0.30) 0%, rgba(15,14,12,0.95) 100%), url(${backgroundImageUrl})`
    : `radial-gradient(ellipse 70% 60% at 25% 35%, rgba(212, 162, 74, 0.14) 0%, rgba(15, 14, 12, 0) 60%),
       radial-gradient(ellipse 50% 40% at 80% 70%, rgba(212, 162, 74, 0.07) 0%, rgba(15, 14, 12, 0) 60%),
       linear-gradient(135deg, #1A1815 0%, #0F0E0C 55%, #1A1310 100%)`;

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: { xs: 380, md: 500 },
        backgroundColor: "background.paper",
        backgroundImage,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
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
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 3,
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 1,
              backgroundColor: "primary.main",
              opacity: 0.8,
            }}
          />
          <Typography variant="overline" sx={{ color: "primary.main" }}>
            {eyebrow}
          </Typography>
        </Box>
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: "2.75rem", sm: "3.5rem", md: "4.5rem" },
            color: "text.primary",
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
              color: "text.secondary",
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
