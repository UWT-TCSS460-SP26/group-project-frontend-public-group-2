import Box from "@mui/material/Box";

// A subtle, fixed film-grain layer over the whole app — part of the "Repertory,
// evolved" editorial-cinema identity. Static SVG noise (no JS, GPU-composited) with
// `pointer-events: none`, so it never intercepts interaction or costs frames on scroll.
const NOISE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

export function GrainOverlay() {
  return (
    <Box
      aria-hidden
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        pointerEvents: "none",
        backgroundImage: `url("${NOISE}")`,
        backgroundRepeat: "repeat",
        opacity: 0.045, // light (gallery)
        ".dark &": { opacity: 0.07 }, // a touch stronger over the dark cinema surface
      }}
    />
  );
}
