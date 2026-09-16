export const skipWithoutCredentials = () =>
  !process.env.E2E_TEST_USER_EMAIL || !process.env.E2E_TEST_USER_PASSWORD;

export const skipWithoutSeedSecret = () => !process.env.E2E_SEED_SECRET;
