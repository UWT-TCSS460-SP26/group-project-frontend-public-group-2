import { Suspense } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { auth } from "@/auth";
import {
  EmptyState,
  ErrorState,
  Hero,
  LoadingState,
  PageContainer,
  PopularGrid,
} from "@/components";
import { fetchGroupOneApi } from "@/lib/api";
import type { SearchResults } from "@/types/media";

async function PopularSection() {
  let data: SearchResults | null = null;
  let errorDetail: string | null = null;
  try {
    data = await fetchGroupOneApi<SearchResults>("/movies/popular");
  } catch (error) {
    errorDetail =
      error instanceof Error
        ? error.message
        : "We couldn't load popular titles right now.";
  }

  if (errorDetail) {
    return (
      <ErrorState
        message="Popular titles are unavailable."
        detail={errorDetail}
      />
    );
  }

  if (!data || data.results.length === 0) {
    return (
      <EmptyState
        message="Catalog is being prepared."
        detail="Popular titles will appear here shortly."
      />
    );
  }

  return <PopularGrid movies={data.results} />;
}

export default async function Home() {
  const session = await auth();

  return (
    <>
      <Hero
        eyebrow="Featured"
        title="Find your next watch."
        blurb="Search, browse, and discover movies and shows pulled live from our upstream partner's catalog."
      />
      <PageContainer>
        <Box
          component="form"
          action="/search"
          method="GET"
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 1.5,
            alignItems: { sm: "center" },
            mb: { xs: 5, md: 6 },
          }}
        >
          <TextField
            name="q"
            variant="outlined"
            fullWidth
            placeholder="Search titles, genres, and more"
            aria-label="Search for movies or shows"
          />
          <Button
            type="submit"
            variant="contained"
            sx={{
              alignSelf: { xs: "stretch", sm: "auto" },
              whiteSpace: "nowrap",
              px: 2.5,
            }}
          >
            Search →
          </Button>
        </Box>

        <Suspense
          fallback={<LoadingState message="Loading popular titles..." />}
        >
          <PopularSection />
        </Suspense>

        {/* Dev-only access-token debug block. Hidden in production builds so we
            don't leak a bearer token in server-rendered HTML. */}
        {process.env.NODE_ENV !== "production" && session?.accessToken && (
          <Box
            component="details"
            sx={{
              mt: { xs: 8, md: 12 },
              color: "text.secondary",
              fontSize: "0.85rem",
              maxWidth: 720,
            }}
          >
            <Box component="summary" sx={{ cursor: "pointer", mb: 1 }}>
              Dev: access token (paste into jwt.io to verify iss + aud)
            </Box>
            <Typography
              component="pre"
              sx={{
                fontFamily: "monospace",
                fontSize: "0.72rem",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
                p: 2,
                borderRadius: 1,
              }}
            >
              {session.accessToken}
            </Typography>
          </Box>
        )}
      </PageContainer>
    </>
  );
}
