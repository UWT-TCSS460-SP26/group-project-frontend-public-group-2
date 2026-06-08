import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";

/** Placeholder for a single MovieCard while a poster grid/rail loads. */
export function CardSkeleton() {
  return (
    <Box>
      <Skeleton
        variant="rectangular"
        animation="wave"
        sx={{ width: "100%", aspectRatio: "2 / 3", mb: 1, borderRadius: 0 }}
      />
      <Skeleton variant="text" animation="wave" width="85%" />
      <Skeleton variant="text" animation="wave" width="40%" />
    </Box>
  );
}

/** A horizontal row of card skeletons, matching the Rail footprint. */
export function RailSkeleton({ count = 6 }: { count?: number }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridAutoFlow: "column",
        gridAutoColumns: { xs: "42%", sm: "28%", md: "16.5%" },
        gap: { xs: 2, md: 3 },
        overflow: "hidden",
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </Box>
  );
}
