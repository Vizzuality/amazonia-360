import { render, screen } from "@testing-library/react";
import { atom } from "jotai";
import { vi } from "vitest";

import ReportIndicatorsContent from "./content";

const mockUseGetDefaultIndicators = vi.fn();
const mockUseCountry = vi.fn();
const mockUseSyncIndicatorsScopeFilter = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/lib/indicators", () => ({
  useGetDefaultIndicators: (...args: unknown[]) => mockUseGetDefaultIndicators(...args),
}));

vi.mock("@/i18n/use-country", () => ({
  useCountry: () => mockUseCountry(),
}));

vi.mock("@/app/(frontend)/store", () => ({
  indicatorsExpandAtom: atom({}),
  useSyncIndicators: () => [[], vi.fn()],
  useSyncIndicatorsScopeFilter: () => mockUseSyncIndicatorsScopeFilter(),
}));

vi.mock("@/containers/report/indicators/search", () => ({
  default: () => <div data-testid="search" />,
}));
vi.mock("@/containers/report/indicators/topics", () => ({
  default: () => <div data-testid="topics" />,
}));
vi.mock("@/containers/report/indicators/footer", () => ({
  default: () => <div data-testid="footer" />,
}));

const CATALOGUE = [
  ...Array.from({ length: 164 }, (_, i) => ({ id: i, country: null })),
  ...Array.from({ length: 21 }, (_, i) => ({ id: 1000 + i, country: "ECU" })),
];

describe("ReportIndicatorsContent", () => {
  beforeEach(() => {
    mockUseSyncIndicatorsScopeFilter.mockReturnValue(["all", vi.fn()]);
  });

  it("renders no filter tabs outside a country module", () => {
    mockUseCountry.mockReturnValue(null);
    mockUseGetDefaultIndicators.mockReturnValue({ data: CATALOGUE });

    render(<ReportIndicatorsContent />);

    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });

  it("shows the catalogue-wide count per tab inside a module", () => {
    mockUseCountry.mockReturnValue("ECU");
    mockUseGetDefaultIndicators.mockReturnValue({ data: CATALOGUE });

    render(<ReportIndicatorsContent />);

    expect(screen.getByText("country-module-filter-all")).toBeInTheDocument();
    expect(screen.getByText("country-module-filter-regional")).toBeInTheDocument();
    expect(screen.getByText("country-module-filter-national")).toBeInTheDocument();
  });
});
