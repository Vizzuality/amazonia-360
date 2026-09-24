import { render } from "@testing-library/react";
import { vi } from "vitest";

import CountryModuleActivation from "./activation";

const {
  mockUseCountry,
  mockUsePathname,
  mockReplace,
  mockIsCountryCoverageDominant,
  mockUseSyncLocation,
  mockBoundaries,
} = vi.hoisted(() => ({
  mockUseCountry: vi.fn(),
  mockUsePathname: vi.fn(),
  mockReplace: vi.fn(),
  mockIsCountryCoverageDominant: vi.fn(),
  mockUseSyncLocation: vi.fn(),
  mockBoundaries: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(() => new URLSearchParams("a=1&b=2")),
}));

vi.mock("@/lib/location", () => ({
  useLocationGeometry: vi.fn(() => ({})),
}));

vi.mock("@/app/(frontend)/store", () => ({
  useSyncLocation: vi.fn(() => [mockUseSyncLocation(), vi.fn()]),
}));

vi.mock("@/i18n/navigation", () => ({
  usePathname: vi.fn(() => mockUsePathname()),
  useRouter: vi.fn().mockReturnValue({ replace: mockReplace, push: vi.fn(), prefetch: vi.fn() }),
}));

vi.mock("@/i18n/use-country", () => ({
  useCountry: vi.fn(() => mockUseCountry()),
}));

vi.mock("@/lib/country/coverage", () => ({
  useGetLiveCountryBoundaries: vi.fn(() => ({ data: mockBoundaries() })),
  getCountryCoverageRatio: vi.fn(
    (_geometry: unknown, boundary: { ratio: number }) => boundary.ratio,
  ),
  isCountryCoverageDominant: vi.fn((ratio: number) => mockIsCountryCoverageDominant(ratio)),
}));

const DRAWN_AREA = { type: "polygon" };
const ONE_LIVE_COUNTRY = [{ code: "ECU", geometry: { ratio: 0.9 } }];

describe("CountryModuleActivation", () => {
  beforeEach(() => {
    mockUseCountry.mockReturnValue(null);
    mockUsePathname.mockReturnValue("/results");
    mockIsCountryCoverageDominant.mockReturnValue(false);
    mockUseSyncLocation.mockReturnValue(DRAWN_AREA);
    mockBoundaries.mockReturnValue(ONE_LIVE_COUNTRY);
    mockReplace.mockClear();
  });

  test("coverage above the threshold switches to the live module, preserving search params", () => {
    mockIsCountryCoverageDominant.mockReturnValue(true);

    render(<CountryModuleActivation />);

    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: "/ECU/results",
      query: { a: "1", b: "2" },
    });
  });

  test("coverage at or below the threshold does not switch", () => {
    mockIsCountryCoverageDominant.mockReturnValue(false);

    render(<CountryModuleActivation />);

    expect(mockReplace).not.toHaveBeenCalled();
  });

  test("already inside a module does not switch", () => {
    mockUseCountry.mockReturnValue("ECU");
    mockIsCountryCoverageDominant.mockReturnValue(true);

    render(<CountryModuleActivation />);

    expect(mockReplace).not.toHaveBeenCalled();
  });

  test("an unscoped pathname does not switch", () => {
    mockUsePathname.mockReturnValue("/webshot/report");
    mockIsCountryCoverageDominant.mockReturnValue(true);

    render(<CountryModuleActivation />);

    expect(mockReplace).not.toHaveBeenCalled();
  });

  test("does not re-fire on an unrelated re-render", () => {
    mockIsCountryCoverageDominant.mockReturnValue(true);

    const { rerender } = render(<CountryModuleActivation />);
    rerender(<CountryModuleActivation />);

    expect(mockReplace).toHaveBeenCalledTimes(1);
  });

  test("picks the module the area covers most when several qualify", () => {
    mockBoundaries.mockReturnValue([
      { code: "ECU", geometry: { ratio: 0.6 } },
      { code: "PER", geometry: { ratio: 0.8 } },
    ]);
    mockIsCountryCoverageDominant.mockImplementation((ratio: number) => ratio > 0.5);

    render(<CountryModuleActivation />);

    expect(mockReplace).toHaveBeenCalledWith({
      pathname: "/PER/results",
      query: { a: "1", b: "2" },
    });
  });

  test("leaving the module does not re-activate the same area", () => {
    mockIsCountryCoverageDominant.mockReturnValue(true);
    mockUseCountry.mockReturnValue("ECU");

    const { rerender } = render(<CountryModuleActivation />);
    mockUseCountry.mockReturnValue(null);
    mockUsePathname.mockReturnValue("/results");
    rerender(<CountryModuleActivation />);

    expect(mockReplace).not.toHaveBeenCalled();
  });

  test("a new area re-activates after the module was left", () => {
    mockIsCountryCoverageDominant.mockReturnValue(true);

    const { rerender } = render(<CountryModuleActivation />);
    expect(mockReplace).toHaveBeenCalledTimes(1);

    mockUseCountry.mockReturnValue("ECU");
    mockUsePathname.mockReturnValue("/ECU/results");
    rerender(<CountryModuleActivation />);

    mockUseCountry.mockReturnValue(null);
    mockUsePathname.mockReturnValue("/results");
    rerender(<CountryModuleActivation />);
    expect(mockReplace).toHaveBeenCalledTimes(1);

    mockUseSyncLocation.mockReturnValue({ type: "point" });
    rerender(<CountryModuleActivation />);

    expect(mockReplace).toHaveBeenCalledTimes(2);
  });

  test("clearing the area does not switch while the buffered geometry is still resolving", () => {
    mockIsCountryCoverageDominant.mockReturnValue(true);
    mockUseSyncLocation.mockReturnValue(null);

    render(<CountryModuleActivation />);

    expect(mockReplace).not.toHaveBeenCalled();
  });
});
