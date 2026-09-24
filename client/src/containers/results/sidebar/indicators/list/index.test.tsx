import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { IndicatorsList } from "./index";

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

vi.mock("./item", () => ({
  IndicatorsItem: ({ indicator }: { indicator: { id: number } }) => (
    <div data-testid="item">{indicator.id}</div>
  ),
}));

const INDICATORS = [
  { id: 1, country: null },
  { id: 2, country: null },
  { id: 3, country: "ECU" },
];

describe("IndicatorsList", () => {
  beforeEach(() => {
    mockUseGetDefaultIndicators.mockReturnValue({
      data: INDICATORS,
      isFetching: false,
      isFetched: true,
    });
  });

  it("renders no tabs of its own — they live at the sidebar level", () => {
    mockUseCountry.mockReturnValue(["ECU"]);
    mockUseSyncIndicatorsScopeFilter.mockReturnValue(["all", vi.fn()]);

    render(<IndicatorsList topicId={1} subtopicId={1} />);

    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });

  it("ignores the shared scope filter outside a country module", () => {
    mockUseCountry.mockReturnValue(null);
    mockUseSyncIndicatorsScopeFilter.mockReturnValue(["national", vi.fn()]);

    render(<IndicatorsList topicId={1} subtopicId={1} />);

    expect(screen.getAllByTestId("item")).toHaveLength(3);
  });

  it("filters using the shared scope filter inside a module", () => {
    mockUseCountry.mockReturnValue(["ECU"]);
    mockUseSyncIndicatorsScopeFilter.mockReturnValue(["national", vi.fn()]);

    render(<IndicatorsList topicId={1} subtopicId={1} />);

    expect(screen.getAllByTestId("item")).toHaveLength(1);
  });
});
