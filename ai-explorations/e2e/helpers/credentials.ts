import { randomUUID } from "node:crypto";

// CI always supplies the seed secret, so a missing one there is a broken workflow rather than a
// local run without secrets. Skipping would report that as a green suite.
const isCI = !!process.env.CI;

type Credentials = { email: string; password: string };

function getCredentials(emailVar: string, passwordVar: string): Credentials {
  const email = process.env[emailVar];
  const password = process.env[passwordVar];
  if (!email || !password) throw new Error(`${emailVar} and ${passwordVar} must be set`);
  return { email, password };
}

export const getTestUser = () => getCredentials("E2E_TEST_USER_EMAIL", "E2E_TEST_USER_PASSWORD");

export const getTestViewer = () =>
  getCredentials("E2E_TEST_VIEWER_EMAIL", "E2E_TEST_VIEWER_PASSWORD");

export const getTestAdmin = () => getCredentials("E2E_ADMIN_EMAIL", "E2E_ADMIN_PASSWORD");

export const skipWithoutSeedSecret = () => !isCI && !process.env.E2E_SEED_SECRET;

export function getSeedSecret(): string {
  const secret = process.env.E2E_SEED_SECRET;
  if (!secret) throw new Error("E2E_SEED_SECRET must be set");
  return secret;
}

export function getUniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${randomUUID().slice(0, 8)}@example.com`;
}
