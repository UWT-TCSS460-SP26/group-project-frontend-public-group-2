import Typography from "@mui/material/Typography";

interface SectionHeadingProps {
  children: React.ReactNode;
  /** Anchor / aria-labelledby target. */
  id?: string;
  /** Override the bottom margin (theme spacing units). Defaults to 1.5. */
  mb?: number;
}

/**
 * Shared sub-section heading for any view-level section ("Your rating",
 * "Community", "Write a review", "Your ratings", "Your reviews"…). Lives at
 * the same visual tier across the app so a user moving between detail and
 * profile sees one consistent rhythm.
 */
export function SectionHeading({ children, id, mb = 1.5 }: SectionHeadingProps) {
  return (
    <Typography
      variant="h2"
      id={id}
      sx={{
        fontSize: { xs: "1.4rem", md: "1.75rem" },
        mb,
      }}
    >
      {children}
    </Typography>
  );
}
