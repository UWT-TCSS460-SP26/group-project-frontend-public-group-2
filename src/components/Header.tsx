import Link from "next/link";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { auth, signIn, signOut } from "@/auth";

const navLinks = [
  { label: "Search", href: "/search" },
];

const linkResetStyle: React.CSSProperties = {
  textDecoration: "none",
  color: "inherit",
  display: "inline-flex",
  alignItems: "center",
};

export async function Header() {
  const session = await auth();

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
          {navLinks.map((link) => (
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

        {session?.user ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, md: 2 } }}>
            <Typography
              sx={{
                display: { xs: "none", sm: "block" },
                fontSize: "0.85rem",
                color: "text.secondary",
              }}
            >
              {session.user.email}
            </Typography>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button
                type="submit"
                size="small"
                sx={{
                  color: "text.secondary",
                  "&:hover": { color: "text.primary", backgroundColor: "transparent" },
                }}
              >
                Sign out
              </Button>
            </form>
          </Box>
        ) : (
          <form
            action={async () => {
              "use server";
              await signIn("tcss460");
            }}
          >
            <Button type="submit" variant="contained" color="primary" size="small">
              Sign In
            </Button>
          </form>
        )}
      </Toolbar>
    </AppBar>
  );
}
