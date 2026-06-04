import type { Metadata } from "next";
import { Inter, Fraunces, IBM_Plex_Mono } from "next/font/google";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import Box from "@mui/material/Box";
import "./globals.css";
import { Providers } from "./providers";
import { Footer, GrainOverlay, Header } from "@/components";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

// Monospace for editorial meta (years, runtime, genres, catalog numbers) — see MetaText.
const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
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
