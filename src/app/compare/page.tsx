import type { Metadata } from "next";
import Image from "next/image";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {
  ButtonLink,
  GenreChip,
  MetaText,
  PageContainer,
  PageTitle,
  StatBadge,
} from "@/components";
import { fetchGroupOneApi } from "@/lib/api";
import { chooseComparisonScores } from "@/lib/compare-scores";
import { titleHref } from "@/lib/title-route";
import { TMDB_IMG_BASE } from "@/types/media";
import type { MediaType } from "@/types/media";
import { TitlePicker } from "./TitlePicker";

export const metadata: Metadata = { title: "Compare" };
export const dynamic = "force-dynamic";

// ── Data types ────────────────────────────────────────────────────────────────

interface CompareData {
  id: string;
  mediaType: MediaType;
  title: string;
  year?: string;
  overview?: string;
  posterUrl?: string;
  runtime?: string;
  genres: string[];
  tmdbRating?: number;   // vote_average from TMDB (0–10)
  communityScore?: number; // our ratings average (0–10)
  ratingCount?: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

type UnknownRecord = Record<string, unknown>;

function asStr(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}
function asNum(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}
function asRec(v: unknown): UnknownRecord | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as UnknownRecord) : null;
}

/** Parses "movie:550" or "tv:1399" into a typed slot. Returns null if invalid. */
function parseSlot(raw?: string): { mediaType: MediaType; id: string } | null {
  if (!raw) return null;
  const [type, ...rest] = raw.split(":");
  const id = rest.join(":");
  if (!id || (type !== "movie" && type !== "tv")) return null;
  return { mediaType: type, id };
}

async function fetchCompareData(
  mediaType: MediaType,
  id: string,
): Promise<CompareData | null> {
  try {
    const payload = await fetchGroupOneApi<UnknownRecord>(
      `/details/${mediaType}/${id}/enriched`,
    );
    const record = asRec(payload);
    if (!record) return null;

    const tmdb = asRec(record.tmdb) ?? record;
    const ratings = asRec(record.ratings);

    // Group 1 can return a TMDB error envelope with HTTP 200.
    if (
      tmdb.success === false ||
      typeof tmdb.status_message === "string" ||
      typeof tmdb.status_code === "number"
    ) {
      return null;
    }

    const title =
      asStr(tmdb.title) ??
      asStr(tmdb.name) ??
      asStr(tmdb.original_title) ??
      "Untitled";

    const releaseDate = asStr(tmdb.release_date) ?? asStr(tmdb.first_air_date);
    const year = releaseDate?.slice(0, 4);

    const rawPoster = asStr(tmdb.poster_path);
    const posterUrl = rawPoster
      ? rawPoster.startsWith("http")
        ? rawPoster
        : `${TMDB_IMG_BASE}${rawPoster}`
      : undefined;

    const runtimeMin =
      asNum(tmdb.runtime) ??
      (Array.isArray(tmdb.episode_run_time)
        ? asNum((tmdb.episode_run_time as unknown[])[0])
        : undefined);
    const runtime = runtimeMin ? `${runtimeMin} min` : undefined;

    const genreRaw = tmdb.genres;
    const genres = Array.isArray(genreRaw)
      ? genreRaw
          .map((g) =>
            typeof g === "string" ? g : asStr((asRec(g) ?? {}).name as unknown),
          )
          .filter((g): g is string => !!g)
      : [];

    const tmdbRating = asNum(tmdb.vote_average) ?? asNum(tmdb.rating);
    const ratingCount = asNum(ratings?.count);
    const communityScore =
      ratingCount !== undefined && ratingCount > 0
        ? asNum(ratings?.average)
        : undefined;

    return {
      id,
      mediaType,
      title,
      year,
      overview: asStr(tmdb.overview),
      posterUrl,
      runtime,
      genres,
      tmdbRating,
      communityScore,
      ratingCount,
    };
  } catch {
    return null;
  }
}

// ── Shared bits ────────────────────────────────────────────────────────────────

const monoButtonSx = {
  fontFamily: "var(--font-mono), ui-monospace, monospace",
  fontSize: "0.7rem",
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
};

/** Small mono A/B marker so each side is clearly labeled. */
function SlotBadge({ slot }: { slot: "a" | "b" }) {
  return (
    <Box
      aria-hidden
      sx={{
        width: 26,
        height: 26,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.default",
        fontFamily: "var(--font-mono), ui-monospace, monospace",
        fontSize: "0.78rem",
        color: "text.secondary",
      }}
    >
      {slot.toUpperCase()}
    </Box>
  );
}

/** "VS" centerpiece — a vertical line + badge on desktop, horizontal on mobile. */
function VsDivider() {
  const lineSx = {
    bgcolor: "divider",
    flex: 1,
    width: { xs: "auto", md: "1px" },
    height: { xs: "1px", md: "auto" },
  };
  return (
    <Box
      aria-hidden
      sx={{
        display: "flex",
        flexDirection: { xs: "row", md: "column" },
        alignItems: "center",
        justifyContent: "center",
        gap: 1.5,
        minHeight: { md: "100%" },
      }}
    >
      <Box sx={lineSx} />
      <Box
        sx={{
          flexShrink: 0,
          width: 44,
          height: 44,
          borderRadius: "50%",
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-mono), ui-monospace, monospace",
          fontSize: "0.8rem",
          letterSpacing: "0.05em",
          color: "primary.main",
        }}
      >
        VS
      </Box>
      <Box sx={lineSx} />
    </Box>
  );
}

// ── TitlePanel ─────────────────────────────────────────────────────────────────

function TitlePanel({
  data,
  slot,
  otherSlot,
}: {
  data: CompareData;
  slot: "a" | "b";
  otherSlot?: string;
}) {
  const params = new URLSearchParams();
  if (otherSlot) params.set(slot === "a" ? "b" : "a", otherSlot);
  const changeHref = `/compare?${params.toString()}`;

  const metaParts = [
    data.year,
    data.mediaType === "tv" ? "TV" : "Movie",
    data.runtime,
  ].filter(Boolean);

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        p: { xs: 2.5, md: 3 },
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      {/* Header: slot marker + change link */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <SlotBadge slot={slot} />
        <ButtonLink
          href={changeHref}
          variant="text"
          size="small"
          sx={{
            ...monoButtonSx,
            color: "text.secondary",
            "&:hover": { color: "text.primary", bgcolor: "transparent" },
          }}
        >
          Change
        </ButtonLink>
      </Box>

      {/* Poster + title/meta/scores side-by-side (compact, comparison-friendly) */}
      <Box sx={{ display: "flex", gap: { xs: 2, md: 2.5 } }}>
        <Box
          sx={{
            position: "relative",
            flexShrink: 0,
            width: { xs: 100, sm: 120, md: 140 },
            aspectRatio: "2 / 3",
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.default",
            overflow: "hidden",
          }}
        >
          {data.posterUrl ? (
            <Image
              src={data.posterUrl}
              alt={data.title}
              fill
              sizes="140px"
              className="image-cover"
            />
          ) : (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "text.secondary",
                fontStyle: "italic",
                fontFamily: "var(--font-fraunces), serif",
                fontSize: "0.8rem",
              }}
            >
              no poster
            </Box>
          )}
        </Box>

        <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 1.25 }}>
          <Box>
            <Typography
              variant="h2"
              sx={{ fontSize: { xs: "1.2rem", md: "1.45rem" }, lineHeight: 1.15 }}
            >
              {data.title}
            </Typography>
            {metaParts.length > 0 && (
              <MetaText sx={{ display: "block", mt: 0.75, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {metaParts.join(" · ")}
              </MetaText>
            )}
          </Box>

          {/* Scores */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
            {data.tmdbRating !== undefined && (
              <StatBadge icon="★">{data.tmdbRating.toFixed(1)} TMDB</StatBadge>
            )}
            {data.communityScore !== undefined && (
              <StatBadge icon="★" sx={{ color: "primary.main", borderColor: "primary.main" }}>
                {data.communityScore.toFixed(1)} community
                {data.ratingCount ? ` · ${data.ratingCount}` : ""}
              </StatBadge>
            )}
            {data.tmdbRating === undefined && data.communityScore === undefined && (
              <MetaText sx={{ color: "text.secondary" }}>No ratings yet</MetaText>
            )}
          </Box>
        </Box>
      </Box>

      {/* Genres */}
      {data.genres.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
          {data.genres.slice(0, 6).map((g) => (
            <GenreChip key={g} label={g} />
          ))}
        </Box>
      )}

      {/* Overview */}
      {data.overview && (
        <Typography
          sx={{
            color: "text.secondary",
            fontSize: "0.87rem",
            lineHeight: 1.7,
            display: "-webkit-box",
            WebkitLineClamp: 4,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {data.overview}
        </Typography>
      )}

      {/* Action — pinned to the bottom so both cards align */}
      <Box sx={{ mt: "auto", pt: 1 }}>
        <ButtonLink
          href={titleHref(data.mediaType, data.id)}
          variant="contained"
          color="primary"
          size="small"
          sx={monoButtonSx}
        >
          View title →
        </ButtonLink>
      </Box>
    </Box>
  );
}

// ── Picker placeholder ─────────────────────────────────────────────────────────

function PickerBox({ slot, otherSlot }: { slot: "a" | "b"; otherSlot?: string }) {
  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        border: "1px dashed",
        borderColor: "divider",
        bgcolor: "background.paper",
        p: { xs: 2.5, md: 3 },
        minHeight: { xs: 200, md: 280 },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <SlotBadge slot={slot} />
        <MetaText sx={{ textTransform: "uppercase", letterSpacing: "0.1em", color: "text.secondary" }}>
          {slot === "a" ? "First title" : "Second title"}
        </MetaText>
      </Box>
      <TitlePicker slot={slot} otherSlot={otherSlot} />
    </Box>
  );
}

// ── Winner banner ──────────────────────────────────────────────────────────────

function WinnerBanner({ dataA, dataB }: { dataA: CompareData; dataB: CompareData }) {
  const scores = chooseComparisonScores(dataA, dataB);
  if (!scores) return null;

  const { label, scoreA, scoreB } = scores;
  const diff = Math.abs(scoreA - scoreB);

  return (
    <Box
      sx={{
        mt: { xs: 4, md: 6 },
        p: { xs: 3, md: 4 },
        border: "1px solid",
        borderColor: "divider",
        borderTop: "2px solid",
        borderTopColor: "primary.main",
        bgcolor: "background.paper",
        textAlign: "center",
      }}
    >
      <MetaText
        sx={{
          display: "block",
          color: "text.secondary",
          textTransform: "uppercase",
          letterSpacing: "0.18em",
          mb: 1.5,
        }}
      >
        {label}
      </MetaText>

      {diff < 0.1 ? (
        <Typography
          variant="h2"
          sx={{ fontSize: { xs: "1.6rem", md: "2rem" }, fontStyle: "italic" }}
        >
          It&apos;s a draw.
        </Typography>
      ) : (
        <>
          <Typography variant="h2" sx={{ fontSize: { xs: "1.6rem", md: "2rem" } }}>
            {scoreA > scoreB ? dataA.title : dataB.title}
          </Typography>
          <MetaText
            sx={{
              display: "block",
              color: "primary.main",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              mt: 0.75,
              fontSize: "0.8rem",
            }}
          >
            wins · {Math.max(scoreA, scoreB).toFixed(1)} vs {Math.min(scoreA, scoreB).toFixed(1)}
          </MetaText>
        </>
      )}
    </Box>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { a, b } = await searchParams;

  const slotA = parseSlot(a);
  const slotB = parseSlot(b);

  // Fetch both in parallel — one failing doesn't block the other.
  const [resultA, resultB] = await Promise.allSettled([
    slotA ? fetchCompareData(slotA.mediaType, slotA.id) : Promise.resolve(null),
    slotB ? fetchCompareData(slotB.mediaType, slotB.id) : Promise.resolve(null),
  ]);

  const dataA = resultA.status === "fulfilled" ? resultA.value : null;
  const dataB = resultB.status === "fulfilled" ? resultB.value : null;

  const subtitle =
    dataA && dataB
      ? `${dataA.title} vs. ${dataB.title}`
      : "Pick two titles to compare side-by-side";

  return (
    <PageContainer>
      <PageTitle title="Compare" subtitle={subtitle} />

      {/* Head-to-head grid — A | VS | B on desktop, stacked with VS between on mobile */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr auto 1fr" },
          gap: { xs: 2.5, md: 3 },
          alignItems: "stretch",
        }}
      >
        {/* Slot A */}
        {slotA && dataA ? (
          <TitlePanel data={dataA} slot="a" otherSlot={b} />
        ) : (
          <PickerBox slot="a" otherSlot={b} />
        )}

        <VsDivider />

        {/* Slot B */}
        {slotB && dataB ? (
          <TitlePanel data={dataB} slot="b" otherSlot={a} />
        ) : (
          <PickerBox slot="b" otherSlot={a} />
        )}
      </Box>

      {/* Verdict banner — only when both have data */}
      {dataA && dataB && <WinnerBanner dataA={dataA} dataB={dataB} />}
    </PageContainer>
  );
}
