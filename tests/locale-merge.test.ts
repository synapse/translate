import { describe, expect, it } from "vitest";
import {
  listMissingPaths,
  syncMissingFromSource,
  listStrayTopLevelKeys,
} from "../src/locale-merge.js";

describe("locale-merge", () => {
  const en = {
    greeting: "Hello",
    item_count: {
      zero: "No items",
      one: "One item",
      other: "%{count} items",
    },
  };

  it("lists missing top-level and nested paths", () => {
    const fr = { greeting: "Bonjour" };
    const missing = listMissingPaths(en, fr);
    expect(missing).toContain("item_count");
    expect(missing).not.toContain("greeting");
  });

  it("lists missing nested plural keys", () => {
    const fr = {
      item_count: {
        one: "Un",
        other: "%{count}",
      },
    };
    const missing = listMissingPaths(en, fr);
    expect(missing).toContain("item_count.zero");
  });

  it("sync adds empty strings without overwriting", () => {
    const source = { ...en };
    const target: Record<string, unknown> = { greeting: "Salut" };
    const { added } = syncMissingFromSource(source, target);
    expect(added).toBeGreaterThan(0);
    expect(target.greeting).toBe("Salut");
    expect(target.item_count).toEqual({
      zero: "",
      one: "",
      other: "",
    });
  });

  it("lists stray top-level keys", () => {
    const stray = listStrayTopLevelKeys(
      { a: "1" },
      { a: "1", extra: "x" },
    );
    expect(stray).toEqual(["extra"]);
  });
});
