"use client";

import { useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { signIn } from "next-auth/react";
// Direct imports (not the barrel) keep the Header's inline server actions
// out of this error.tsx's client bundle.
import { ErrorState } from "@/components/ErrorState";
import { PageContainer } from "@/components/PageContainer";

/**
 * Profile-specific error boundary. The most common failure here is an expired
 * sign-in session (an idle access token left over from a previous visit), so
 * we surface a sign-in CTA directly alongside the generic Retry.
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

  return (
    <PageContainer>
      <ErrorState
        message="We couldn't load your profile."
        detail="Your sign-in session may have expired. Sign in again to continue."
      />
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
