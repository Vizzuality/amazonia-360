import { vi } from "vitest";

import "./a11y-matchers";

vi.mock("@/app/(frontend)/[locale]/(app)/auth/sign-in/actions", () => ({
  signInAction: vi.fn(),
}));

globalThis.process ??= { env: {} } as typeof globalThis.process;
Object.assign(process.env, import.meta.env);

if (window.history.state === null) {
  window.history.replaceState({}, "");
}
