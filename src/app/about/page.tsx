import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { MetaText, PageContainer, PageTitle } from "@/components";

export const metadata: Metadata = { title: "About — Group 2" };

// Basic, real About so the deliverable + footer link work today; Jonathan's lane
// (JO-3) polishes it (build story, richer layout).
const team = [
  { name: "Rudolf", role: "Design system · UI foundation · front-end lead" },
  { name: "Collins", role: "Browse · search · watchlist" },
  { name: "Mani", role: "Home · discovery rails" },
  { name: "Jonathan", role: "Detail · profile · about" },
];

const builtOn = [
  { name: "Group 1", note: "our upstream partner — their API powers browse, search, detail, ratings, and reviews." },
  { name: "TMDB", note: "movie & TV metadata and artwork." },
  { name: "Auth²", note: "OAuth2 sign-in." },
];

export default function AboutPage() {
  return (
    <PageContainer>
      <PageTitle title="About" subtitle="Who built this, and what it's built on." />

      <Box component="section" sx={{ maxWidth: 720, mb: { xs: 6, md: 8 } }}>
        <Typography sx={{ color: "text.secondary", lineHeight: 1.7 }}>
          A consumer app for browsing, searching, rating, and reviewing movies and
          TV — built by Group 2 for TCSS 460 (Client/Server Programming, UW Tacoma,
          Spring 2026). The team built the back-end in Sprints 1–4 and this front-end
          in Sprints 5–8.
        </Typography>
      </Box>

      <Box component="section" sx={{ mb: { xs: 6, md: 8 } }}>
        <Typography variant="h2" sx={{ fontSize: { xs: "1.5rem", md: "1.85rem" }, mb: 3 }}>
          The team
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 3 }}>
          {team.map((member) => (
            <Box key={member.name} sx={{ borderTop: "1px solid", borderColor: "divider", pt: 1.5 }}>
              <Typography sx={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: "1.25rem" }}>
                {member.name}
              </Typography>
              <MetaText sx={{ display: "block", mt: 0.5 }}>{member.role}</MetaText>
            </Box>
          ))}
        </Box>
      </Box>

      <Box component="section">
        <Typography variant="h2" sx={{ fontSize: { xs: "1.5rem", md: "1.85rem" }, mb: 3 }}>
          Built on
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 720 }}>
          {builtOn.map((service) => (
            <Typography key={service.name} sx={{ color: "text.secondary", lineHeight: 1.6 }}>
              <Box component="span" sx={{ color: "text.primary", fontWeight: 600 }}>
                {service.name}
              </Box>{" "}
              — {service.note}
            </Typography>
          ))}
        </Box>
      </Box>
    </PageContainer>
  );
}
