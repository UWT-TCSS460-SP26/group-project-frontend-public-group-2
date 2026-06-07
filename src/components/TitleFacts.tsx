"use client";

import { Fragment } from "react";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import { MetaText } from "./MetaText";
import { SectionHeading } from "./SectionHeading";

/**
 * "Facts" panel for the title detail page (JO-2). Reads straight from the rich
 * TMDB block of the enriched payload (`/details/{movie|tv}/{id}/enriched`).
 *
 * It degrades gracefully: every field is independently optional, zero-value
 * money (TMDB's "unknown") is skipped, and the whole panel renders nothing when
 * there's nothing worth showing. The enriched payload carries NO cast/credits,
 * so none are invented here.
 *
 * Self-contained parsing (mirrors the guards in title/[id]/page.tsx) so callers
 * can hand it the raw `tmdb` record without pre-shaping it.
 */
interface TitleFactsProps {
  /** The `tmdb` block from the enriched payload. */
  tmdb: Record<string, unknown>;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function asMoney(value: unknown): number | undefined {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim().length > 0
        ? Number(value)
        : NaN;
  // TMDB returns 0 when the figure is unknown — treat that as "no data".
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function asCompanyNames(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && "name" in item) {
        return asString((item as { name?: unknown }).name);
      }
      return undefined;
    })
    .filter((name): name is string => Boolean(name));
}

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function languageLabel(code: string): string {
  try {
    const display = new Intl.DisplayNames(["en"], { type: "language" }).of(
      code,
    );
    if (display && display.toLowerCase() !== code.toLowerCase()) return display;
  } catch {
    // Intl.DisplayNames unsupported or unknown code — fall back to the raw code.
  }
  return code.toUpperCase();
}

export function TitleFacts({ tmdb }: TitleFactsProps) {
  const status = asString(tmdb.status);
  const originalLanguage = asString(tmdb.original_language);
  const budget = asMoney(tmdb.budget);
  const revenue = asMoney(tmdb.revenue);
  const companies = asCompanyNames(tmdb.production_companies);

  const homepage = asString(tmdb.homepage);
  const imdbId = asString(tmdb.imdb_id);
  const imdbUrl = imdbId
    ? `https://www.imdb.com/title/${imdbId}/`
    : undefined;

  const rows: { label: string; value: string }[] = [];
  if (status) rows.push({ label: "Status", value: status });
  if (originalLanguage)
    rows.push({ label: "Original language", value: languageLabel(originalLanguage) });
  if (budget !== undefined) rows.push({ label: "Budget", value: USD.format(budget) });
  if (revenue !== undefined)
    rows.push({ label: "Revenue", value: USD.format(revenue) });
  if (companies.length > 0)
    rows.push({ label: "Production", value: companies.join(", ") });

  const links: { label: string; href: string }[] = [];
  if (homepage) links.push({ label: "Homepage", href: homepage });
  if (imdbUrl) links.push({ label: "IMDb", href: imdbUrl });

  // Nothing to show — render nothing rather than an empty heading.
  if (rows.length === 0 && links.length === 0) return null;

  return (
    <Box component="section">
      <SectionHeading>Details</SectionHeading>

      {rows.length > 0 && (
        <Box
          component="dl"
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "minmax(120px, auto) 1fr" },
            columnGap: { xs: 1, sm: 4 },
            rowGap: { xs: 1.5, sm: 1.75 },
            m: 0,
            maxWidth: 720,
          }}
        >
          {rows.map(({ label, value }) => (
            <Fragment key={label}>
              <MetaText
                component="dt"
                sx={{
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "text.secondary",
                  alignSelf: "start",
                }}
              >
                {label}
              </MetaText>
              <Typography
                component="dd"
                sx={{ m: 0, color: "text.primary", lineHeight: 1.5 }}
              >
                {value}
              </Typography>
            </Fragment>
          ))}
        </Box>
      )}

      {links.length > 0 && (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: { xs: 2, sm: 3 },
            mt: rows.length > 0 ? 3 : 0,
          }}
        >
          {links.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              sx={[
                {
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.5,
                  // Deeper emerald clears AA for small link text on the light
                  // bone surface; dark mode swaps to the brighter mint below.
                  color: "primary.dark",
                  fontWeight: 500,
                  textDecorationColor: "currentColor",
                },
                (theme) =>
                  theme.applyStyles("dark", {
                    color: theme.palette.primary.main,
                  }),
              ]}
            >
              {label}
              <OpenInNewRoundedIcon sx={{ fontSize: 16 }} />
            </Link>
          ))}
        </Box>
      )}
    </Box>
  );
}
