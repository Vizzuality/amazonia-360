import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import IndicatorsList from "./index";

const mockUseGetDefaultIndicators = vi.fn();
const mockUseCountry = vi.fn();
const mockUseSyncIndicatorsScopeFilter = vi.fn();

vi.mock("@/lib/indicators", () => ({
  useGetDefaultIndicators: (...args: unknown[]) => mockUseGetDefaultIndicators(...args),
}));

vi.mock("@/i18n/use-country", () => ({
  useCountry: () => mockUseCountry(),
}));

vi.mock("@/app/(frontend)/store", () => ({
  useSyncIndicatorsScopeFilter: () => mockUseSyncIndicatorsScopeFilter(),
}));

vi.mock("./item", () => ({
  default: ({ id }: { id: number }) => <div data-testid="item">{id}</div>,
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

  it("renders no tabs of its own — they live at the report indicators content level", () => {
    mockUseCountry.mockReturnValue("ECU");
    mockUseSyncIndicatorsScopeFilter.mockReturnValue(["all", vi.fn()]);

    render(<IndicatorsList subtopicId={1} />);

    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });

  it("ignores the shared scope filter outside a country module", () => {
    mockUseCountry.mockReturnValue(null);
    mockUseSyncIndicatorsScopeFilter.mockReturnValue(["regional", vi.fn()]);

    render(<IndicatorsList subtopicId={1} />);

    expect(screen.getAllByTestId("item")).toHaveLength(3);
  });

  it("filters using the shared scope filter inside a module", () => {
    mockUseCountry.mockReturnValue("ECU");
    mockUseSyncIndicatorsScopeFilter.mockReturnValue(["regional", vi.fn()]);

    render(<IndicatorsList subtopicId={1} />);

    expect(screen.getAllByTestId("item")).toHaveLength(2);
  });
});
