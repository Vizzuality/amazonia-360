import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getDefaultStore } from "jotai";
import { vi } from "vitest";

import CountryModuleActivation from "./activation";
import CountryModuleDeactivation from "./deactivation";
import { countryModuleDeactivatedAtom } from "./store";

const {
  mockUseCountry,
  mockUsePathname,
  mockReplace,
  mockActivationReplace,
  mockUseSyncLocation,
  mockGeometry,
  mockBoundary,
  mockRatio,
} = vi.hoisted(() => ({
  mockUseCountry: vi.fn(),
  mockUsePathname: vi.fn(),
  mockReplace: vi.fn(),
  mockActivationReplace: vi.fn(),
  mockUseSyncLocation: vi.fn(),
  mockGeometry: vi.fn(),
  mockBoundary: vi.fn(),
  mockRatio: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(() => new URLSearchParams("a=1&bbox=1,2,3,4&indicators=5")),
}));

vi.mock("@/lib/location", () => ({
  useLocationGeometry: vi.fn(() => mockGeometry()),
}));

vi.mock("@/app/(frontend)/store", () => ({
  useSyncLocation: vi.fn(() => [mockUseSyncLocation(), vi.fn()]),
}));

vi.mock("@/i18n/navigation", () => ({
  usePathname: vi.fn(() => mockUsePathname()),
  useRouter: vi
    .fn()
    .mockReturnValue({ replace: mockActivationReplace, push: vi.fn(), prefetch: vi.fn() }),
  useLocaleRouter: vi
    .fn()
    .mockReturnValue({ replace: mockReplace, push: vi.fn(), prefetch: vi.fn() }),
}));

vi.mock("@/i18n/use-country", () => ({
  useCountry: vi.fn(() => mockUseCountry()),
}));

vi.mock("@/lib/country/coverage", () => ({
  useGetCountryAmazoniaBoundary: vi.fn(() => ({ data: mockBoundary() })),
  useGetLiveCountryBoundaries: vi.fn(() => ({ data: [{ code: "ECU", geometry: {} }] })),
  getCountryCoverageRatio: vi.fn((geometry: unknown) => mockRatio(geometry)),
  isCountryCoverageDominant: vi.fn((ratio: number) => ratio > 0.5),
}));

const store = getDefaultStore();
const AREA_A = { type: "polygon", id: "a" };
const AREA_B = { type: "polygon", id: "b" };
const GEOMETRY_A = { id: "geometry-a" };
const GEOMETRY_B = { id: "geometry-b" };

const EXPECTED_EXIT = { pathname: "/reports", query: { a: "1", bbox: "1,2,3,4", indicators: "5" } };

describe("CountryModuleDeactivation", () => {
  beforeEach(() => {
    mockUseCountry.mockReturnValue("ECU");
    mockUsePathname.mockReturnValue("/ECU/reports");
    mockUseSyncLocation.mockReturnValue(AREA_A);
    mockGeometry.mockReturnValue(GEOMETRY_A);
    mockBoundary.mockReturnValue({ id: "boundary" });
    mockRatio.mockReturnValue(0);
    mockReplace.mockClear();
    mockActivationReplace.mockClear();
    act(() => store.set(countryModuleDeactivatedAtom, null));
  });

  test("an area with nothing inside leaves the module keeping the full query and opens the modal", () => {
    render(<CountryModuleDeactivation />);

    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith(EXPECTED_EXIT);
    expect(store.get(countryModuleDeactivatedAtom)).toBe("ECU");
    expect(screen.getByTestId("country-module-deactivated-dialog")).toBeInTheDocument();
  });

  test.each([0.3, 1])("coverage %s does not leave the module", (ratio) => {
    mockRatio.mockReturnValue(ratio);

    render(<CountryModuleDeactivation />);

    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.queryByTestId("country-module-deactivated-dialog")).not.toBeInTheDocument();
  });

  test.each([
    ["loading", undefined],
    ["null", null],
  ])("a %s boundary does not leave the module", (_name, boundary) => {
    mockBoundary.mockReturnValue(boundary);

    render(<CountryModuleDeactivation />);

    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.queryByTestId("country-module-deactivated-dialog")).not.toBeInTheDocument();
  });

  test("an unresolved geometry does not leave the module", () => {
    mockGeometry.mockReturnValue(null);

    render(<CountryModuleDeactivation />);

    expect(mockReplace).not.toHaveBeenCalled();
  });

  test("no area does not leave the module", () => {
    mockUseSyncLocation.mockReturnValue(null);
    mockGeometry.mockReturnValue(null);

    render(<CountryModuleDeactivation />);

    expect(mockReplace).not.toHaveBeenCalled();
  });

  test.each([
    ["regional", null, "/reports"],
    ["unscoped", "ECU", "/webshot/report"],
    ["saved-report", "ECU", "/reports/abc"],
  ])("a %s path is a no-op", (_name, country, pathname) => {
    mockUseCountry.mockReturnValue(country);
    mockUsePathname.mockReturnValue(pathname);

    render(<CountryModuleDeactivation />);

    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.queryByTestId("country-module-deactivated-dialog")).not.toBeInTheDocument();
  });

  test("the same area re-rendered is checked once, a new outside area is checked again", () => {
    const { rerender } = render(<CountryModuleDeactivation />);
    rerender(<CountryModuleDeactivation />);
    expect(mockReplace).toHaveBeenCalledTimes(1);

    mockUseSyncLocation.mockReturnValue(AREA_B);
    mockGeometry.mockReturnValue(GEOMETRY_B);
    rerender(<CountryModuleDeactivation />);

    expect(mockReplace).toHaveBeenCalledTimes(2);
  });

  test("a new outside area is judged on its own geometry, not the previous inside area's stale one", () => {
    mockRatio.mockImplementation((geometry: unknown) => (geometry === GEOMETRY_A ? 0.6 : 0));
    const { rerender } = render(<CountryModuleDeactivation />);
    expect(mockReplace).not.toHaveBeenCalled();

    mockUseSyncLocation.mockReturnValue(AREA_B);
    rerender(<CountryModuleDeactivation />);
    expect(mockReplace).not.toHaveBeenCalled();

    mockGeometry.mockReturnValue(GEOMETRY_B);
    rerender(<CountryModuleDeactivation />);

    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith(EXPECTED_EXIT);
  });

  test("picking the module again with the same outside area leaves it again", () => {
    const { rerender } = render(<CountryModuleDeactivation />);
    expect(mockReplace).toHaveBeenCalledTimes(1);

    mockUseCountry.mockReturnValue(null);
    mockUsePathname.mockReturnValue("/reports");
    rerender(<CountryModuleDeactivation />);

    mockUseCountry.mockReturnValue("ECU");
    mockUsePathname.mockReturnValue("/ECU/reports");
    rerender(<CountryModuleDeactivation />);

    expect(mockReplace).toHaveBeenCalledTimes(2);
  });

  test("Got it closes the modal and clears the atom", async () => {
    render(<CountryModuleDeactivation />);

    await userEvent.click(screen.getByRole("button", { name: "got-it-alert-button" }));

    expect(store.get(countryModuleDeactivatedAtom)).toBeNull();
    expect(screen.queryByTestId("country-module-deactivated-dialog")).not.toBeInTheDocument();
  });

  test("the close button closes the modal and clears the atom", async () => {
    render(<CountryModuleDeactivation />);

    await userEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(store.get(countryModuleDeactivatedAtom)).toBeNull();
    expect(screen.queryByTestId("country-module-deactivated-dialog")).not.toBeInTheDocument();
  });

  test("the modal survives the route change back to the regional path", () => {
    const { rerender } = render(<CountryModuleDeactivation />);

    mockUseCountry.mockReturnValue(null);
    mockUsePathname.mockReturnValue("/reports");
    rerender(<CountryModuleDeactivation />);

    expect(screen.getByTestId("country-module-deactivated-dialog")).toBeInTheDocument();
  });

  test("the modal shows for an atom preset on a regional path", () => {
    act(() => store.set(countryModuleDeactivatedAtom, "ECU"));
    mockUseCountry.mockReturnValue(null);
    mockUsePathname.mockReturnValue("/reports");

    render(<CountryModuleDeactivation />);

    expect(screen.getByTestId("country-module-deactivated-dialog")).toBeInTheDocument();
  });

  test("activation does not pull the area back into the module after the exit", () => {
    const { rerender } = render(
      <>
        <CountryModuleActivation />
        <CountryModuleDeactivation />
      </>,
    );
    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith(EXPECTED_EXIT);

    mockUseCountry.mockReturnValue(null);
    mockUsePathname.mockReturnValue("/reports");
    rerender(
      <>
        <CountryModuleActivation />
        <CountryModuleDeactivation />
      </>,
    );

    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockActivationReplace).not.toHaveBeenCalled();
  });
});
