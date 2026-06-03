import type { CSSProperties } from "react";

/**
 * Returns a style object carrying a `view-transition-name`, for the shared-element
 * poster morph (card → detail) built in RU-11. Requires `experimental.viewTransition`
 * in next.config.ts.
 *
 * Each name must be unique among elements present during a given transition — so use
 * an id-derived value (e.g. `poster-${id}`) and only apply it where the morph runs.
 *
 * `viewTransitionName` isn't in the current CSSProperties typings, so we cast.
 */
export function viewTransitionName(name: string): CSSProperties {
  return { viewTransitionName: name } as unknown as CSSProperties;
}
