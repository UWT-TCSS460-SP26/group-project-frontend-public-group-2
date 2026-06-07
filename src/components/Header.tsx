"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import { signIn, signOut, useSession } from "next-auth/react";
import { useWatchlist } from "@/lib/watchlist";
import { ThemeToggle } from "./ThemeToggle";
import { MetaText } from "./MetaText";

interface NavLink {
  label: string;
  href: string;
  watchlist?: boolean;
}

const navLinks: NavLink[] = [
  { label: "Browse", href: "/browse" },
  { label: "Watchlist", href: "/watchlist", watchlist: true },
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

export function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { count } = useWatchlist();

  const [navAnchor, setNavAnchor] = useState<null | HTMLElement>(null);
  const [accountAnchor, setAccountAnchor] = useState<null | HTMLElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const isAuthenticated =
    status === "authenticated" && Boolean(session?.user && session.accessToken);
  const email = session?.user?.email ?? "";
  const initial = email.trim().charAt(0).toUpperCase();

  const closeNav = () => setNavAnchor(null);
  const closeAccount = () => setAccountAnchor(null);
  const closeSearch = () => {
    setSearchOpen(false);
    setQuery("");
  };

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    closeSearch();
  };

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

        {/* Desktop nav */}
        <Box component="nav" sx={{ display: { xs: "none", md: "flex" }, gap: 3, ml: 3 }}>
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link key={link.href} href={link.href} style={{ textDecoration: "none" }}>
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
          {/* Search: icon only; clicking expands a pill that closes on click-away. */}
          <ClickAwayListener
            onClickAway={() => {
              if (searchOpen) closeSearch();
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              {searchOpen && (
                <Box
                  component="form"
                  onSubmit={submitSearch}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    width: { xs: 160, sm: 220, md: 280 },
                    px: 1.5,
                    py: 0.4,
                    borderRadius: 999,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                    transition: "border-color 160ms ease",
                    "&:focus-within": { borderColor: "primary.main" },
                  }}
                >
                  <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
                  <InputBase
                    autoFocus
                    fullWidth
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") closeSearch();
                    }}
                    placeholder="Search movies & TV…"
                    inputProps={{ "aria-label": "Search movies and TV" }}
                    sx={{ fontSize: "0.9rem", color: "text.primary" }}
                  />
                </Box>
              )}
              <IconButton
                onClick={() => setSearchOpen((o) => !o)}
                aria-label={searchOpen ? "Close search" : "Search"}
                size="small"
                sx={iconSx}
              >
                {searchOpen ? <CloseIcon fontSize="small" /> : <SearchIcon fontSize="small" />}
              </IconButton>
            </Box>
          </ClickAwayListener>

          {/* Desktop theme + account */}
          <Box sx={{ display: { xs: "none", md: "inline-flex" } }}>
            <ThemeToggle />
          </Box>
          {isAuthenticated ? (
            <IconButton
              onClick={(e) => setAccountAnchor(e.currentTarget)}
              aria-label="Account menu"
              size="small"
              sx={{ display: { xs: "none", md: "inline-flex" } }}
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
              sx={{ display: { xs: "none", md: "inline-flex" }, ...monoNav, borderRadius: 999, px: 2 }}
            >
              Sign In
            </Button>
          )}

          {/* Mobile single menu */}
          <IconButton
            aria-label="Open menu"
            onClick={(e) => setNavAnchor(e.currentTarget)}
            size="small"
            sx={{ display: { xs: "inline-flex", md: "none" }, color: "text.primary" }}
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
    </AppBar>
  );
}
