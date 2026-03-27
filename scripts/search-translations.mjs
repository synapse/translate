#!/usr/bin/env node
/**
 * Search locale JSON for strings similar to a query (word-set Jaccard).
 *
 * npm requires `--` before script flags, otherwise npm consumes them:
 *   npm run search:translations -- --query "hello" --lang en --min 0
 *
 * Positional form (no --query flag):
 *   npm run search:translations -- "hello world" en 0
 *   node scripts/search-translations.mjs "hello world" en 0
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { searchTranslationMatches } from "../dist/similarity.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const localesDir = join(__dirname, "..", "locales");

function loadJson(path) {
  if (!existsSync(path)) {
    console.error(`File not found: ${path}`);
    process.exitCode = 1;
    return null;
  }
  const raw = readFileSync(path, "utf8");
  if (!raw.trim()) return {};
  return JSON.parse(raw);
}

async function main() {
  const { values, positionals } = parseArgs({
    options: {
      lang: { type: "string" },
      query: { type: "string" },
      min: { type: "string" },
    },
    allowPositionals: true,
  });

  const query =
    (values.query && values.query.trim()) ||
    (positionals[0] && String(positionals[0]).trim()) ||
    "";
  if (!query) {
    console.error(
      'Usage:\n  node scripts/search-translations.mjs --query "search text" [--lang en] [--min 0]\n  node scripts/search-translations.mjs "search text" [lang] [min]\n\nnpm:\n  npm run search:translations -- --query "hello" --lang en --min 0\n  npm run search:translations -- hello en 0\n\n(Use `--` before flags so npm does not treat them as npm options.)',
    );
    process.exitCode = 1;
    return;
  }

  const lang = values.lang ?? positionals[1] ?? "en";
  const minScore =
    values.min !== undefined
      ? Number(values.min)
      : positionals[2] !== undefined
        ? Number(positionals[2])
        : 0;
  if (Number.isNaN(minScore) || minScore < 0 || minScore > 1) {
    console.error("--min must be a number between 0 and 1.");
    process.exitCode = 1;
    return;
  }

  const path = join(localesDir, `${lang}.json`);
  const data = loadJson(path);
  if (data === null) return;

  const matches = searchTranslationMatches(query, data, { minScore });

  if (matches.length === 0) {
    console.log(`No matches (min score ${minScore}).`);
    return;
  }

  console.log(`\nMatches in ${lang}.json for "${query.trim()}" (${matches.length} result(s), min score ${minScore}):\n`);
  for (const m of matches) {
    const snippet =
      m.text.length > 100 ? `${m.text.slice(0, 97)}...` : m.text;
    console.log(`  ${m.percent.toFixed(1)}%  [${m.path}]  ${snippet}`);
  }
  console.log("");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
