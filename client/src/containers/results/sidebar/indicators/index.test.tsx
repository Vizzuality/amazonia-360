import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { CATALOGUE } from "@/containers/indicators/catalogue.fixture";

import IndicatorsSidebarContent from "./index";

const mockUseGetDefaultIndicators = vi.fn();
const mockUseCountry = vi.fn();
const mockUseSyncIndicatorsScopeFilter = vi.fn();

vi.mock("@/lib/indicators", () => ({
  useGetDefaultIndicators: (...args: unknown[]) => mockUseGetDefaultIndicators(...args),
}));

vi.mock("@/lib/report/use-report-country", () => ({
  useReportCountry: () => mockUseCountry(),
}));

vi.mock("@/app/(frontend)/store", () => ({
  useSyncIndicatorsScopeFilter: () => mockUseSyncIndicatorsScopeFilter(),
}));

vi.mock("./search", () => ({ default: () => <div data-testid="search" /> }));
vi.mock("./topics", () => ({ default: () => <div data-testid="topics" /> }));
vi.mock("@/containers/results/sidebar/indicators/footer", () => ({
  default: () => <div data-testid="footer" />,
}));

describe("IndicatorsSidebarContent", () => {
  beforeEach(() => {
    mockUseSyncIndicatorsScopeFilter.mockReturnValue(["all", vi.fn()]);
  });

  it("renders no filter tabs outside a country module", () => {
    mockUseCountry.mockReturnValue(null);
    mockUseGetDefaultIndicators.mockReturnValue({ data: CATALOGUE });

    render(<IndicatorsSidebarContent />);

    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });

  it("shows the catalogue-wide count per tab inside a module", () => {
    mockUseCountry.mockReturnValue(["ECU"]);
    mockUseGetDefaultIndicators.mockReturnValue({ data: CATALOGUE });

    render(<IndicatorsSidebarContent />);

    expect(screen.getByText("country-module-filter-all")).toBeInTheDocument();
    expect(screen.getByText("country-module-filter-regional")).toBeInTheDocument();
    expect(screen.getByText("country-module-filter-national")).toBeInTheDocument();
  });
});
