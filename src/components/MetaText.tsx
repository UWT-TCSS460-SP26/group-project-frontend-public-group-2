import Typography from "@mui/material/Typography";
import type { TypographyProps } from "@mui/material/Typography";

/**
 * Monospaced meta label — the editorial "film-slate" voice for years, runtimes,
 * genres, catalog numbers, and section labels (e.g. `2014 · 169 MIN · SCI-FI`).
 *
 * Defaults to a small, lightly tracked, muted style. Override anything via `sx`
 * or Typography props at the call site (e.g. `component="div"`, `color`,
 * `sx={{ textTransform: "uppercase" }}` for section labels).
 */
export function MetaText({ sx, ...props }: TypographyProps) {
  return (
    <Typography
      component="span"
      {...props}
      sx={[
        {
          fontFamily: "var(--font-mono), ui-monospace, SFMono-Regular, monospace",
          fontSize: "0.78rem",
          letterSpacing: "0.04em",
          lineHeight: 1.4,
          color: "text.secondary",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  );
}
