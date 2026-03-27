import { describe, expect, it, beforeEach } from "vitest";
import {
  setTranslations,
  translate,
  t,
  getLocale,
} from "../src/translate.js";

describe("translate / t", () => {
  beforeEach(() => {
    setTranslations({}, { locale: "en" });
  });

  it("returns UPPERCASE key when missing", () => {
    setTranslations({ hello: "Hi %{name}" });
    expect(translate("missing_key")).toBe("MISSING_KEY");
    expect(t("other")).toBe("OTHER");
  });

  it("interpolates %{name}", () => {
    setTranslations({ greeting: "Hello %{name}" });
    expect(t("greeting", { name: "Ada" })).toBe("Hello Ada");
  });

  it("uses empty string for missing param", () => {
    setTranslations({ a: "x%{y}z" });
    expect(t("a", {})).toBe("xz");
  });

  it("throws on invalid lookup key", () => {
    setTranslations({ ok: "x" });
    expect(() => t("bad-key")).toThrow(/Invalid translation key/);
  });

  it("rejects invalid keys in setTranslations", () => {
    expect(() => setTranslations({ "bad.key": "x" })).toThrow(/Invalid translation key/);
  });

  it("accepts valid keys with digits and underscore", () => {
    setTranslations({ key_1: "v%{n}" });
    expect(t("key_1", { n: 2 })).toBe("v2");
  });

  it("accepts sentence-style keys with spaces", () => {
    setTranslations({ "Your name is": "Your name is: %{name}" });
    expect(t("Your name is", { name: "Ada" })).toBe("Your name is: Ada");
  });

  it("rejects keys with leading or trailing spaces", () => {
    expect(() => setTranslations({ " nope": "x" })).toThrow(/Invalid translation key/);
    expect(() => setTranslations({ "nope ": "x" })).toThrow(/Invalid translation key/);
  });
});

describe("plurals", () => {
  beforeEach(() => {
    setTranslations(
      {
        item_count: {
          zero: "No items",
          one: "One item",
          other: "%{count} items",
        },
      },
      { locale: "en" },
    );
  });

  it("selects one/other for English", () => {
    expect(t("item_count", { count: 1 })).toBe("One item");
    expect(t("item_count", { count: 5 })).toBe("5 items");
    expect(t("item_count", { count: 0 })).toBe("No items");
  });

  it("uses locale from setTranslations", () => {
    expect(getLocale()).toBe("en");
  });
});

describe("plurals (Arabic locale, six categories)", () => {
  const pluralForms = {
    zero: "zero",
    one: "singular",
    two: "two",
    few: "few",
    many: "many",
    other: "other",
  };

  beforeEach(() => {
    setTranslations({ key: pluralForms }, { locale: "ar" });
  });

  it("maps counts to Intl.PluralRules(ar) categories", () => {
    expect(t("key", { count: 0 })).toBe("zero");
    expect(t("key", { count: 1 })).toBe("singular");
    expect(t("key", { count: 2 })).toBe("two");
    expect(t("key", { count: 3 })).toBe("few");
    expect(t("key", { count: 4 })).toBe("few");
    expect(t("key", { count: 5 })).toBe("few");
    expect(t("key", { count: 11 })).toBe("many");
    expect(t("key", { count: 99 })).toBe("many");
    expect(t("key", { count: 100 })).toBe("other");
  });
});

describe("memoization", () => {
  it("returns same string for repeated t with same args", () => {
    setTranslations({ a: "n%{x}" });
    const s1 = t("a", { x: 1 });
    const s2 = t("a", { x: 1 });
    expect(s1).toBe("n1");
    expect(s2).toBe(s1);
  });
});
