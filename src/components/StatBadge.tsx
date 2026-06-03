import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";

interface StatBadgeProps {
  children: React.ReactNode;
  /** Optional leading icon, e.g. a star for a community score. */
  icon?: React.ReactNode;
  sx?: SxProps<Theme>;
}

/**
 * Mono stat pill — community score (★ 8.4), review counts, etc. Square + hairline,
 * sits inline in meta rows or over a poster.
 */
export function StatBadge({ children, icon, sx }: StatBadgeProps) {
  return (
    <Box
      component="span"
      sx={[
        {
          display: "inline-flex",
          alignItems: "center",
          gap: 0.4,
          px: 0.7,
          py: 0.2,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          fontFamily: "var(--font-mono), ui-monospace, monospace",
          fontSize: "0.72rem",
          lineHeight: 1.5,
          color: "text.primary",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {icon}
      {children}
    </Box>
  );
}
