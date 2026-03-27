#!/usr/bin/env node
/**
 * Temporary playground: run `npm run build` once, then `npm run demo`.
 * Safe to delete when you no longer need it.
 *
 * Full six plural categories (zero…other) follow `Intl.PluralRules` for the
 * locale you pass to `setTranslations`. The table below matches `locale: "ar"`.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import { setTranslations, t } from "../dist/index.js";
import { resolveLocalesDir } from "./resolve-locales-dir.mjs";

const enPath = join(resolveLocalesDir(), "en.json");

const fromFile = existsSync(enPath)
  ? JSON.parse(readFileSync(enPath, "utf8"))
  : {};

/** Extra strings for this demo only (merge over file). */
const demoOnly = {
  "Your name is": "Your name is: %{name}",
  key: {
    zero: "zero",
    one: "singular",
    two: "two",
    few: "few",
    many: "many",
    other: "other",
  },
  "Lets count the items": {
    zero: "No items",
    one: "One item",
    other: "%{count} items",
  },
};

/** `ar` uses all six plural categories in a way that matches the classic demo table. */
setTranslations({ ...fromFile, ...demoOnly }, { locale: "ar" });

console.log("— demo translations (locale: ar) —\n");

if ("hello" in fromFile || "hello" in demoOnly) {
  console.log(`t("hello")     →`, t("hello"));
}

console.log(
  `t("Your name is", { name: "Alex" }) →`,
  t("Your name is", { name: "Alex" }),
);

console.log("\nPlural key `key` (six categories, matches Intl.PluralRules('ar')):\n");
const pluralDemo = [
  [0, "zero"],
  [1, "singular"],
  [2, "two"],
  [3, "few"],
  [4, "few"],
  [5, "few"],
  [11, "many"],
  [99, "many"],
  [100, "other"],
];
for (const [n, label] of pluralDemo) {
  const out = t("key", { count: n });
  const ok = out === label ? "✓" : "✗";
  console.log(`${ok} t("key", { count: ${String(n).padStart(3)} }) → ${JSON.stringify(out)} (expect ${label})`);
}

console.log(
  "\nEnglish-style plural (zero + one + other), still using locale ar rules:",
);
console.log(`  t("Lets count the items", { count: 0 }) →`, t("Lets count the items", { count: 0 }));
console.log(`  t("Lets count the items", { count: 1 }) →`, t("Lets count the items", { count: 1 }));
console.log(`  t("Lets count the items", { count: 12 }) →`, t("Lets count the items", { count: 12 }));

console.log(`\nt("not_in_json") →`, t("not_in_json"));
console.log("");
