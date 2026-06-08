import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import {
  CardSkeleton,
  EmptyState,
  ErrorState,
  GenreChip,
  LoadingState,
  Marquee,
  MetaText,
  MovieCard,
  Numeral,
  PageContainer,
  PageTitle,
  Rail,
  RailSkeleton,
  Reveal,
  StatBadge,
} from "@/components";
import type { Movie } from "@/types/media";

export const metadata: Metadata = { title: "Styleguide" };

// Sample data for the component demos.
const SAMPLE: Movie[] = [
  { id: 157336, title: "Interstellar", overview: "", poster_path: "/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg", release_date: "2014-11-05", language: "en" },
  { id: 1339713, title: "Obsession", overview: "", poster_path: "/6X4qFYBsG3bpWDG2XIKqr04kFJa.jpg", release_date: "2026-05-13", language: "en" },
  { id: 124364, title: "FROM", overview: "", poster_path: "/pRtJagIxpfODzzb0T0NAvZSzErC.jpg", release_date: "2022-02-20", language: "en" },
  { id: 999001, title: "Untitled (no poster)", overview: "", poster_path: null, release_date: "2025-01-01", language: "en" },
];

const colorTokens = [
  "background.default",
  "background.paper",
  "primary.main",
  "secondary.main",
  "error.main",
  "success.main",
  "text.primary",
  "text.secondary",
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box component="section" sx={{ mb: { xs: 6, md: 8 } }}>
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 2, mb: 3 }}>
        <Typography variant="h2" sx={{ fontSize: { xs: "1.4rem", md: "1.6rem" } }}>
          {title}
        </Typography>
        <Box sx={{ flex: 1, height: "1px", bgcolor: "divider" }} />
      </Box>
      {children}
    </Box>
  );
}

/**
 * Dev-only reference of the "Repertory" component vocabulary — the source teammates
 * copy from so pages stay consistent. Toggle the theme in the header to see both modes.
 * Guarded out of production.
 */
export default function StyleguidePage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <PageContainer>
      <PageTitle
        title="Styleguide"
        subtitle="The Repertory component vocabulary — toggle the theme (header) to see light & dark."
      />

      <Section title="Color tokens">
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2,1fr)", sm: "repeat(4,1fr)" }, gap: 2 }}>
          {colorTokens.map((token) => (
            <Box key={token}>
              <Box sx={{ height: 64, bgcolor: token, border: "1px solid", borderColor: "divider", mb: 0.75 }} />
              <MetaText sx={{ display: "block" }}>{token}</MetaText>
            </Box>
          ))}
        </Box>
      </Section>

      <Section title="Typography">
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="h1" sx={{ fontSize: { xs: "2.5rem", md: "3.5rem" } }}>
            Display — Fraunces
          </Typography>
          <Typography variant="h2" sx={{ fontSize: "1.85rem" }}>
            Section heading — H2
          </Typography>
          <Typography>Body — Inter. The quick brown fox jumps over the lazy dog.</Typography>
          <MetaText>META · MONO · 2014 · 169 MIN · SCI-FI</MetaText>
          <Typography variant="overline">Overline · eyebrow</Typography>
          <Box sx={{ display: "flex", gap: 3, alignItems: "baseline" }}>
            <Numeral value={1} />
            <Numeral value={2} />
            <Numeral value={12} />
          </Box>
        </Box>
      </Section>

      <Section title="Buttons">
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
          <Button variant="contained" color="primary">
            Primary
          </Button>
          <Button variant="outlined">Secondary</Button>
          <Button>Tertiary</Button>
          <Button variant="outlined" color="error">
            Destructive
          </Button>
        </Box>
      </Section>

      <Section title="Badges & chips">
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
          <StatBadge icon={<StarRoundedIcon sx={{ fontSize: 14, color: "primary.main" }} />}>8.4</StatBadge>
          <StatBadge>128 reviews</StatBadge>
          <GenreChip label="Sci-Fi" />
          <GenreChip label="Drama" />
          <GenreChip label="Thriller" />
        </Box>
      </Section>

      <Section title="MovieCard (hover for the lift + accent rule + watchlist)">
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2,1fr)", sm: "repeat(4,1fr)" }, gap: 3 }}>
          {SAMPLE.map((movie, i) => (
            <Reveal key={movie.id} index={i}>
              <MovieCard movie={movie} />
            </Reveal>
          ))}
        </Box>
      </Section>

      <Section title="Rail (horizontal scroll + arrows)">
        <Rail
          title={
            <Typography variant="h2" sx={{ fontSize: "1.4rem" }}>
              Sample rail
            </Typography>
          }
        >
          {[...SAMPLE, ...SAMPLE].map((movie, i) => (
            <MovieCard key={`${movie.id}-${i}`} movie={movie} />
          ))}
        </Rail>
      </Section>

      <Section title="Skeletons (loading)">
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2,1fr)", sm: "repeat(4,1fr)" }, gap: 3, mb: 3 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </Box>
        <RailSkeleton count={6} />
      </Section>

      <Section title="Marquee">
        <Marquee items={["Czech New Wave", "Bergman & Beyond", "Fellini's Carnival", "Kurosawa Retrospective"]} />
      </Section>

      <Section title="States">
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3,1fr)" }, gap: 2 }}>
          <Box sx={{ border: "1px solid", borderColor: "divider" }}>
            <EmptyState message="Nothing here yet." detail="Empty state." />
          </Box>
          <Box sx={{ border: "1px solid", borderColor: "divider" }}>
            <LoadingState message="Loading…" />
          </Box>
          <Box sx={{ border: "1px solid", borderColor: "divider" }}>
            <ErrorState message="Something broke." detail="Error state." />
          </Box>
        </Box>
      </Section>
    </PageContainer>
  );
}
