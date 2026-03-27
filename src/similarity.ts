/** Lowercase word tokens for English-like text. */
export function tokenize(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((w) => w.length > 0);
  return new Set(words);
}

export function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const w of a) {
    if (b.has(w)) inter += 1;
  }
  const union = a.size + b.size - inter;
  if (union === 0) return 0;
  return inter / union;
}

/** 0–100 with one decimal place. */
export function scoreToPercent(score: number): number {
  return Math.round(score * 1000) / 10;
}

export type LeafEntry = { path: string; text: string };

/** Collect leaf string values with JSON-path-like keys for reporting. */
export function collectLeafStrings(
  obj: unknown,
  prefix = "",
): LeafEntry[] {
  if (typeof obj === "string") {
    return [{ path: prefix || "(root)", text: obj }];
  }
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    return [];
  }
  const out: LeafEntry[] = [];
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const p = prefix ? `${prefix}.${k}` : k;
    out.push(...collectLeafStrings(v, p));
  }
  return out;
}

export type SimilarMatch = {
  path: string;
  keyHint: string;
  text: string;
  /** Jaccard similarity on word sets, 0–1. */
  score: number;
  /** Same as `score * 100`, one decimal (e.g. 66.7). */
  percent: number;
};

function keyHintFromPath(path: string): string {
  return path.includes(".") ? path.slice(0, path.indexOf(".")) : path;
}

function sortSimilarMatches(
  a: SimilarMatch,
  b: SimilarMatch,
  targetWords: Set<string>,
): number {
  if (b.score !== a.score) return b.score - a.score;
  const ai = [...targetWords].filter((w) => tokenize(a.text).has(w)).length;
  const bi = [...targetWords].filter((w) => tokenize(b.text).has(w)).length;
  if (bi !== ai) return bi - ai;
  return a.keyHint.length - b.keyHint.length;
}

/**
 * Score every leaf string against `query` (Jaccard on word sets).
 * Empty/whitespace `query` returns `[]`.
 */
export function scoreMatchesForLeaves(
  query: string,
  leaves: LeafEntry[],
  options?: { minScore?: number },
): SimilarMatch[] {
  const q = query.trim();
  if (!q) return [];

  const target = tokenize(q);
  const minScore = options?.minScore ?? 0;
  const scored: SimilarMatch[] = [];

  for (const leaf of leaves) {
    const score = jaccardSimilarity(target, tokenize(leaf.text));
    if (score < minScore) continue;
    scored.push({
      path: leaf.path,
      keyHint: keyHintFromPath(leaf.path),
      text: leaf.text,
      score,
      percent: scoreToPercent(score),
    });
  }

  scored.sort((a, b) => sortSimilarMatches(a, b, target));
  return scored;
}

/**
 * Search a locale JSON object: returns all string values with a similarity score and percent.
 * Uses the same word-set Jaccard metric as `add:translation`.
 */
export function searchTranslationMatches(
  query: string,
  localeObject: unknown,
  options?: { minScore?: number },
): SimilarMatch[] {
  const leaves = collectLeafStrings(localeObject);
  return scoreMatchesForLeaves(query, leaves, options);
}

/**
 * Find top similar existing strings by Jaccard similarity on word sets.
 */
export function findSimilarStrings(
  newText: string,
  leaves: LeafEntry[],
  options?: { top?: number; minScore?: number },
): SimilarMatch[] {
  const top = options?.top ?? 5;
  const minScore = options?.minScore ?? 0.15;
  const matches = scoreMatchesForLeaves(newText, leaves, { minScore });
  return matches.slice(0, top);
}
