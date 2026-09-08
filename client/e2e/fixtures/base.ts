import { test as base } from "@playwright/test";

import { AMAZON_REGION, countryPath, type Locale } from "../helpers/locale";

type AppFixtures = {
  appLocale: Locale;
  appCountry: string;
  appLocalePath: string;
};

export const test = base.extend<AppFixtures>({
  appLocale: ["en", { option: true }],
  appCountry: [AMAZON_REGION, { option: true }],
  appLocalePath: async ({ appLocale, appCountry }, use) => {
    await use(countryPath(appLocale, appCountry));
  },
});

export { expect } from "@playwright/test";
