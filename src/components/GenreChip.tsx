import Box from "@mui/material/Box";

/**
 * A small, square, hairline-bordered mono chip for genres/tags — gallery-style, not
 * a rounded pill. Part of the editorial identity.
 */
export function GenreChip({ label }: { label: string }) {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        px: 0.85,
        py: 0.2,
        border: "1px solid",
        borderColor: "divider",
        fontFamily: "var(--font-mono), ui-monospace, monospace",
        fontSize: "0.68rem",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: "text.secondary",
        lineHeight: 1.7,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </Box>
  );
}
