import Box from "@mui/material/Box";

interface RevealProps {
  children: React.ReactNode;
  /** Position in a list — staggers the entrance (capped so long lists don't crawl). */
  index?: number;
}

/**
 * Staggered fade-up entrance for grid/rail items. Transform + opacity only (GPU,
 * 60fps). The whole animation is scoped to `prefers-reduced-motion: no-preference`,
 * so reduced-motion users get the content immediately — no movement, no delay.
 */
export function Reveal({ children, index = 0 }: RevealProps) {
  return (
    <Box
      sx={{
        "@media (prefers-reduced-motion: no-preference)": {
          opacity: 0,
          animation: "reveal-up 420ms ease-out forwards",
          animationDelay: `${Math.min(index, 14) * 45}ms`,
          "@keyframes reveal-up": {
            from: { opacity: 0, transform: "translateY(12px)" },
            to: { opacity: 1, transform: "translateY(0)" },
          },
        },
      }}
    >
      {children}
    </Box>
  );
}
