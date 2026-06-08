import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import {
  ButtonLink,
  EmptyState,
  ErrorState,
  MetaText,
  MovieCard,
  PageContainer,
  Reveal,
} from "@/components";
import { fetchGroupOneApi } from "@/lib/api";
import type { MediaType, Movie, PopularResponse } from "@/types/media";

export const metadata: Metadata = { title: "Browse" };

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
  const searchType = tab === "tv" ? "tv" : "movies";
  const resultLabel = tab === "tv" ? "Popular TV shows" : "Popular movies";

  return (
    <PageContainer>
      <Box
        component="header"
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(360px, 0.72fr)" },
          gap: { xs: 3, md: 6 },
          alignItems: "end",
          pb: { xs: 4, md: 5 },
          mb: { xs: 3, md: 4 },
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box>
          <MetaText
            sx={{
              display: "block",
              mb: 1.5,
              color: "primary.main",
              textTransform: "uppercase",
              letterSpacing: "0.16em",
            }}
          >
            Discover
          </MetaText>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: "2.65rem", sm: "3.25rem", md: "4rem" },
              maxWidth: 680,
            }}
          >
            Find something worth watching.
          </Typography>
          <Typography
            sx={{
              mt: 2,
              maxWidth: 620,
              color: "text.secondary",
              fontSize: { xs: "0.95rem", md: "1.05rem" },
              lineHeight: 1.65,
            }}
          >
            Explore what is popular now, or search the full catalog when you
            already have a title in mind.
          </Typography>
        </Box>

        <Box
          component="form"
          method="GET"
          action="/search"
          role="search"
          sx={{
            p: { xs: 2, sm: 2.5 },
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Box
            component="label"
            htmlFor="browse-search"
            sx={{
              display: "block",
              mb: 1.25,
              fontFamily: "var(--font-mono), ui-monospace, monospace",
              fontSize: "0.78rem",
              lineHeight: 1.4,
              color: "text.secondary",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
            }}
          >
            Search the catalog
          </Box>
          <input type="hidden" name="type" value={searchType} />
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              id="browse-search"
              name="q"
              placeholder={tab === "tv" ? "Search TV shows" : "Search movies"}
              fullWidth
              size="small"
              autoComplete="off"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button type="submit" variant="contained" sx={{ px: { xs: 2, sm: 2.75 } }}>
              Search
            </Button>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { sm: "center" },
          justifyContent: "space-between",
          gap: 2,
          mb: { xs: 3, md: 4 },
        }}
      >
        <Box
          component="nav"
          aria-label="Browse media type"
          sx={{ display: "inline-flex", alignSelf: "flex-start" }}
        >
          {TABS.map((t, index) => (
            <ButtonLink
              key={t.value}
              href={`/browse?tab=${t.value}`}
              variant={tab === t.value ? "contained" : "outlined"}
              color="primary"
              aria-current={tab === t.value ? "page" : undefined}
              sx={{
                minWidth: 112,
                borderRadius: 0,
                ml: index === 0 ? 0 : "-1px",
              }}
            >
              {t.label}
            </ButtonLink>
          ))}
        </Box>

        <Box sx={{ textAlign: { sm: "right" } }}>
          <Typography
            variant="h2"
            sx={{ fontSize: { xs: "1.5rem", md: "1.8rem" }, lineHeight: 1.15 }}
          >
            {resultLabel}
          </Typography>
          <MetaText
            sx={{
              display: "block",
              mt: 0.75,
              color: "text.secondary",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Page {page} · {items.length} titles
          </MetaText>
        </Box>
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
            justifyContent: "space-between",
            gap: 2,
            mt: { xs: 6, md: 8 },
            pt: 3,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box sx={{ minWidth: { xs: 92, sm: 112 } }}>
            {page > 1 && (
              <ButtonLink
                href={`/browse?tab=${tab}&page=${page - 1}`}
                variant="outlined"
                size="small"
              >
                Previous
              </ButtonLink>
            )}
          </Box>

          <MetaText
            sx={{
              color: "text.secondary",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              textAlign: "center",
            }}
          >
            Page {page}
          </MetaText>

          <Box sx={{ minWidth: { xs: 92, sm: 112 }, textAlign: "right" }}>
            {hasMore && (
              <ButtonLink
                href={`/browse?tab=${tab}&page=${page + 1}`}
                variant="outlined"
                size="small"
              >
                Next
              </ButtonLink>
            )}
          </Box>
        </Box>
      )}
    </PageContainer>
  );
}
