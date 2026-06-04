"use client";

import { useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { signIn } from "next-auth/react";
// Direct imports (not the barrel) keep the Header's inline server actions
// out of this error.tsx's client bundle.
import { ErrorState } from "@/components/ErrorState";
import { PageContainer } from "@/components/PageContainer";

/**
 * Profile-specific error boundary. The most common failure here is an expired
 * sign-in session, so we surface a sign-in CTA alongside the generic Retry.
 * In production, Next.js redacts `error.message` but provides `error.digest`
 * which maps to the actual server log entry — we render it so it can be
 * reported back for debugging.
 */
export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Profile error boundary:", error);
  }, [error]);

  const detail =
    error.message && error.message !== "An error occurred in the Server Components render."
      ? error.message
      : "Your sign-in session may have expired. Try signing in again, or use Retry.";

  return (
    <PageContainer>
      <ErrorState message="We couldn't load your profile." detail={detail} />
      {error.digest && (
        <Typography
          sx={{
            textAlign: "center",
            color: "text.secondary",
            fontSize: "0.72rem",
            fontFamily: "monospace",
            mt: 1.5,
          }}
        >
          Error ID: {error.digest}
        </Typography>
      )}
      <Box sx={{ display: "flex", justifyContent: "center", gap: 1.5, mt: 2 }}>
        <Button variant="outlined" onClick={reset}>
          Retry
        </Button>
        <Button variant="contained" onClick={() => signIn("tcss460")}>
          Sign in
        </Button>
      </Box>
    </PageContainer>
  );
}
