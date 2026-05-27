"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { MediaType } from "@/types/media";

export interface RatingControlProps {
  /** TMDB id of the title being rated (the detail route's [id]). */
  tmdbId: string;
  mediaType: MediaType;
}

/**
 * STUB — owned by Collins (C1 #23, C2 #24).
 *
 * Replace the body with the real 0–10 rating widget that calls the rating
 * Server Actions (`createRating` / `updateRating` / `deleteRating`,
 * `getMyRatings` to find an existing score). Keep this prop signature — the
 * detail page mounts it as `<RatingControl tmdbId mediaType />`.
 *
 * Reflect-after-submit contract (R2): after a successful mutation call
 * `useRouter().refresh()` so the server-rendered detail page refetches the
 * enriched aggregate (it fetches with `cache: "no-store"`) and the new value
 * shows without a manual reload. (In local dev, HMR can reuse a `no-store`
 * response until a navigation/full reload — production reflects immediately.)
 */
export function RatingControl({ tmdbId, mediaType }: RatingControlProps) {
  return (
    <Box
      aria-label={`Rating control for ${mediaType} ${tmdbId} — coming soon`}
      sx={{
        p: 2,
        border: "1px dashed",
        borderColor: "divider",
        borderRadius: 1,
        bgcolor: "background.paper",
      }}
    >
      <Typography sx={{ color: "text.secondary" }}>
        Rating control — coming soon.
      </Typography>
    </Box>
  );
}
