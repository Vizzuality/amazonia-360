import { usePathname } from "next/navigation";

import { renderHook } from "@testing-library/react";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));

const { useCountry } = await import("./use-country");

afterEach(() => vi.unstubAllEnvs());

describe("useCountry", () => {
  test("is always the Amazon Region when the flag is off", () => {
    vi.mocked(usePathname).mockReturnValue("/en/ECU/reports");
    vi.stubEnv("NEXT_PUBLIC_FEATURE_FLAGS", "");

    expect(renderHook(() => useCountry()).result.current).toBeNull();
  });
});
