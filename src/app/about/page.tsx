import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { MetaText, PageContainer, PageTitle, Reveal, SectionHeading } from "@/components";

export const metadata: Metadata = { title: "About — Group 2" };

// The four of us across the whole quarter: we built a Group-1-shaped REST API in
// Sprints 1–4, then turned around and built this consumer front-end in Sprints 5–8.
// These are the high-level areas each of us owned on the front-end — the kind of
// work, not a page-by-page list.
const team = [
  {
    name: "Rudolf",
    role: "Front-end lead",
    areas: "Architecture · design system · motion · auth · API layer",
  },
  {
    name: "Collins",
    role: "Discovery & search",
    areas: "Browsing · filters · sorting · ratings · compare",
  },
  {
    name: "Mani",
    role: "Home & live data",
    areas: "Hero · rails · marquee · command palette",
  },
  {
    name: "Jonathan",
    role: "Detail & reviews",
    areas: "Title pages · reviews · profile",
  },
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
    role: "Upstream API",
    note: "Our upstream partner. Their REST API powers everything you see here — browse, search, title detail, ratings, and reviews.",
  },
  {
    name: "TMDB",
    role: "Catalog metadata",
    note: "The Movie Database supplies the catalog metadata, posters, and stills behind every title.",
  },
  {
    name: "Auth²",
    role: "Identity",
    note: "OAuth2 sign-in — the secure identity layer that gates rating and reviewing.",
  },
];

export default function AboutPage() {
  return (
    <PageContainer>
      <MetaText
        sx={{
          display: "block",
          mb: 1.5,
          color: "primary.dark",
          textTransform: "uppercase",
          letterSpacing: "0.14em",
        }}
      >
        TCSS 460 · UW Tacoma · Spring 2026
      </MetaText>
      <PageTitle title="About" subtitle="Who built this, and what it's built on." />

      {/* Lead — the first line carries editorial weight in serif, the rest reads
          as quiet supporting copy. */}
      <Box component="section" sx={{ maxWidth: 760, mb: { xs: 8, md: 11 } }}>
        <Typography
          sx={{
            fontFamily: "var(--font-fraunces), Georgia, serif",
            fontSize: { xs: "1.4rem", md: "1.75rem" },
            lineHeight: 1.35,
            mb: 2.5,
          }}
        >
          A warm, gallery-quiet place to keep the films and shows worth your time.
        </Typography>
        <Typography sx={{ color: "text.secondary", lineHeight: 1.75, fontSize: { xs: "1rem", md: "1.05rem" } }}>
          A consumer app for browsing, searching, rating, and reviewing movies and TV —
          built by Group 2 for TCSS 460 (Client/Server Programming, UW Tacoma, Spring 2026).
          Over one quarter the four of us shipped two halves of the same product: first the
          REST API in Sprints 1–4, then this editorial front-end on top of it in Sprints 5–8.
          The look — &ldquo;Repertory, evolved&rdquo; — is our own.
        </Typography>
      </Box>

      <Box component="section" sx={{ mb: { xs: 8, md: 11 } }}>
        <SectionHeading>The team</SectionHeading>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
            gap: { xs: 2, md: 2.5 },
          }}
        >
          {team.map((member, i) => (
            <Reveal key={member.name} index={i}>
              <Box
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.75,
                  p: { xs: 2.5, md: 3 },
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  {/* Brand monogram — emerald square echoing the header avatar. */}
                  <Box
                    aria-hidden
                    sx={{
                      width: 44,
                      height: 44,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                      fontFamily: "var(--font-mono), ui-monospace, monospace",
                      fontSize: "1.05rem",
                      fontWeight: 500,
                    }}
                  >
                    {member.name.charAt(0)}
                  </Box>
                  <MetaText sx={{ color: "text.secondary" }}>
                    {String(i + 1).padStart(2, "0")}
                  </MetaText>
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontFamily: "var(--font-fraunces), Georgia, serif",
                      fontSize: "1.35rem",
                      lineHeight: 1.2,
                    }}
                  >
                    {member.name}
                  </Typography>
                  <MetaText
                    sx={{
                      display: "block",
                      mt: 0.75,
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      color: "primary.dark",
                    }}
                  >
                    {member.role}
                  </MetaText>
                  <MetaText
                    sx={{
                      display: "block",
                      mt: 1.25,
                      color: "text.secondary",
                      lineHeight: 1.6,
                    }}
                  >
                    {member.areas}
                  </MetaText>
                </Box>
              </Box>
            </Reveal>
          ))}
        </Box>
        <MetaText sx={{ display: "block", mt: 3, color: "text.secondary" }}>
          All four · back-end builders Sprints 1–4 · front-end builders Sprints 5–8
        </MetaText>
      </Box>

      <Box component="section" sx={{ mb: { xs: 8, md: 11 } }}>
        <SectionHeading>Across the quarter</SectionHeading>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
            gap: { xs: 2, md: 2.5 },
          }}
        >
          {phases.map((phase, i) => (
            <Reveal key={phase.sprints} index={i}>
              <Box
                sx={{
                  height: "100%",
                  p: { xs: 2.5, md: 3.5 },
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                  // Accent edge marks each phase without shouting.
                  borderTop: "2px solid",
                  borderTopColor: "primary.main",
                }}
              >
                <MetaText sx={{ display: "block", color: "primary.dark", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                  {phase.sprints}
                </MetaText>
                <Typography
                  sx={{
                    fontFamily: "var(--font-fraunces), Georgia, serif",
                    fontSize: { xs: "1.35rem", md: "1.5rem" },
                    mt: 1,
                    mb: 1.25,
                  }}
                >
                  {phase.title}
                </Typography>
                <Typography sx={{ color: "text.secondary", lineHeight: 1.7 }}>
                  {phase.note}
                </Typography>
              </Box>
            </Reveal>
          ))}
        </Box>
      </Box>

      <Box component="section">
        <SectionHeading>Built on</SectionHeading>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
            gap: { xs: 2, md: 2.5 },
          }}
        >
          {builtOn.map((service, i) => (
            <Reveal key={service.name} index={i}>
              <Box
                sx={{
                  height: "100%",
                  p: { xs: 2.5, md: 3 },
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                }}
              >
                <MetaText sx={{ display: "block", color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                  {service.role}
                </MetaText>
                <Typography
                  sx={{
                    fontFamily: "var(--font-fraunces), Georgia, serif",
                    fontSize: "1.25rem",
                    mt: 1,
                    mb: 1,
                  }}
                >
                  {service.name}
                </Typography>
                <Typography sx={{ color: "text.secondary", lineHeight: 1.7 }}>
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
