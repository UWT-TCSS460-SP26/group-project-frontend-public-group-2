export interface ComparableScores {
  communityScore?: number;
  tmdbRating?: number;
}

export interface ComparisonScores {
  label: "Community verdict" | "TMDB verdict";
  scoreA: number;
  scoreB: number;
}

export function chooseComparisonScores(
  dataA: ComparableScores,
  dataB: ComparableScores,
): ComparisonScores | null {
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
