"use client";

import Box from "@mui/material/Box";
import Link from "next/link";
import Typography from "@mui/material/Typography";
import { MetaText } from "./MetaText";

const footerLinks = [
  { label: "Browse", href: "/browse" },
  { label: "Search", href: "/search" },
  { label: "Watchlist", href: "/watchlist" },
  { label: "Compare", href: "/compare" },
  { label: "About", href: "/about" },
];

/**
 * Production-style site footer (contentinfo landmark): brand + tagline, a few links,
 * and a copyright line. The data/auth/API credits live on the About page.
 */
export function Footer() {
  return (
    <Box component="footer" sx={{ borderTop: "1px solid", borderColor: "divider", mt: { xs: 5, md: 7 } }}>
      <Box
        sx={{
          maxWidth: 1280,
          mx: "auto",
          px: { xs: 3, md: 6 },
          py: { xs: 5, md: 6 },
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          gap: 4,
        }}
      >
        <Box sx={{ maxWidth: 320 }}>
          <Typography sx={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: "1.25rem", mb: 1 }}>
            Repertory / Group 2
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: "0.9rem", lineHeight: 1.6 }}>
            Browse, search, and keep a watchlist of the films and shows worth your time.
          </Typography>
        </Box>

        <Box component="nav" sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
          {footerLinks.map((link) => (
            <Box
              key={link.href}
              component={Link}
              href={link.href}
              sx={{ textDecoration: "none" }}
            >
              <MetaText sx={{ color: "text.secondary", transition: "color 180ms ease", "&:hover": { color: "text.primary" } }}>
                {link.label}
              </MetaText>
            </Box>
          ))}
        </Box>
      </Box>

      <Box sx={{ borderTop: "1px solid", borderColor: "divider" }}>
        <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 3, md: 6 }, py: 2.5 }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 1.5 }}>
            <MetaText sx={{ color: "text.secondary" }}>
              Group 2 · TCSS 460 · Spring 2026
            </MetaText>
            <MetaText sx={{ color: "text.secondary" }}>
              Data: TMDB · Auth: Auth² · API: Group 1
            </MetaText>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
