#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import {
  listMissingPaths,
  listStrayTopLevelKeys,
} from "../dist/locale-merge.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const localesDir = join(__dirname, "..", "locales");

function loadJson(path) {
  if (!existsSync(path)) return {};
  const raw = readFileSync(path, "utf8");
  if (!raw.trim()) return {};
  return JSON.parse(raw);
}

async function main() {
  const { values } = parseArgs({
    options: {
      from: { type: "string", default: "en" },
      to: { type: "string", multiple: true },
      "fail-on-missing": { type: "boolean", default: false },
      "warn-stray": { type: "boolean", default: false },
    },
    allowPositionals: true,
  });

  const fromLang = values.from ?? "en";
  const targets = values.to;
  if (!targets || targets.length === 0) {
    console.error(
      "Usage: node scripts/check-locales.mjs --to <lang> [--to <lang>...] [--from en] [--fail-on-missing] [--warn-stray]",
    );
    process.exitCode = 1;
    return;
  }

  const fromPath = join(localesDir, `${fromLang}.json`);
  const source = loadJson(fromPath);

  let anyMissing = false;

  for (const lang of targets) {
    const toPath = join(localesDir, `${lang}.json`);
    const target = loadJson(toPath);
    const missing = listMissingPaths(source, target);
    console.log(`\n== ${lang}.json (vs ${fromLang}.json) ==`);
    if (missing.length === 0) {
      console.log("No missing paths.");
    } else {
      anyMissing = true;
      console.log("Missing paths:");
      for (const p of missing) console.log(`  - ${p}`);
    }

    if (values["warn-stray"]) {
      const stray = listStrayTopLevelKeys(source, target);
      if (stray.length > 0) {
        console.log("Stray top-level keys (not in source):");
        for (const k of stray) console.log(`  - ${k}`);
      }
    }
  }

  if (values["fail-on-missing"] && anyMissing) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
