import { hasLocale, Messages } from "use-intl";

import { routing } from "./routing";

export async function getMessages(requested: string | undefined): Promise<Messages> {
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  return (await import(`./translations/${locale}.json`)).default;
}
