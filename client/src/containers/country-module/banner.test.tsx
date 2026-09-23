import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import CountryModuleBanner from "./banner";

const { mockUseCountry, mockUsePathname, mockBoundary, mockRatio } = vi.hoisted(() => ({
  mockUseCountry: vi.fn(),
  mockUsePathname: vi.fn(),
  mockBoundary: vi.fn(),
  mockRatio: vi.fn(),
}));

vi.mock("@/lib/location", () => ({ useLocationGeometry: vi.fn(() => ({})) }));

vi.mock("@/app/(frontend)/store", () => ({
  useSyncLocation: vi.fn(() => [{ type: "point" }, vi.fn()]),
}));

vi.mock("@/i18n/navigation", () => ({ usePathname: vi.fn(() => mockUsePathname()) }));
vi.mock("@/i18n/use-country", () => ({ useCountry: vi.fn(() => mockUseCountry()) }));

vi.mock("@/lib/country-coverage", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/country-coverage")>()),
  useGetCountryAmazoniaBoundary: vi.fn(() => ({ data: mockBoundary() })),
  getCountryCoverageRatio: vi.fn(() => mockRatio()),
}));

beforeEach(() => {
  mockUsePathname.mockReturnValue("/ECU/reports");
  mockUseCountry.mockReturnValue("ECU");
  mockBoundary.mockReturnValue({});
  mockRatio.mockReturnValue(0.82);
});

describe("CountryModuleBanner", () => {
  it("reports how much of the area falls outside the module", () => {
    render(<CountryModuleBanner />);

    expect(screen.getByText(/country-module-coverage-banner/)).toBeInTheDocument();
  });

  // An unresolved boundary makes the ratio 0, which would read as "all of it is outside".
  it("stays silent until the boundary resolves", () => {
    mockBoundary.mockReturnValue(undefined);
    mockRatio.mockReturnValue(0);

    const { container } = render(<CountryModuleBanner />);

    expect(container).toBeEmptyDOMElement();
  });

  it("stays silent when the area is fully inside", () => {
    mockRatio.mockReturnValue(1);

    const { container } = render(<CountryModuleBanner />);

    expect(container).toBeEmptyDOMElement();
  });

  it("stays silent with no module active", () => {
    mockUseCountry.mockReturnValue(null);

    const { container } = render(<CountryModuleBanner />);

    expect(container).toBeEmptyDOMElement();
  });
});
