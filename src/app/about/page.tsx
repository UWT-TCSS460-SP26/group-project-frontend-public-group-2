import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { MetaText, PageContainer, PageTitle, Reveal, SectionHeading } from "@/components";

export const metadata: Metadata = { title: "About — Group 2" };

// The four of us across the whole quarter: we built Group 1's-shaped REST API in
// Sprints 1–4, then turned around and built this consumer front-end in Sprints 5–8.
// Each member's front-end lane is what they owned in the second half.
const team = [
  { name: "Rudolf", lane: "Design system · UI foundation · front-end lead" },
  { name: "Collins", lane: "Browse · search · watchlist" },
  { name: "Mani", lane: "Home · discovery rails" },
  { name: "Jonathan", lane: "Title detail · profile · about" },
];

const phases = [
  {
    sprints: "Sprints 1–4",
    title: "Back-end builders",
    note: "We designed and built the REST API — auth, data model, search, ratings, and reviews.",
  },
  {
    sprints: "Sprints 5–8",
    title: "Front-end builders",
    note: "We turned that experience into this consumer app: browse, search, detail, rate, and review.",
  },
];

const builtOn = [
  {
    name: "Group 1",
    note: "Our upstream partner. Their REST API powers everything you see here — browse, search, title detail, ratings, and reviews.",
  },
  {
    name: "TMDB",
    note: "The Movie Database supplies the catalog metadata, posters, and stills behind every title.",
  },
  {
    name: "Auth²",
    note: "OAuth2 sign-in — the secure identity layer that gates rating and reviewing.",
  },
];

export default function AboutPage() {
  return (
    <PageContainer>
      <PageTitle title="About" subtitle="Who built this, and what it's built on." />

      <Box component="section" sx={{ maxWidth: 720, mb: { xs: 7, md: 9 } }}>
        <Typography sx={{ color: "text.secondary", lineHeight: 1.75, fontSize: { xs: "1rem", md: "1.1rem" } }}>
          A consumer app for browsing, searching, rating, and reviewing movies and TV —
          built by Group 2 for TCSS 460 (Client/Server Programming, UW Tacoma, Spring 2026).
          Over one quarter the four of us shipped two halves of the same product: first the
          REST API in Sprints 1–4, then this editorial front-end on top of it in Sprints 5–8.
          The look — &ldquo;Repertory, evolved&rdquo; — is our take on a warm, gallery-quiet
          place to keep the films and shows worth your time.
        </Typography>
      </Box>

      <Box component="section" sx={{ mb: { xs: 7, md: 9 } }}>
        <SectionHeading>The team</SectionHeading>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
            gap: { xs: 3, md: 4 },
          }}
        >
          {team.map((member, i) => (
            <Reveal key={member.name} index={i}>
              <Box sx={{ borderTop: "1px solid", borderColor: "divider", pt: 2 }}>
                <Typography
                  sx={{
                    fontFamily: "var(--font-fraunces), Georgia, serif",
                    fontSize: "1.35rem",
                    lineHeight: 1.2,
                  }}
                >
                  {member.name}
                </Typography>
                <MetaText sx={{ display: "block", mt: 0.75, textTransform: "uppercase" }}>
                  {member.lane}
                </MetaText>
              </Box>
            </Reveal>
          ))}
        </Box>
        <MetaText sx={{ display: "block", mt: 3, color: "text.secondary" }}>
          All four · back-end builders Sprints 1–4 · front-end builders Sprints 5–8
        </MetaText>
      </Box>

      <Box component="section" sx={{ mb: { xs: 7, md: 9 } }}>
        <SectionHeading>Across the quarter</SectionHeading>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
            gap: { xs: 3, md: 4 },
          }}
        >
          {phases.map((phase, i) => (
            <Reveal key={phase.sprints} index={i}>
              <Box sx={{ borderTop: "1px solid", borderColor: "divider", pt: 2 }}>
                <MetaText sx={{ display: "block", color: "primary.dark", textTransform: "uppercase" }}>
                  {phase.sprints}
                </MetaText>
                <Typography
                  sx={{
                    fontFamily: "var(--font-fraunces), Georgia, serif",
                    fontSize: "1.25rem",
                    mt: 0.75,
                    mb: 1,
                  }}
                >
                  {phase.title}
                </Typography>
                <Typography sx={{ color: "text.secondary", lineHeight: 1.65 }}>
                  {phase.note}
                </Typography>
              </Box>
            </Reveal>
          ))}
        </Box>
      </Box>

      <Box component="section">
        <SectionHeading>Built on</SectionHeading>
        <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 3, md: 3.5 }, maxWidth: 760 }}>
          {builtOn.map((service, i) => (
            <Reveal key={service.name} index={i}>
              <Box sx={{ borderTop: "1px solid", borderColor: "divider", pt: 2 }}>
                <Typography
                  sx={{
                    fontFamily: "var(--font-fraunces), Georgia, serif",
                    fontSize: "1.2rem",
                    mb: 0.75,
                  }}
                >
                  {service.name}
                </Typography>
                <Typography sx={{ color: "text.secondary", lineHeight: 1.65 }}>
                  {service.note}
                </Typography>
              </Box>
            </Reveal>
          ))}
        </Box>
      </Box>
    </PageContainer>
  );
}
