// CI always supplies these, so a missing one there is a broken workflow rather than a
// local run without secrets. Skipping would report that as a green suite.
const isCI = !!process.env.CI;

export const skipWithoutCredentials = () =>
  !isCI && (!process.env.E2E_TEST_USER_EMAIL || !process.env.E2E_TEST_USER_PASSWORD);

export const skipWithoutSeedSecret = () => !isCI && !process.env.E2E_SEED_SECRET;
