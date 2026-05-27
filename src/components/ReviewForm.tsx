"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { MediaType } from "@/types/media";

export interface ReviewFormProps {
  /** TMDB id of the title being reviewed (the detail route's [id]). */
  tmdbId: string;
  mediaType: MediaType;
}

/**
 * STUB — owned by Jonathan (J1 #25, J2 #26).
 *
 * Replace the body with the real review form that calls `createReview`
 * (title optional, body required 1–5000), maps `error.fieldErrors` from a
 * Zod 400 onto fields, and on a 409 (`error.status === 409`) switches into
 * edit mode for the user's existing review (`updateReview`). Keep this prop
 * signature — the detail page mounts it as `<ReviewForm tmdbId mediaType />`.
 *
 * Reflect-after-submit contract (R2): after a successful create/update/delete
 * call `useRouter().refresh()` so the server-rendered detail page refetches the
 * enriched review list (it fetches with `cache: "no-store"`). (In local dev,
 * HMR can reuse a `no-store` response until a navigation/full reload —
 * production reflects immediately.)
 */
export function ReviewForm({ tmdbId, mediaType }: ReviewFormProps) {
  return (
    <Box
      aria-label={`Review form for ${mediaType} ${tmdbId} — coming soon`}
      sx={{
        p: 2,
        border: "1px dashed",
        borderColor: "divider",
        borderRadius: 1,
        bgcolor: "background.paper",
      }}
    >
      <Typography sx={{ color: "text.secondary" }}>
        Review form — coming soon.
      </Typography>
    </Box>
  );
}
