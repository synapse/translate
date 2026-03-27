import { describe, expect, it } from "vitest";
import {
  tokenize,
  jaccardSimilarity,
  collectLeafStrings,
  findSimilarStrings,
  searchTranslationMatches,
} from "../src/similarity.js";

describe("tokenize + jaccard", () => {
  it("treats Hello world and World hello as identical token sets", () => {
    const a = tokenize("Hello world");
    const b = tokenize("World hello");
    expect(jaccardSimilarity(a, b)).toBe(1);
  });

  it("scores partial overlap", () => {
    const a = tokenize("hello world");
    const b = tokenize("hello there");
    expect(jaccardSimilarity(a, b)).toBeGreaterThan(0);
    expect(jaccardSimilarity(a, b)).toBeLessThan(1);
  });
});

describe("collectLeafStrings", () => {
  it("collects nested plural leaves with paths", () => {
    const obj = {
      a: "one",
      b: { zero: "z", one: "o", other: "x" },
    };
    const leaves = collectLeafStrings(obj);
    expect(leaves.map((l) => l.path)).toEqual(
      expect.arrayContaining(["a", "b.zero", "b.one", "b.other"]),
    );
  });
});

describe("findSimilarStrings", () => {
  it("ranks Hello world vs World hello highly", () => {
    const leaves = collectLeafStrings({
      existing: "World hello",
    });
    const hits = findSimilarStrings("Hello world", leaves, {
      minScore: 0.5,
      top: 3,
    });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].score).toBe(1);
    expect(hits[0].percent).toBe(100);
  });
});

describe("searchTranslationMatches", () => {
  it("returns all leaves with percent, sorted by score", () => {
    const locale = {
      a: "Hello world",
      b: "Something else entirely",
      c: "World hello there",
    };
    const matches = searchTranslationMatches("Hello world", locale);
    expect(matches.length).toBe(3);
    expect(matches[0].score).toBe(1);
    expect(matches[0].percent).toBe(100);
    expect(matches[0].path).toBe("a");
    expect(matches[1].score).toBeGreaterThan(matches[2].score);
  });

  it("returns empty for blank query", () => {
    expect(searchTranslationMatches("   ", { a: "x" })).toEqual([]);
  });

  it("respects minScore", () => {
    const locale = { x: "aaa", y: "bbb" };
    const all = searchTranslationMatches("aaa zzz", locale, { minScore: 0 });
    const filtered = searchTranslationMatches("aaa zzz", locale, { minScore: 0.5 });
    expect(all.length).toBeGreaterThanOrEqual(filtered.length);
    expect(filtered.every((m) => m.score >= 0.5)).toBe(true);
  });
});
