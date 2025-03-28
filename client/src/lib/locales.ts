export const LOCALES = ["en", "sp", "pt"] as const;
export const localeLabels: Record<(typeof LOCALES)[number], string> = {
  en: "English",
  sp: "Spanish",
  pt: "Portuguese",
};
