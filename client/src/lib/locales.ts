import { routing } from "@/i18n/routing";

export const LOCALES = routing.locales;
export const localeLabelsShort: Record<(typeof LOCALES)[number], string> = {
  en: "EN",
  es: "ES",
  pt: "PT",
};

export const localeLabelsLong: Record<(typeof LOCALES)[number], string> = {
  en: "EN - English",
  es: "ES - Español",
  pt: "PT - Português",
};
