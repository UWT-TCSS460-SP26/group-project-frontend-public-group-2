import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {
  ButtonLink,
  EmptyState,
  ErrorState,
  MovieCard,
  PageContainer,
  PageTitle,
  Reveal,
} from "@/components";
import { fetchGroupOneApi } from "@/lib/api";
import type { MediaType, Movie, PopularResponse } from "@/types/media";

export const metadata: Metadata = { title: "Browse — Group 2" };

// Always fetch fresh — popular feeds change daily.
export const dynamic = "force-dynamic";

// ── Constants ────────────────────────────────────────────────────────────────

const GRID_COLS = {
  xs: "repeat(2, 1fr)",
  sm: "repeat(3, 1fr)",
  md: "repeat(5, 1fr)",
  lg: "repeat(6, 1fr)",
};

type Tab = "movies" | "tv";

const TABS: { value: Tab; label: string; endpoint: string; mediaType: MediaType }[] = [
  { value: "movies", label: "Movies", endpoint: "/movies/popular", mediaType: "movie" },
  { value: "tv",     label: "TV Shows", endpoint: "/tv/popular",     mediaType: "tv"    },
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>;
}) {
  const { tab: rawTab = "movies", page: rawPage = "1" } = await searchParams;

  const tab: Tab = rawTab === "tv" ? "tv" : "movies";
  const page = Math.max(1, parseInt(rawPage, 10) || 1);
  const activeTab = TABS.find((t) => t.value === tab)!;

  let items: Movie[] = [];
  let fetchError: string | null = null;

  try {
    const data = await fetchGroupOneApi<PopularResponse>(activeTab.endpoint, {
      query: { page },
    });
    items = data.results;
  } catch (err) {
    fetchError =
      err instanceof Error ? err.message : "Failed to load titles.";
  }

  // Fewer than 20 results almost certainly means the last page.
  const hasMore = items.length >= 20;

  return (
    <PageContainer>
      <PageTitle
        title="Browse"
        subtitle={tab === "tv" ? "Popular TV shows" : "Popular movies"}
      />

      {/* ── Tab switcher ── */}
      <Box sx={{ display: "flex", gap: 1, mb: { xs: 4, md: 5 } }}>
        {TABS.map((t) => (
          <ButtonLink
            key={t.value}
            href={`/browse?tab=${t.value}`}
            variant={tab === t.value ? "contained" : "outlined"}
            color="primary"
            size="small"
          >
            {t.label}
          </ButtonLink>
        ))}
      </Box>

      {/* ── Results ── */}
      {fetchError ? (
        <ErrorState
          message="Could not load titles."
          detail={fetchError}
        />
      ) : items.length === 0 ? (
        <EmptyState
          message="Nothing here yet."
          detail="The catalog is being prepared — check back shortly."
        />
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: GRID_COLS,
            gap: { xs: 2, md: 3 },
          }}
        >
          {items.map((item, i) => (
            <Reveal key={item.id} index={i}>
              <MovieCard
                  movie={item}
                  mediaType={activeTab.mediaType}
                  metaSuffix={tab === "tv" ? "TV" : undefined}
                />
            </Reveal>
          ))}
        </Box>
      )}

      {/* ── Pagination ── */}
      {!fetchError && items.length > 0 && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            mt: { xs: 6, md: 8 },
          }}
        >
          {page > 1 && (
            <ButtonLink
              href={`/browse?tab=${tab}&page=${page - 1}`}
              variant="outlined"
              size="small"
            >
              ← Previous
            </ButtonLink>
          )}

          <Typography
            sx={{
              color: "text.secondary",
              fontFamily: "var(--font-mono)",
              fontSize: "0.78rem",
              letterSpacing: "0.06em",
            }}
          >
            Page {page}
          </Typography>

          {hasMore && (
            <ButtonLink
              href={`/browse?tab=${tab}&page=${page + 1}`}
              variant="outlined"
              size="small"
            >
              Next →
            </ButtonLink>
          )}
        </Box>
      )}
    </PageContainer>
  );
}
