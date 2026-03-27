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
  score: number;
};

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
  const target = tokenize(newText);
  const scored: SimilarMatch[] = [];

  for (const leaf of leaves) {
    const score = jaccardSimilarity(target, tokenize(leaf.text));
    if (score < minScore) continue;
    const keyHint = leaf.path.includes(".")
      ? leaf.path.slice(0, leaf.path.indexOf("."))
      : leaf.path;
    scored.push({
      path: leaf.path,
      keyHint,
      text: leaf.text,
      score,
    });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const ai =
      [...target].filter((w) => tokenize(a.text).has(w)).length;
    const bi =
      [...target].filter((w) => tokenize(b.text).has(w)).length;
    if (bi !== ai) return bi - ai;
    return a.keyHint.length - b.keyHint.length;
  });

  return scored.slice(0, top);
}
