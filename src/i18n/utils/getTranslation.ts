import { Language, translations } from "../translations";

export function getTranslations(lang: string) {
  return translations[lang as Language] ?? translations.en;
}
