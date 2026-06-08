import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { SITE_NAME } from "@/lib/brand";
import { MetaText, PageContainer, PageTitle, Reveal, SectionHeading } from "@/components";

export const metadata: Metadata = { title: "About" };

const team = [
  {
    name: "Rudolf",
    role: "Product, design & engineering lead",
    backend:
      "API architecture, TMDB and movie-detail foundation, versioning, validation, Auth²/JWKS, Prisma contracts, issue triage routes, CI, integration, and releases.",
    frontend:
      "App scaffold, auth/API layer, visual direction, design system, shared components, watchlist, motion and accessibility, integration, deployment, and the final UI/UX redesign and polish across every major route.",
  },
  {
    name: "Collins",
    role: "Discovery, ratings & comparison",
    backend:
      "Movie search and popular routes, auth setup, public issue reporting, personal ratings, ratings coverage, and OpenAPI audits.",
    frontend:
      "Rating control, browse, movie/TV search, filters and sorting, TV discovery, watchlist page, and compare.",
  },
  {
    name: "Mani",
    role: "Home, community & live data",
    backend:
      "TV search and popular routes, ratings and reviews CRUD, request parsing, enriched movie/community work, and personal reviews.",
    frontend:
      "Profile foundation, editorial home data, hero, discovery rails, marquee, command palette, and recently viewed.",
  },
  {
    name: "Jonathan",
    role: "Titles, reviews & content",
    backend:
      "TV details, mutation and authorization coverage, API documentation, issue-admin tests, and author-surface consistency.",
    frontend:
      "Title detail foundation, review form and list, About, branded 404, and profile polish.",
  },
];

const services = [
  {
    title: "Group 1 API",
    note: "Our upstream partner provides the movie, TV, rating, review, and community endpoints consumed by this app.",
  },
  {
    title: "TMDB",
    note: "Movie and television metadata and artwork are supplied through The Movie Database.",
  },
  {
    title: "Auth²",
    note: "The course OAuth2/OIDC service provides sign-in and bearer tokens for authenticated ratings and reviews.",
  },
];

const phases = [
  {
    title: "Foundations",
    note: "The team shaped the platform around search, ratings, reviews, and identity before turning to the consumer experience.",
  },
  {
    title: "Experience",
    note: `${SITE_NAME} turns that work into a calmer, editorial space for browsing, tracking, rating, and reviewing.`,
  },
];

export default function AboutPage() {
  return (
    <PageContainer>
      <PageTitle title="About" subtitle={`The team behind ${SITE_NAME}.`} />

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
          {SITE_NAME} is a place to browse, save, rate, and review the films and shows worth
          your time. Built by Group 2, it leans into quiet motion, editorial typography,
          and a more curated feel than a generic catalog.
        </Typography>
      </Box>

      <Box component="section" sx={{ mb: { xs: 8, md: 11 } }}>
        <SectionHeading>The team</SectionHeading>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
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
                  <MetaText sx={{ display: "block", mt: 2, color: "primary.dark" }}>
                    Back end · Sprints 1–4
                  </MetaText>
                  <Typography sx={{ mt: 0.75, color: "text.secondary", lineHeight: 1.7 }}>
                    {member.backend}
                  </Typography>
                  <MetaText sx={{ display: "block", mt: 2, color: "primary.dark" }}>
                    Front end · Sprints 5–8
                  </MetaText>
                  <Typography sx={{ mt: 0.75, color: "text.secondary", lineHeight: 1.7 }}>
                    {member.frontend}
                  </Typography>
                </Box>
              </Box>
            </Reveal>
          ))}
        </Box>
      </Box>

      <Box component="section" sx={{ mb: { xs: 8, md: 11 } }}>
        <SectionHeading>Partners & services</SectionHeading>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: { xs: 2, md: 2.5 },
          }}
        >
          {services.map((service, i) => (
            <Reveal key={service.title} index={i}>
              <Box
                sx={{
                  height: "100%",
                  p: { xs: 2.5, md: 3 },
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                }}
              >
                <MetaText sx={{ color: "primary.dark" }}>
                  {String(i + 1).padStart(2, "0")}
                </MetaText>
                <Typography
                  sx={{
                    mt: 1.5,
                    fontFamily: "var(--font-fraunces), Georgia, serif",
                    fontSize: "1.35rem",
                  }}
                >
                  {service.title}
                </Typography>
                <Typography sx={{ mt: 1, color: "text.secondary", lineHeight: 1.7 }}>
                  {service.note}
                </Typography>
              </Box>
            </Reveal>
          ))}
        </Box>
      </Box>

      <Box component="section" sx={{ mb: { xs: 8, md: 11 } }}>
        <SectionHeading>How It Came Together</SectionHeading>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
            gap: { xs: 2, md: 2.5 },
          }}
        >
          {phases.map((phase, i) => (
            <Reveal key={phase.title} index={i}>
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
                <Typography
                  sx={{
                    fontFamily: "var(--font-fraunces), Georgia, serif",
                    fontSize: { xs: "1.35rem", md: "1.5rem" },
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
    </PageContainer>
  );
}
