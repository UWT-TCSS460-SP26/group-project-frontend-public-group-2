import type { Metadata } from "next";
import localFont from "next/font/local";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import Box from "@mui/material/Box";
import "./globals.css";
import { Providers } from "./providers";
import { Footer, GrainOverlay, Header } from "@/components";

const inter = localFont({
  src: "./fonts/inter-latin.woff2",
  variable: "--font-inter",
  weight: "100 900",
  style: "normal",
  display: "swap",
});

const fraunces = localFont({
  src: "./fonts/fraunces-latin.woff2",
  variable: "--font-fraunces",
  weight: "100 900",
  style: "normal",
  display: "swap",
});

// Monospace for editorial meta (years, runtime, genres, catalog numbers) — see MetaText.
const mono = localFont({
  src: [
    {
      path: "./fonts/ibm-plex-mono-latin-400.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/ibm-plex-mono-latin-500.woff2",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Group 2 · Movies & TV",
  description:
    "Browse, search, and keep a watchlist of the films and shows worth your time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${fraunces.variable} ${mono.variable}`}
    >
      <body>
        {/* Sets the color-scheme class on <html> before paint → no theme flash. */}
        <InitColorSchemeScript attribute="class" defaultMode="light" />
        <Providers>
          <a href="#main-content" className="skip-link">
            Skip to content
          </a>
          <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
            <Header />
            <GrainOverlay />
            <Box component="main" id="main-content" tabIndex={-1} sx={{ flex: 1 }}>
              {children}
            </Box>
            <Footer />
          </Box>
        </Providers>
      </body>
    </html>
  );
}
