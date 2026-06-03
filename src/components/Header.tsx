"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { signIn, signOut, useSession } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";

const navLinks: { label: string; href: string; requireAuth?: boolean }[] = [
  { label: "Search", href: "/search" },
  { label: "Profile", href: "/profile", requireAuth: true },
];

const monoNav = {
  fontFamily: "var(--font-mono), ui-monospace, monospace",
  fontSize: "0.72rem",
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
};

export function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
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
          minHeight: { xs: 60, md: 72 },
          gap: { xs: 2, md: 4 },
        }}
      >
        <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
          <Typography
            component="span"
            sx={{
              fontFamily: "var(--font-fraunces), Georgia, serif",
              fontSize: { xs: "1.2rem", md: "1.4rem" },
              fontWeight: 500,
              letterSpacing: "-0.01em",
              color: "text.primary",
              whiteSpace: "nowrap",
            }}
          >
            Group 2
          </Typography>
        </Link>

        <Box
          component="nav"
          sx={{ display: "flex", gap: { xs: 2, md: 3 }, ml: { xs: 1, md: 3 }, flex: 1 }}
        >
          {navLinks
            .filter((link) => !link.requireAuth || isAuthenticated)
            .map((link) => {
              const active = pathname === link.href;
              return (
                <Link key={link.href} href={link.href} style={{ textDecoration: "none" }}>
                  <Typography
                    component="span"
                    sx={{
                      ...monoNav,
                      color: active ? "text.primary" : "text.secondary",
                      borderBottom: "1px solid",
                      borderColor: active ? "primary.main" : "transparent",
                      pb: 0.25,
                      transition: "color 180ms ease",
                      "&:hover": { color: "text.primary" },
                    }}
                  >
                    {link.label}
                  </Typography>
                </Link>
              );
            })}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, md: 1 } }}>
          <ThemeToggle />
          {isAuthenticated ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, md: 2 } }}>
              <Typography
                sx={{
                  display: { xs: "none", md: "block" },
                  fontFamily: "var(--font-mono), ui-monospace, monospace",
                  fontSize: "0.72rem",
                  color: "text.secondary",
                }}
              >
                {session?.user?.email}
              </Typography>
              <Button
                size="small"
                onClick={() => signOut({ callbackUrl: "/" })}
                sx={{
                  ...monoNav,
                  color: "text.secondary",
                  "&:hover": { color: "text.primary", backgroundColor: "transparent" },
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
              sx={{ ...monoNav }}
            >
              Sign In
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
