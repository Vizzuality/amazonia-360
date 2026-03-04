import { test as base, expect } from "@playwright/test";

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

export { expect };
