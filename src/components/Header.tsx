"use client";

import Link from "next/link";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import type { CSSProperties } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";

const navLinks: { label: string; href: string; requireAuth?: boolean }[] = [
  { label: "Search", href: "/search" },
  { label: "Profile", href: "/profile", requireAuth: true },
];

const linkResetStyle: CSSProperties = {
  textDecoration: "none",
  color: "inherit",
  display: "inline-flex",
  alignItems: "center",
};

export function Header() {
  const { data: session, status } = useSession();
  const isAuthenticated =
    status === "authenticated" && Boolean(session?.user && session.accessToken);

  return (
    <AppBar position="sticky">
      <Toolbar
        sx={{
          maxWidth: 1280,
          mx: "auto",
          width: "100%",
          px: { xs: 3, md: 6 },
          minHeight: { xs: 60, md: 68 },
          gap: { xs: 2, md: 4 },
        }}
      >
        <Link href="/" style={linkResetStyle}>
          <Typography
            sx={{
              fontFamily: "var(--font-fraunces), Georgia, serif",
              fontSize: "1.15rem",
              fontWeight: 500,
              letterSpacing: "-0.01em",
              color: "text.primary",
            }}
          >
            Group 2
          </Typography>
        </Link>

        <Box
          sx={{
            display: "flex",
            gap: { xs: 2, md: 3 },
            ml: { xs: 1, md: 2 },
            flex: 1,
          }}
        >
          {navLinks
            .filter((link) => !link.requireAuth || isAuthenticated)
            .map((link) => (
              <Link key={link.href} href={link.href} style={linkResetStyle}>
                <Typography
                  sx={{
                    fontSize: "0.9rem",
                    color: "text.secondary",
                    transition: "color 180ms ease",
                    "&:hover": { color: "text.primary" },
                  }}
                >
                  {link.label}
                </Typography>
              </Link>
            ))}
        </Box>

        {/* Right cluster: theme toggle + auth. RU-6 will formalize this header. */}
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, md: 1 } }}>
          <ThemeToggle />
          {isAuthenticated ? (
            <Box
              sx={{ display: "flex", alignItems: "center", gap: { xs: 1, md: 2 } }}
            >
              <Typography
                sx={{
                  display: { xs: "none", sm: "block" },
                  fontSize: "0.85rem",
                  color: "text.secondary",
                }}
              >
                {session?.user?.email}
              </Typography>
              <Button
                size="small"
                onClick={() => signOut({ callbackUrl: "/" })}
                sx={{
                  color: "text.secondary",
                  "&:hover": {
                    color: "text.primary",
                    backgroundColor: "transparent",
                  },
                }}
              >
                Sign out
              </Button>
            </Box>
          ) : (
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={() => signIn("tcss460")}
              disabled={status === "loading"}
            >
              Sign In
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
