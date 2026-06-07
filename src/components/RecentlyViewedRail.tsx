"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import ClearAllRoundedIcon from "@mui/icons-material/ClearAllRounded";
import { useRecentlyViewed } from "@/lib/recently-viewed";
import type { Movie } from "@/types/media";
import { MovieCard } from "./MovieCard";
import { Rail } from "./Rail";

function toMovie(item: ReturnType<typeof useRecentlyViewed>["items"][number]): Movie {
  return {
    id: item.id,
    title: item.title,
    overview: "",
    poster_path: item.posterPath,
    release_date: item.year ?? "",
    language: "",
  };
}

export function RecentlyViewedRail() {
  const { items, clear } = useRecentlyViewed();

  if (items.length === 0) return null;

  return (
    <Box component="section" sx={{ mb: { xs: 6, md: 8 } }}>
      <Rail
        title={
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              minWidth: 0,
            }}
          >
            <Typography variant="h2" sx={{ fontSize: { xs: "1.5rem", md: "1.85rem" } }}>
              Recently viewed
            </Typography>
            <Button
              type="button"
              variant="text"
              size="small"
              startIcon={<ClearAllRoundedIcon fontSize="small" />}
              onClick={clear}
              sx={{
                flexShrink: 0,
                fontFamily: "var(--font-mono), ui-monospace, monospace",
                fontSize: "0.72rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Clear
            </Button>
          </Box>
        }
      >
        {items.map((item) => (
          <MovieCard
            key={`${item.mediaType}-${item.id}`}
            movie={toMovie(item)}
            mediaType={item.mediaType}
            metaSuffix={item.mediaType === "tv" ? "TV" : undefined}
          />
        ))}
      </Rail>
    </Box>
  );
}
