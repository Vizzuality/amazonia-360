import { createTranslator, Locale } from "use-intl";

import { getMessages } from "./request";

export async function getTranslations({ locale }: { locale: Locale }) {
  const messages = await getMessages(locale);
  return createTranslator({ locale, messages });
}
