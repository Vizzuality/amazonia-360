import { vi } from "vitest";

export const getReportFn = vi.fn(async (): Promise<string> => {
  throw new Error("getReportFn is not available in the integration tier");
});
