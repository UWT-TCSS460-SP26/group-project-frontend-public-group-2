import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { MetaText } from "@/components";

interface ProfileHeaderProps {
  email: string;
  rated: number;
  reviewed: number;
  /** Mean of the user's rating scores (0–10), or null when they have none. */
  avgScore: number | null;
}

/** One big editorial figure + mono label — the magazine-stat treatment. */
function Stat({
  value,
  label,
  icon,
  accent,
}: {
  value: string;
  label: string;
  icon?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <Box sx={{ textAlign: { xs: "left", sm: "center" } }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: { xs: "flex-start", sm: "center" },
          gap: 0.6,
        }}
      >
        {icon}
        <Typography
          component="span"
          sx={{
            fontFamily: "var(--font-fraunces), Georgia, serif",
            fontWeight: 500,
            lineHeight: 0.9,
            letterSpacing: "-0.02em",
            fontSize: { xs: "2.1rem", md: "2.6rem" },
            color: accent ? "primary.main" : "text.primary",
          }}
        >
          {value}
        </Typography>
      </Box>
      <MetaText
        sx={{
          display: "block",
          mt: 0.9,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
        }}
      >
        {label}
      </MetaText>
    </Box>
  );
}

/**
 * Premium profile masthead: brand monogram + identity on the left, big serif
 * stat figures on the right, over a faint emerald wash. Mode-aware via CSS vars
 * (the gradient and border read correctly in both light and dark schemes).
 */
export function ProfileHeader({ email, rated, reviewed, avgScore }: ProfileHeaderProps) {
  const initial = email.trim().charAt(0).toUpperCase();

  return (
    <Box
      component="header"
      sx={{
        position: "relative",
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
        borderTop: "2px solid",
        borderTopColor: "primary.main",
        bgcolor: "background.paper",
        backgroundImage:
          "linear-gradient(135deg, color-mix(in srgb, var(--mui-palette-primary-main) 9%, var(--mui-palette-background-paper)) 0%, var(--mui-palette-background-paper) 58%)",
        p: { xs: 3, md: 4.5 },
        mb: { xs: 4, md: 6 },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { md: "center" },
          justifyContent: "space-between",
          gap: { xs: 3.5, md: 4 },
        }}
      >
        {/* Identity */}
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 2, md: 2.5 }, minWidth: 0 }}>
          <Box
            aria-hidden
            sx={{
              flexShrink: 0,
              width: { xs: 60, md: 76 },
              height: { xs: 60, md: 76 },
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "primary.main",
              color: "primary.contrastText",
              fontFamily: "var(--font-mono), ui-monospace, monospace",
              fontSize: { xs: "1.5rem", md: "1.9rem" },
              fontWeight: 500,
            }}
          >
            {initial || "•"}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <MetaText
              sx={{
                display: "block",
                color: "primary.dark",
                textTransform: "uppercase",
                letterSpacing: "0.14em",
              }}
            >
              Signed in as
            </MetaText>
            <Typography
              variant="h1"
              component="h1"
              sx={{
                mt: 0.5,
                fontSize: { xs: "1.5rem", md: "2.1rem" },
                lineHeight: 1.1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {email}
            </Typography>
          </Box>
        </Box>

        {/* Stats */}
        <Box
          sx={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: { xs: 3, md: 4 },
          }}
        >
          <Stat value={String(rated)} label="Rated" />
          <Divider orientation="vertical" flexItem sx={{ borderColor: "divider" }} />
          <Stat value={String(reviewed)} label="Reviewed" />
          <Divider orientation="vertical" flexItem sx={{ borderColor: "divider" }} />
          <Stat
            value={avgScore != null ? avgScore.toFixed(1) : "—"}
            label="Avg score"
            accent
            icon={
              avgScore != null ? (
                <StarRoundedIcon sx={{ fontSize: { xs: 20, md: 24 }, color: "primary.main" }} />
              ) : undefined
            }
          />
        </Box>
      </Box>
    </Box>
  );
}
