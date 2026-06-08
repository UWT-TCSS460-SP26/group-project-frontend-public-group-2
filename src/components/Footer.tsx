"use client";

import Box from "@mui/material/Box";
import Link from "next/link";
import Typography from "@mui/material/Typography";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/brand";
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
 * and a compact copyright line.
 */
export function Footer() {
  return (
    <Box component="footer" sx={{ borderTop: "1px solid", borderColor: "divider", mt: { xs: 5, md: 7 } }}>
      <Box
        sx={{
          maxWidth: 1280,
          mx: "auto",
          width: "100%",
          minWidth: 0,
          px: { xs: 2, sm: 3, md: 6 },
          py: { xs: 3.25, sm: 4, md: 6 },
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "flex-start" },
          gap: { xs: 2.5, sm: 4 },
        }}
      >
        <Box sx={{ maxWidth: 320, width: { xs: "100%", sm: "auto" } }}>
          <Typography sx={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: { xs: "1.12rem", md: "1.25rem" }, mb: 0.75 }}>
            {SITE_NAME}
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: { xs: "0.88rem", md: "0.9rem" }, lineHeight: 1.6 }}>
            {SITE_DESCRIPTION}
          </Typography>
        </Box>

        <Box
          component="nav"
          sx={{
            width: { xs: "100%", sm: "auto" },
            display: "flex",
            flexWrap: "wrap",
            justifyContent: { xs: "stretch", sm: "flex-end" },
            gap: 1,
            alignContent: "flex-start",
            maxWidth: { xs: "100%", sm: 300 },
          }}
        >
          {footerLinks.map((link) => (
            <Box
              key={link.href}
              component={Link}
              href={link.href}
              sx={{
                textDecoration: "none",
                minWidth: { xs: "calc(50% - 4px)", sm: "auto" },
                flex: { xs: "1 1 calc(50% - 4px)", sm: "0 0 auto" },
              }}
            >
              <MetaText
                sx={{
                  display: "block",
                  textAlign: "center",
                  color: "text.secondary",
                  px: 1.4,
                  py: 1.05,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.default",
                  transition: "color 180ms ease, border-color 180ms ease, background-color 180ms ease",
                  "&:hover": {
                    color: "text.primary",
                    borderColor: "primary.main",
                    backgroundColor:
                      "color-mix(in srgb, var(--mui-palette-primary-main) 8%, transparent)",
                  },
                }}
              >
                {link.label}
              </MetaText>
            </Box>
          ))}
        </Box>
      </Box>

      <Box sx={{ borderTop: "1px solid", borderColor: "divider" }}>
        <Box sx={{ maxWidth: 1280, mx: "auto", width: "100%", px: { xs: 2, sm: 3, md: 6 }, py: { xs: 1.5, sm: 2.25 } }}>
          <MetaText sx={{ color: "text.secondary", display: "block", textAlign: { xs: "center", sm: "left" } }}>
            © 2026 {SITE_NAME}
          </MetaText>
        </Box>
      </Box>
    </Box>
  );
}
