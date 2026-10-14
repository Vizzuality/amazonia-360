import { usePathname } from "next/navigation";

import { renderHook } from "@testing-library/react";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));

const { liveSlugsMock } = vi.hoisted(() => ({ liveSlugsMock: vi.fn(() => ["ECU"]) }));
vi.mock("@/lib/country-modules/queries", () => ({ useGetActiveModuleSlugs: liveSlugsMock }));

const { useCountry } = await import("./use-country");

beforeEach(() => liveSlugsMock.mockReturnValue(["ECU"]));
afterEach(() => vi.unstubAllEnvs());

describe("useCountry", () => {
  test("reads the live module slug from the URL", () => {
    vi.mocked(usePathname).mockReturnValue("/en/ECU/reports");

    expect(renderHook(() => useCountry()).result.current).toBe("ECU");
  });

  test("is the Amazon Region once the module is deactivated", () => {
    vi.mocked(usePathname).mockReturnValue("/en/ECU/reports");
    liveSlugsMock.mockReturnValue([]);

    expect(renderHook(() => useCountry()).result.current).toBeNull();
  });

  test("is always the Amazon Region when the flag is off", () => {
    vi.mocked(usePathname).mockReturnValue("/en/ECU/reports");
    vi.stubEnv("NEXT_PUBLIC_FEATURE_FLAGS", "");

    expect(renderHook(() => useCountry()).result.current).toBeNull();
  });
});
