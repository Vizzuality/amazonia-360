import { test as base } from "@playwright/test";

type AppFixtures = {
  appLocale: string;
  appLocalePath: string;
};

export const test = base.extend<AppFixtures>({
  appLocale: ["en", { option: true }],
  appLocalePath: async ({ appLocale }, use) => {
    await use(`/${appLocale}`);
  },
});

export { expect } from "@playwright/test";
