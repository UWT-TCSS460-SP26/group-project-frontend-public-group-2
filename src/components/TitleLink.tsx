"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import { posterTransitionName } from "@/lib/view-transition";
import type { MediaType } from "@/types/media";

interface TitleLinkProps {
  children: ReactNode;
  className?: string;
  href: string;
  id: string | number;
  mediaType: MediaType;
}

function shouldPrepareTransition(event: MouseEvent<HTMLAnchorElement>) {
  return (
    event.button === 0 &&
    !event.defaultPrevented &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Marks only the poster in the activated card as the shared transition source.
 * This avoids duplicate transition names when the same title appears in more
 * than one home-page rail.
 */
export function TitleLink({
  children,
  className,
  href,
  id,
  mediaType,
}: TitleLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      onClick={(event) => {
        if (!shouldPrepareTransition(event)) return;
        const poster = event.currentTarget.querySelector<HTMLElement>(
          "[data-title-poster]",
        );
        if (poster) {
          poster.style.viewTransitionName = posterTransitionName(mediaType, id);
        }
      }}
    >
      {children}
    </Link>
  );
}
