export type RankedItem = { id: string; rank: number };

export type FusedRank = {
  id: string;
  score: number;
  contributingLists: number[];
};

export function reciprocalRankFuse(
  resultSets: readonly (readonly RankedItem[])[],
  k = 60,
): FusedRank[] {
  if (!Number.isFinite(k) || k <= 0) throw new Error("RRF k must be positive.");
  const fused = new Map<string, FusedRank>();
  resultSets.forEach((results, listIndex) => {
    for (const item of results) {
      if (!Number.isInteger(item.rank) || item.rank < 1) continue;
      const current = fused.get(item.id) ?? {
        id: item.id,
        score: 0,
        contributingLists: [],
      };
      current.score += 1 / (k + item.rank);
      current.contributingLists.push(listIndex);
      fused.set(item.id, current);
    }
  });
  return [...fused.values()].sort(
    (left, right) =>
      right.score - left.score || left.id.localeCompare(right.id),
  );
}
