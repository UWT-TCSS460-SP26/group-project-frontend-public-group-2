"use client";

import { useSyncExternalStore } from "react";
import Box from "@mui/material/Box";
import {
  ButtonLink,
  EmptyState,
  MovieCard,
  PageContainer,
  PageTitle,
} from "@/components";
import { useWatchlist } from "@/lib/watchlist";
import type { Movie } from "@/types/media";

// Hydration guard so we don't flash the empty state before localStorage is read.
const emptySubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

export default function WatchlistPage() {
  const { items } = useWatchlist();
  const hydrated = useHydrated();

  const subtitle =
    hydrated && items.length > 0
      ? `${items.length} saved title${items.length !== 1 ? "s" : ""} — remove with the bookmark`
      : "Everything you've saved to watch later.";

  return (
    <PageContainer>
      <PageTitle title="Your watchlist" subtitle={subtitle} />

      {!hydrated ? null : items.length === 0 ? (
        <Box sx={{ textAlign: "center" }}>
          <EmptyState
            message="Nothing saved yet."
            detail="Tap the bookmark on any title to add it to your watchlist."
          />
          <ButtonLink
            href="/"
            variant="outlined"
            sx={{
              fontFamily: "var(--font-mono), ui-monospace, monospace",
              fontSize: "0.72rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Find something to watch
          </ButtonLink>
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              sm: "repeat(3, 1fr)",
              md: "repeat(5, 1fr)",
            },
            gap: 3,
          }}
        >
          {items.map((item) => {
            const movie: Movie = {
              id: item.id,
              title: item.title,
              overview: "",
              poster_path: item.posterPath,
              release_date: item.year ? `${item.year}-01-01` : "",
              language: "",
            };
            return (
              <MovieCard
                key={`${item.mediaType}-${item.id}`}
                movie={movie}
                mediaType={item.mediaType}
              />
            );
          })}
        </Box>
      )}
    </PageContainer>
  );
}
