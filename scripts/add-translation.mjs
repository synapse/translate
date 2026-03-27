#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import {
  collectLeafStrings,
  findSimilarStrings,
} from "../dist/similarity.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const localesDir = join(__dirname, "..", "locales");

const KEY_RE = /^[A-Za-z0-9_ ]+$/;

function loadLocale(lang) {
  const file = join(localesDir, `${lang}.json`);
  if (!existsSync(file)) {
    mkdirSync(localesDir, { recursive: true });
    return {};
  }
  const raw = readFileSync(file, "utf8");
  if (!raw.trim()) return {};
  return JSON.parse(raw);
}

function sortKeysDeep(obj) {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) return obj;
  const sorted = {};
  for (const k of Object.keys(obj).sort()) {
    sorted[k] = sortKeysDeep(obj[k]);
  }
  return sorted;
}

async function main() {
  const rl = createInterface({ input, output });

  try {
    const langRaw = (await rl.question("Language file (default en): ")).trim();
    const lang = langRaw || "en";

    const text = (await rl.question("Complete translation text: ")).trim();
    if (!text) {
      console.error("Text is required.");
      process.exitCode = 1;
      return;
    }

    let key = "";
    while (true) {
      key = (await rl.question(
        "Translation key (sentence ok: letters, digits, spaces, underscores; no punctuation): ",
      )).trim();
      if (!key) {
        console.error("Invalid key: cannot be empty.");
        continue;
      }
      if (!KEY_RE.test(key)) {
        console.error(
          'Invalid key: use only ASCII letters, digits, spaces, and underscores — e.g. "Your name is" or hello_world.',
        );
        continue;
      }
      break;
    }

    const file = join(localesDir, `${lang}.json`);
    mkdirSync(localesDir, { recursive: true });
    const data = loadLocale(lang);

    if (Object.prototype.hasOwnProperty.call(data, key)) {
      console.error(`Key "${key}" already exists in ${lang}.json.`);
      process.exitCode = 1;
      return;
    }

    const leaves = collectLeafStrings(data);
    for (const leaf of leaves) {
      if (leaf.text === text) {
        console.error(
          `An entry with the exact same text already exists (${leaf.path}). Aborting.`,
        );
        process.exitCode = 1;
        return;
      }
    }

    const similar = findSimilarStrings(text, leaves, { top: 5, minScore: 0.15 });
    if (similar.length > 0) {
      console.log("\nSimilar existing strings (word overlap, Jaccard %):");
      for (const s of similar) {
        const pct = s.percent.toFixed(1);
        const snippet =
          s.text.length > 80 ? `${s.text.slice(0, 77)}...` : s.text;
        console.log(`  ${pct}% — [${s.path}] ${snippet}`);
      }
      const ans = (await rl.question("\nAdd this translation anyway? (y/N): "))
        .trim()
        .toLowerCase();
      if (ans !== "y" && ans !== "yes") {
        console.log("Cancelled.");
        return;
      }
    }

    data[key] = text;
    const sorted = sortKeysDeep(data);
    writeFileSync(file, `${JSON.stringify(sorted, null, 2)}\n`, "utf8");
    console.log(`Wrote ${file}`);
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
