"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { SessionProvider } from "next-auth/react";
import { theme } from "@/theme";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {/* Keep auth-aware UI fresh after tab inactivity / provider sleep-wake. */}
        <SessionProvider
          refetchOnWindowFocus
          refetchInterval={60}
          refetchWhenOffline={false}
        >
          {children}
        </SessionProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
