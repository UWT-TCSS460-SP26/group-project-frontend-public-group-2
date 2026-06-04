import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Unlocks the View Transitions API for the shared-element poster morph (RU-11).
  experimental: {
    viewTransition: true,
  },
  images: {
    // TMDB poster/backdrop CDN — required so next/image can optimize remote posters
    // (lazy loading, responsive sizes, modern formats). poster_path / backdrop_path
    // resolve under https://image.tmdb.org/t/p/<size>/<file>.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
    ],
  },
};

export default nextConfig;
