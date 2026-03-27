# Translation framework

Small in-memory i18n helpers: `setTranslations`, `translate` / `t`, `%{name}` interpolation, plural objects with `Intl.PluralRules`, memoization, and CLI tools for JSON locale files.

## Runtime API

```ts
import { setTranslations, t } from "@translations/framework";

setTranslations(
  {
    greeting: "Hello %{name}",
    item_count: {
      zero: "No items",
      one: "One item",
      other: "%{count} items",
    },
  },
  { locale: "en" },
);

t("greeting", { name: "Ada" });
t("Your name is", { name: "Ada" });
t("item_count", { count: 3 });
```

- Missing translation **key** → returns the key in **UPPERCASE**.
- Unknown `%{placeholder}` values → empty string.
- Translation **keys** may be short ids or full phrases; they must match `^[A-Za-z0-9_ ]+$` (ASCII letters, digits, underscores, spaces — **no punctuation**), and must not have leading or trailing spaces.

**Search (programmatic):** `searchTranslationMatches(query, localeObject, { minScore? })` returns every leaf string with `score` (0–1), `percent` (0–100, one decimal), `path`, and `text` — same Jaccard metric as `add:translation`. Use `scoreMatchesForLeaves` if you already have `collectLeafStrings` output.

**Plurals:** Use an object with `zero`, `one`, `two`, `few`, `many`, and/or `other` strings. The active `locale` in `setTranslations` drives which category `Intl.PluralRules` picks for `{ count: n }`. For example, **Arabic (`ar`)** uses all six categories in a way that matches the classic demo (`0` → zero, `1` → one, `2` → two, `3–5` → few, `11`/`99` → many, `100` → other). English often only needs `zero` / `one` / `other`; the library still applies the special case `count === 0` → `zero` when that key exists.

Build the library: `npm run build` (outputs `dist/`).

## Maintainer scripts

Compile TypeScript first so `dist/` exists:

```bash
npm run build
```

| Script | Purpose |
|--------|---------|
| `npm run add:translation` | Interactive: add a key/string to `locales/<lang>.json` with duplicate and similarity checks. |
| `npm run sync:locales -- --to fr` | Copy missing keys from `locales/en.json` into `locales/fr.json` with `""` placeholders. Multiple `--to` allowed. |
| `npm run check:locales -- --to fr` | Report paths present in English but missing in the target locale. Add `--fail-on-missing` for CI. |
| `npm run search:translations` | List locale strings ranked by word-set Jaccard similarity (percentage). **npm needs `--` before flags:** `npm run search:translations -- --query "text" --lang en --min 0`. **Or use positionals:** `npm run search:translations -- "text" en 0` (query, lang, min). |
| `npm run demo` | Temporary script: loads `locales/en.json`, merges a few demo strings, prints `t()` output. Remove `scripts/demo-translations.mjs` when you do not need it. |

Source language defaults to `--from en`. Run `npm run build` before `demo` if `dist/` is missing.

**Where JSON files live:** Scripts read and write **`locales/` under the current working directory** (the folder from which you run the command). In an app that depends on this package, run them from your **project root** so your `locales/en.json` is used—not the copy inside `node_modules`.

**Using scripts from another project (after `npm install` and `npm run build` in this repo, or publish the package with `dist/` included):**

1. **Wrappers in your `package.json`** (run from your app root):

   ```json
   {
     "scripts": {
       "i18n:add": "node node_modules/@translations/framework/scripts/add-translation.mjs",
       "i18n:sync": "node node_modules/@translations/framework/scripts/sync-locales.mjs",
       "i18n:check": "node node_modules/@translations/framework/scripts/check-locales.mjs",
       "i18n:search": "node node_modules/@translations/framework/scripts/search-translations.mjs"
     }
   }
   ```

   If your package name differs, adjust the path to `node_modules/<your-package-name>/scripts/...`.

2. **`npx` / `bin`** — This package exposes **`translations-search`**, **`translations-add`**, **`translations-sync`**, **`translations-check`**, **`translations-demo`**. From your app root:

   ```bash
   npx translations-search -- hello en 0
   ```

3. **Custom folder** — set `TRANSLATIONS_LOCALES_DIR` to a path (absolute or relative to `process.cwd()`):

   ```bash
   TRANSLATIONS_LOCALES_DIR=./src/i18n/locales npx translations-search -- hello en 0
   ```

## Tests

```bash
npm test
```
