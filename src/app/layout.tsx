import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import "./globals.css";
import { Providers } from "./providers";
import { GrainOverlay, Header } from "@/components";

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

export const metadata: Metadata = {
  title: "Group 2 Consumer App",
  description:
    "TCSS 460 consumer app — signs in via Auth² and consumes Group 1's API.",
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
      className={`${inter.variable} ${fraunces.variable}`}
    >
      <body>
        {/* Sets the color-scheme class on <html> before paint → no theme flash. */}
        <InitColorSchemeScript attribute="class" defaultMode="light" />
        <Providers>
          <a href="#main-content" className="skip-link">
            Skip to content
          </a>
          <Header />
          <GrainOverlay />
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
