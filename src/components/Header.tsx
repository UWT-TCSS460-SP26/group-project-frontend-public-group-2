"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import { signIn, signOut, useSession } from "next-auth/react";
import { useWatchlist } from "@/lib/watchlist";
import { ThemeToggle } from "./ThemeToggle";
import { MetaText } from "./MetaText";
import { CommandPalette } from "./CommandPalette";
import styles from "./Header.module.css";

interface NavLink {
  label: string;
  href: string;
  watchlist?: boolean;
}

// Search is intentionally absent here — the search icon (⌘K palette) is the
// single search entry point, which then hands off to the /search page.
const navLinks: NavLink[] = [
  { label: "Browse", href: "/browse" },
  { label: "Watchlist", href: "/watchlist", watchlist: true },
  { label: "Compare", href: "/compare" },
  { label: "About", href: "/about" },
];

const monoNav = {
  fontFamily: "var(--font-mono), ui-monospace, monospace",
  fontSize: "0.72rem",
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
};

const iconSx = {
  color: "text.secondary",
  "&:hover": { color: "text.primary", backgroundColor: "transparent" },
};

const menuPaperSx = {
  minWidth: 230,
  borderRadius: 0,
  border: "1px solid",
  borderColor: "divider",
  mt: 0.5,
};

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return (
    tagName === "input"
    || tagName === "textarea"
    || tagName === "select"
    || target.isContentEditable
  );
}

export function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const { count } = useWatchlist();

  const [navAnchor, setNavAnchor] = useState<null | HTMLElement>(null);
  const [accountAnchor, setAccountAnchor] = useState<null | HTMLElement>(null);
  const [commandOpen, setCommandOpen] = useState(false);

  const isAuthenticated =
    status === "authenticated" && Boolean(session?.user && session.accessToken);
  const email = session?.user?.email ?? "";
  const initial = email.trim().charAt(0).toUpperCase();

  const closeNav = () => setNavAnchor(null);
  const closeAccount = () => setAccountAnchor(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isCommandShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      const isSlashShortcut = event.key === "/" && !isEditableTarget(event.target);
      if (!isCommandShortcut && !isSlashShortcut) return;

      event.preventDefault();
      setCommandOpen(true);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const avatar = (size: number) => (
    <Avatar
      sx={{
        width: size,
        height: size,
        bgcolor: "primary.main",
        color: "primary.contrastText",
        fontFamily: "var(--font-mono), monospace",
        fontSize: size <= 30 ? "0.8rem" : "0.95rem",
        fontWeight: 500,
      }}
    >
      {initial || <PersonIcon sx={{ fontSize: size * 0.6 }} />}
    </Avatar>
  );

  return (
    <AppBar position="sticky">
      <Toolbar
        sx={{
          maxWidth: 1280,
          mx: "auto",
          width: "100%",
          px: { xs: 2.5, md: 6 },
          minHeight: { xs: 60, md: 72 },
          gap: 1,
        }}
      >
        <Link href="/" className={styles.brandLink} aria-label="Repertory home">
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
            Repertory
          </Typography>
          <MetaText
            component="span"
            sx={{
              display: { xs: "none", sm: "inline" },
              ml: 1,
              color: "text.secondary",
            }}
          >
            / Group 2
          </MetaText>
        </Link>

        {/* Desktop nav — Profile lives only in the account menu (avatar), not here. */}
        <Box component="nav" aria-label="Primary navigation" sx={{ display: { xs: "none", lg: "flex" }, gap: 2.25, ml: 3 }}>
          {navLinks.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link key={link.href} href={link.href} className={styles.navLink}>
                <Box
                  component="span"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.6,
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
                  {link.watchlist && count > 0 && (
                    <Box component="span" sx={{ color: "primary.main" }}>
                      {count}
                    </Box>
                  )}
                </Box>
              </Link>
            );
          })}
        </Box>

        <Box sx={{ flex: 1 }} />

        {/* Right cluster */}
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, md: 1 } }}>
          <IconButton
            onClick={() => setCommandOpen(true)}
            aria-label="Search movies and TV"
            title="Search (⌘K)"
            size="small"
            sx={iconSx}
          >
            <SearchIcon fontSize="small" />
          </IconButton>

          {/* Desktop theme + account */}
          <Box sx={{ display: { xs: "none", md: "inline-flex" } }}>
            <ThemeToggle />
          </Box>
          {isAuthenticated ? (
            <IconButton
              onClick={(e) => setAccountAnchor(e.currentTarget)}
              aria-label="Account menu"
              size="small"
              sx={{ display: { xs: "none", lg: "inline-flex" } }}
            >
              {avatar(30)}
            </IconButton>
          ) : (
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={() => signIn("tcss460")}
              disabled={status === "loading"}
              sx={{ display: { xs: "none", lg: "inline-flex" }, ...monoNav, borderRadius: 999, px: 2 }}
            >
              Sign In
            </Button>
          )}

          {!isAuthenticated && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={() => signIn("tcss460")}
              disabled={status === "loading"}
              sx={{
                display: { xs: "inline-flex", lg: "none" },
                ...monoNav,
                minWidth: 0,
                px: 1.5,
              }}
            >
              Sign in
            </Button>
          )}

          {/* Mobile single menu */}
          <IconButton
            aria-label="Open menu"
            onClick={(e) => setNavAnchor(e.currentTarget)}
            size="small"
            sx={{ display: { xs: "inline-flex", lg: "none" }, color: "text.primary" }}
          >
            <MenuIcon />
          </IconButton>
        </Box>
      </Toolbar>

      {/* Mobile menu — everything in one place */}
      <Menu
        anchorEl={navAnchor}
        open={Boolean(navAnchor)}
        onClose={closeNav}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: menuPaperSx } }}
      >
        {isAuthenticated && (
          <Box sx={{ px: 2, py: 1.25, display: "flex", alignItems: "center", gap: 1.5 }}>
            {avatar(34)}
            <Box sx={{ minWidth: 0 }}>
              <MetaText sx={{ display: "block", color: "text.secondary" }}>Signed in</MetaText>
              <Typography
                sx={{ fontSize: "0.8rem", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              >
                {email}
              </Typography>
            </Box>
          </Box>
        )}
        {isAuthenticated && <Divider />}

        {navLinks.map((link) => (
          <MenuItem
            key={link.href}
            component={Link}
            href={link.href}
            onClick={closeNav}
            selected={pathname === link.href}
            sx={{ ...monoNav, py: 1.25, display: "flex", justifyContent: "space-between", gap: 2 }}
          >
            {link.label}
            {link.watchlist && count > 0 && (
              <Box component="span" sx={{ color: "primary.main" }}>
                {count}
              </Box>
            )}
          </MenuItem>
        ))}
        {isAuthenticated && (
          <MenuItem component={Link} href="/profile" onClick={closeNav} sx={{ ...monoNav, py: 1.25 }}>
            Profile
          </MenuItem>
        )}

        <Divider />
        <Box sx={{ px: 2, py: 0.75, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <MetaText>Theme</MetaText>
          <ThemeToggle />
        </Box>
        <Divider />

        <MenuItem
          onClick={() => {
            closeNav();
            if (isAuthenticated) signOut({ callbackUrl: "/" });
            else signIn("tcss460");
          }}
          sx={{ ...monoNav, py: 1.25 }}
        >
          {isAuthenticated ? "Sign out" : "Sign in"}
        </MenuItem>
      </Menu>

      {/* Desktop account menu */}
      <Menu
        anchorEl={accountAnchor}
        open={Boolean(accountAnchor)}
        onClose={closeAccount}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: menuPaperSx } }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <MetaText sx={{ display: "block", color: "text.secondary" }}>Signed in as</MetaText>
          <Typography
            sx={{ fontSize: "0.85rem", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {email}
          </Typography>
        </Box>
        <Divider />
        <MenuItem component={Link} href="/profile" onClick={closeAccount} sx={{ ...monoNav, py: 1.25 }}>
          Profile
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeAccount();
            signOut({ callbackUrl: "/" });
          }}
          sx={{ ...monoNav, py: 1.25 }}
        >
          Sign out
        </MenuItem>
      </Menu>

      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
    </AppBar>
  );
}
