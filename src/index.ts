export {
  setTranslations,
  translate,
  t,
  getLocale,
  getTranslations,
  TRANSLATION_KEY_PATTERN,
  isValidTranslationKey,
} from "./translate.js";
export type {
  TranslationValue,
  SetTranslationsOptions,
} from "./translate.js";
export { pickPluralTemplate } from "./plural.js";
export type { PluralForms, PluralCategory } from "./plural.js";
export { parseTemplate, interpolate } from "./interpolation.js";
export type { Segment, ParamValues } from "./interpolation.js";
export {
  tokenize,
  jaccardSimilarity,
  scoreToPercent,
  collectLeafStrings,
  scoreMatchesForLeaves,
  searchTranslationMatches,
  findSimilarStrings,
} from "./similarity.js";
export type { LeafEntry, SimilarMatch } from "./similarity.js";
export {
  listMissingPaths,
  listStrayTopLevelKeys,
  syncMissingFromSource,
  parseLocaleFile,
  isPluralShape,
} from "./locale-merge.js";
export type { JsonObject } from "./locale-merge.js";
