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
import { titleHref } from "@/lib/title-route";
import { TMDB_IMG_BASE } from "@/types/media";
import type { MediaType } from "@/types/media";
import { TitlePicker } from "./TitlePicker";

export const metadata: Metadata = { title: "Compare — Group 2" };
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
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* Poster */}
      <Box
        sx={{
          position: "relative",
          aspectRatio: "2 / 3",
          width: "100%",
          maxWidth: { xs: 220, md: "none" },
          mx: { xs: "auto", md: 0 },
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          overflow: "hidden",
        }}
      >
        {data.posterUrl ? (
          <Image
            src={data.posterUrl}
            alt={data.title}
            fill
            sizes="(max-width: 900px) 220px, 40vw"
            style={{ objectFit: "cover" }}
          />
        ) : (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <Typography
              sx={{
                color: "text.secondary",
                fontStyle: "italic",
                fontFamily: "var(--font-fraunces), serif",
                fontSize: "0.85rem",
              }}
            >
              no poster
            </Typography>
          </Box>
        )}
      </Box>

      {/* Title + meta */}
      <Box>
        <Typography
          variant="h2"
          sx={{ fontSize: { xs: "1.35rem", md: "1.65rem" }, mb: 0.75 }}
        >
          {data.title}
        </Typography>
        {metaParts.length > 0 && (
          <MetaText sx={{ textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {metaParts.join(" · ")}
          </MetaText>
        )}
      </Box>

      {/* Genres */}
      {data.genres.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
          {data.genres.slice(0, 6).map((g) => (
            <GenreChip key={g} label={g} />
          ))}
        </Box>
      )}

      {/* Scores */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {data.tmdbRating !== undefined && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <MetaText sx={{ color: "text.secondary", textTransform: "uppercase", fontSize: "0.68rem", letterSpacing: "0.12em", minWidth: 110 }}>
              TMDB
            </MetaText>
            <StatBadge icon="★">
              {data.tmdbRating.toFixed(1)} / 10
            </StatBadge>
          </Box>
        )}
        {data.communityScore !== undefined && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <MetaText sx={{ color: "text.secondary", textTransform: "uppercase", fontSize: "0.68rem", letterSpacing: "0.12em", minWidth: 110 }}>
              Community
            </MetaText>
            <StatBadge
              icon="★"
              sx={{ color: "primary.main", borderColor: "primary.main" }}
            >
              {data.communityScore.toFixed(1)} / 10
              {data.ratingCount ? ` (${data.ratingCount})` : ""}
            </StatBadge>
          </Box>
        )}
        {data.tmdbRating === undefined && data.communityScore === undefined && (
          <MetaText sx={{ color: "text.secondary" }}>No ratings yet</MetaText>
        )}
      </Box>

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

      {/* Actions */}
      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
        <ButtonLink
          href={titleHref(data.mediaType, data.id)}
          variant="contained"
          color="primary"
          size="small"
          sx={{
            fontFamily: "var(--font-mono), ui-monospace, monospace",
            fontSize: "0.7rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          View title →
        </ButtonLink>
        <ButtonLink
          href={changeHref}
          variant="outlined"
          size="small"
          sx={{
            fontFamily: "var(--font-mono), ui-monospace, monospace",
            fontSize: "0.7rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "text.secondary",
            borderColor: "divider",
          }}
        >
          Change
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
        border: "1px dashed",
        borderColor: "divider",
        borderRadius: 1,
        p: { xs: 2.5, md: 3 },
        minHeight: { xs: 180, md: 260 },
      }}
    >
      <TitlePicker slot={slot} otherSlot={otherSlot} />
    </Box>
  );
}

// ── Winner banner ──────────────────────────────────────────────────────────────

function comparisonScores(dataA: CompareData, dataB: CompareData) {
  if (
    dataA.communityScore !== undefined &&
    dataB.communityScore !== undefined
  ) {
    return {
      label: "Community verdict",
      scoreA: dataA.communityScore,
      scoreB: dataB.communityScore,
    };
  }

  if (dataA.tmdbRating !== undefined && dataB.tmdbRating !== undefined) {
    return {
      label: "TMDB verdict",
      scoreA: dataA.tmdbRating,
      scoreB: dataB.tmdbRating,
    };
  }

  return null;
}

function WinnerBanner({ dataA, dataB }: { dataA: CompareData; dataB: CompareData }) {
  const scores = comparisonScores(dataA, dataB);
  if (!scores) return null;

  const { label, scoreA, scoreB } = scores;
  const diff = Math.abs(scoreA - scoreB);

  return (
    <Box
      sx={{
        mt: { xs: 5, md: 7 },
        pt: 3,
        borderTop: "1px solid",
        borderColor: "divider",
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

      {/* Side-by-side grid — 1 column on mobile, 2 on desktop */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: { xs: 5, md: 7 },
          alignItems: "start",
        }}
      >
        {/* Slot A */}
        {slotA && dataA ? (
          <TitlePanel data={dataA} slot="a" otherSlot={b} />
        ) : (
          <PickerBox slot="a" otherSlot={b} />
        )}

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
