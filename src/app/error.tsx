"use client";

import { useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
// Import directly (not from the barrel) so the Header's inline server actions
// don't get traced into this error.tsx's client bundle.
import { ErrorState } from "@/components/ErrorState";
import { PageContainer } from "@/components/PageContainer";

/**
 * Global error boundary. Catches anything that throws during render anywhere
 * under the root layout (and isn't caught by a closer segment-level error.tsx),
 * so users see an actionable message instead of Next.js's generic
 * "This page couldn't load."
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error boundary:", error);
  }, [error]);

  return (
    <PageContainer>
      <ErrorState
        message="Something went wrong."
        detail={
          error.message ||
          "An unexpected error occurred. Try again, or sign out and back in."
        }
      />
      <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
        <Button variant="contained" onClick={reset}>
          Try again
        </Button>
      </Box>
    </PageContainer>
  );
}
