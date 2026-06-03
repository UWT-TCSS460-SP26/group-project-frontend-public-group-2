"use client";

import Button from "@mui/material/Button";
import type { ButtonProps } from "@mui/material/Button";
import Link from "next/link";

interface ButtonLinkProps extends ButtonProps {
  href: string;
}

/**
 * A MUI Button that navigates via the Next.js client router. It lives in a client
 * component so `component={Link}` (a function) is never passed from a Server
 * Component across the server → client boundary — doing that throws
 * "Functions cannot be passed directly to Client Components".
 */
export function ButtonLink({ href, ...props }: ButtonLinkProps) {
  return <Button component={Link} href={href} {...props} />;
}
