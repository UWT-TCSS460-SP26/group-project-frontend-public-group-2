import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { auth } from "@/auth";
import { Hero, PageContainer, PopularGrid, EmptyState } from "@/components";
import type { Movie } from "@/types/media";

// TODO (Mani):
// 1. Replace `popular` below with a real fetch from Group 1's popular endpoint
//    using `fetchGroupOneApi` from "@/lib/api". See docs/components.md for the
//    pattern.
// 2. Add a search bar (input + <form action="/search">) above <PopularGrid> so
//    visitors can launch a search from the home page. The /search route itself
//    is Collins's.
// 3. Handle loading / empty / error with <LoadingState> / <EmptyState> /
//    <ErrorState>.
const popular: Movie[] = [];

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
        {popular.length > 0 ? (
          <PopularGrid movies={popular} />
        ) : (
          <EmptyState
            message="Catalog is being prepared."
            detail="Popular titles will appear here shortly."
          />
        )}

        {session?.accessToken && (
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
