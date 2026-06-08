import Box from "@mui/material/Box";

/**
 * Per-navigation page cross-fade. Opacity-only → GPU-cheap, no layout work, holds
 * 60fps. `template.tsx` re-mounts on every route change, so the fade replays each
 * navigation. Reduced-motion users get it instantly (globals.css neutralizes the
 * animation under `prefers-reduced-motion`).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        animation: "page-fade-in 180ms ease-out both",
        "@keyframes page-fade-in": {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        "@media (prefers-reduced-motion: reduce)": {
          animation: "none",
        },
      }}
    >
      {children}
    </Box>
  );
}
