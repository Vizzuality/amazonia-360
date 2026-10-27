import { vi } from "vitest";

export const getRouterInstance = vi.fn(async () => {
  throw new Error("getRouterInstance is not available in the integration tier");
});
