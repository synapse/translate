import { resolve } from "node:path";

/**
 * Directory containing `<lang>.json` files.
 *
 * - Default: `<current working directory>/locales` (your app root when you run the script from there).
 * - Override: `TRANSLATIONS_LOCALES_DIR=/absolute/or/relative/path` (resolved from cwd if relative).
 */
export function resolveLocalesDir() {
  const fromEnv = process.env.TRANSLATIONS_LOCALES_DIR;
  if (fromEnv != null && String(fromEnv).trim() !== "") {
    return resolve(process.cwd(), String(fromEnv).trim());
  }
  return resolve(process.cwd(), "locales");
}
