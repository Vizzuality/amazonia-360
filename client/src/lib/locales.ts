export const LOCALES = ["en", "es", "pt"] as const;
export const localeLabels: Record<(typeof LOCALES)[number], string> = {
  en: "English",
  es: "Spanish",
  pt: "Portuguese",
};
