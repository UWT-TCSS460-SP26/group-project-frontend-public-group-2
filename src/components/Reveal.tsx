import Box from "@mui/material/Box";

interface RevealProps {
  children: React.ReactNode;
  /** Position in a list — staggers the entrance (capped so long lists don't crawl). */
  index?: number;
}

/**
 * Staggered fade-up entrance for grid/rail items. Transform + opacity only (GPU,
 * 60fps). The `reveal-up` keyframe lives in globals.css; `both` fill means the item
 * is safely visible even if the animation never runs.
 */
export function Reveal({ children, index = 0 }: RevealProps) {
  return (
    <Box
      sx={{
        animation: "reveal-up 420ms ease-out both",
        animationDelay: `${Math.min(index, 14) * 45}ms`,
        "@media (prefers-reduced-motion: reduce)": {
          animation: "none",
        },
      }}
    >
      {children}
    </Box>
  );
}
