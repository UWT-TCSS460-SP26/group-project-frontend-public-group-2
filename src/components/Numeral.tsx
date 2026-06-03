import Typography from "@mui/material/Typography";
import type { TypographyProps } from "@mui/material/Typography";

interface NumeralProps extends Omit<TypographyProps, "children"> {
  value: number | string;
  /** Zero-pad numbers to two digits (1 → "01"). Default true. */
  pad?: boolean;
}

/**
 * Oversized serif index numeral (01, 02 …) — the editorial section/rank marker from
 * the "Repertory" masthead. Decorative, so `aria-hidden` by default.
 */
export function Numeral({ value, pad = true, sx, ...props }: NumeralProps) {
  const display =
    pad && typeof value === "number"
      ? String(value).padStart(2, "0")
      : String(value);

  return (
    <Typography
      aria-hidden
      {...props}
      sx={[
        {
          fontFamily: "var(--font-fraunces), Georgia, serif",
          fontWeight: 500,
          lineHeight: 0.85,
          letterSpacing: "-0.03em",
          fontSize: { xs: "2.75rem", md: "4rem" },
          color: "text.primary",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {display}
    </Typography>
  );
}
