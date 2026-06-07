import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { ButtonLink, MetaText, Numeral, PageContainer, Reveal } from "@/components";

export const metadata: Metadata = { title: "Page not found — Group 2" };

const links = [
  { label: "Home", href: "/", variant: "contained" as const },
  { label: "Browse", href: "/browse", variant: "outlined" as const },
  { label: "Search", href: "/search", variant: "outlined" as const },
];

export default function NotFound() {
  return (
    <PageContainer>
      <Box
        sx={{
          minHeight: { xs: "50vh", md: "55vh" },
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          maxWidth: 720,
        }}
      >
        <Reveal index={0}>
          <Numeral
            value="404"
            pad={false}
            sx={{ fontSize: { xs: "5rem", md: "8rem" }, color: "primary.main", mb: 1 }}
          />
        </Reveal>

        <Reveal index={1}>
          <MetaText sx={{ display: "block", textTransform: "uppercase", color: "primary.dark" }}>
            Reel not found
          </MetaText>
        </Reveal>

        <Reveal index={2}>
          <Typography
            variant="h1"
            sx={{ fontSize: { xs: "2.5rem", md: "3.5rem" }, lineHeight: 1.05, mt: 1.5 }}
          >
            This title isn&rsquo;t in our repertory.
          </Typography>
        </Reveal>

        <Reveal index={3}>
          <Typography sx={{ mt: 2, color: "text.secondary", lineHeight: 1.7, fontSize: { xs: "1rem", md: "1.1rem" } }}>
            The page you were after has either moved on or never made the program.
            Let&rsquo;s get you back to something worth watching.
          </Typography>
        </Reveal>

        <Reveal index={4}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mt: { xs: 4, md: 5 } }}>
            {links.map((link) => (
              <ButtonLink
                key={link.href}
                href={link.href}
                variant={link.variant}
                color="primary"
                size="large"
              >
                {link.label}
              </ButtonLink>
            ))}
          </Box>
        </Reveal>
      </Box>
    </PageContainer>
  );
}
