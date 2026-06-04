import Box from "@mui/material/Box";

interface MarqueeProps {
  items: string[];
  /** Leading label, e.g. "Now Showing". Pass "" to omit. */
  label?: string;
  /** Seconds for one full loop (lower = faster). */
  speed?: number;
}

/**
 * "Now showing" ticker — the continuous mono marquee from the Repertory masthead.
 * Pure CSS transform loop (GPU, holds 60fps); pauses on hover/focus. The keyframe
 * (`repertory-marquee`) lives in globals.css. Respects reduced-motion via the global
 * `prefers-reduced-motion: reduce` reset (it sits static for those users).
 */
export function Marquee({ items, label = "Now Showing", speed = 40 }: MarqueeProps) {
  // One segment, with a trailing separator so the duplicated copy joins seamlessly.
  const segment =
    (label ? `${label.toUpperCase()}    ` : "") +
    items.map((s) => s.toUpperCase()).join("    |    ") +
    "    |    ";

  return (
    <Box
      sx={{
        overflow: "hidden",
        borderTop: "1px solid",
        borderBottom: "1px solid",
        borderColor: "divider",
        py: 1,
        fontFamily: "var(--font-mono), ui-monospace, monospace",
        fontSize: "0.74rem",
        letterSpacing: "0.08em",
        color: "text.secondary",
        "&:hover .marquee-track, &:focus-within .marquee-track": {
          animationPlayState: "paused",
        },
      }}
    >
      <Box
        className="marquee-track"
        sx={{
          display: "inline-block",
          whiteSpace: "nowrap",
          willChange: "transform",
          backfaceVisibility: "hidden",
          transform: "translateZ(0)",
          animation: `repertory-marquee ${speed}s linear infinite`,
        }}
      >
        <Box component="span">{segment}</Box>
        <Box component="span" aria-hidden>
          {segment}
        </Box>
      </Box>
    </Box>
  );
}
