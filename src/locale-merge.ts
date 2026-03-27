import type { TranslationValue } from "./translate.js";

export type JsonObject = Record<string, unknown>;

function isPlainObject(v: unknown): v is JsonObject {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** True if value is a plural-style object (only string values). */
export function isPluralShape(v: unknown): v is Record<string, string> {
  if (!isPlainObject(v)) return false;
  const vals = Object.values(v);
  if (vals.length === 0) return false;
  return vals.every((x) => typeof x === "string");
}

/**
 * List paths present in `source` but missing in `target` (dot-separated).
 */
export function listMissingPaths(
  source: JsonObject,
  target: JsonObject,
  prefix = "",
): string[] {
  const missing: string[] = [];

  for (const k of Object.keys(source)) {
    const path = prefix ? `${prefix}.${k}` : k;
    const sv = source[k];
    const tv = target[k];

    if (typeof sv === "string") {
      if (tv === undefined) missing.push(path);
      continue;
    }

    if (isPluralShape(sv)) {
      if (tv === undefined) {
        missing.push(path);
        continue;
      }
      if (!isPlainObject(tv)) {
        missing.push(path);
        continue;
      }
      const tObj = tv as Record<string, unknown>;
      for (const pk of Object.keys(sv)) {
        const sub = `${path}.${pk}`;
        if (tObj[pk] === undefined) missing.push(sub);
      }
    }
  }

  return missing;
}

/**
 * Keys in `target` that are not in `source` (top-level only).
 */
export function listStrayTopLevelKeys(
  source: JsonObject,
  target: JsonObject,
): string[] {
  return Object.keys(target).filter((k) => !(k in source));
}

/**
 * Add missing keys from `source` into `target` with `""` for new leaves.
 * Does not overwrite existing values.
 */
export function syncMissingFromSource(
  source: JsonObject,
  target: JsonObject,
): { added: number } {
  let added = 0;

  for (const k of Object.keys(source)) {
    const sv = source[k];

    if (typeof sv === "string") {
      if (target[k] === undefined) {
        target[k] = "";
        added += 1;
      }
      continue;
    }

    if (isPluralShape(sv)) {
      if (target[k] === undefined) {
        const empty: Record<string, string> = {};
        for (const pk of Object.keys(sv)) {
          empty[pk] = "";
        }
        target[k] = empty;
        added += Object.keys(sv).length;
        continue;
      }
      if (!isPlainObject(target[k])) {
        const empty: Record<string, string> = {};
        for (const pk of Object.keys(sv)) {
          empty[pk] = "";
        }
        target[k] = empty;
        added += Object.keys(sv).length;
        continue;
      }
      const tInner = target[k] as Record<string, unknown>;
      for (const pk of Object.keys(sv)) {
        if (tInner[pk] === undefined) {
          tInner[pk] = "";
          added += 1;
        }
      }
    }
  }

  return { added };
}

export function parseLocaleFile(raw: unknown): Record<string, TranslationValue> {
  if (!isPlainObject(raw)) return {};
  return raw as Record<string, TranslationValue>;
}
