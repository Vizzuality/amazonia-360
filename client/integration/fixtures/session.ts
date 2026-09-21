import type { Session } from "next-auth";

export interface TestUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

export interface TestSession extends Session {
  user: TestUser;
}

const DEFAULT_TEST_USER: TestUser = {
  id: "test-user-1",
  name: "Test User",
  email: "test-user@example.com",
  image: null,
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function getTestSession(overrides: Partial<TestUser> = {}): TestSession {
  return {
    user: { ...DEFAULT_TEST_USER, ...overrides },
    expires: new Date(Date.now() + ONE_DAY_MS).toISOString(),
  };
}
