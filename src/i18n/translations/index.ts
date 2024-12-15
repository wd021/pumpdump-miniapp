import { de } from "./de";
import { en } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { ja } from "./ja";
import { ko } from "./ko";
import { nl } from "./nl";
import { pt } from "./pt";
import { tr } from "./tr";
import { zh } from "./zh";

export const translations = {
  de,
  en,
  es,
  fr,
  ja,
  ko,
  nl,
  pt,
  tr,
  zh,
} as const;

export type Language = keyof typeof translations;
export type TranslationType = typeof translations.en;
