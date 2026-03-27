#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";

import { syncMissingFromSource } from "../dist/locale-merge.js";
import { resolveLocalesDir } from "./resolve-locales-dir.mjs";

function sortKeysDeep(obj) {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) return obj;
  const sorted = {};
  for (const k of Object.keys(obj).sort()) {
    sorted[k] = sortKeysDeep(obj[k]);
  }
  return sorted;
}

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
    },
    allowPositionals: true,
  });

  const fromLang = values.from ?? "en";
  const targets = values.to;
  if (!targets || targets.length === 0) {
    console.error("Usage: node scripts/sync-locales.mjs --to <lang> [--to <lang>...] [--from en]");
    process.exitCode = 1;
    return;
  }

  const localesDir = resolveLocalesDir();
  const fromPath = join(localesDir, `${fromLang}.json`);
  const source = loadJson(fromPath);
  mkdirSync(localesDir, { recursive: true });

  for (const lang of targets) {
    const toPath = join(localesDir, `${lang}.json`);
    const target = loadJson(toPath);
    const { added } = syncMissingFromSource(source, target);
    const sorted = sortKeysDeep(target);
    writeFileSync(toPath, `${JSON.stringify(sorted, null, 2)}\n`, "utf8");
    console.log(`${lang}.json: added ${added} empty string(s) (from ${fromLang}.json)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
