import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import CountryModuleBanner from "./banner";

const { mockUseCountry, mockUsePathname, mockCoverage, mockSearch } = vi.hoisted(() => ({
  mockUseCountry: vi.fn(),
  mockUsePathname: vi.fn(),
  mockCoverage: vi.fn(),
  mockSearch: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(() => new URLSearchParams(mockSearch())),
}));

vi.mock("@/i18n/navigation", () => ({
  usePathname: vi.fn(() => mockUsePathname()),
  LocaleLink: ({
    href,
    children,
    ...props
  }: {
    href: { pathname: string; query: Record<string, string> };
    children: React.ReactNode;
  }) => (
    <a href={`${href.pathname}?${new URLSearchParams(href.query).toString()}`} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("@/i18n/use-country", () => ({ useCountry: vi.fn(() => mockUseCountry()) }));
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key} ${JSON.stringify(values)}` : key,
}));
vi.mock("./use-coverage", () => ({ useCountryModuleCoverage: vi.fn(() => mockCoverage()) }));

class ResizeObserverStub {
  observe = vi.fn();
  disconnect = vi.fn();
}

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverStub);
});

beforeEach(() => {
  mockUsePathname.mockReturnValue("/ECU/reports");
  mockUseCountry.mockReturnValue("ECU");
  mockSearch.mockReturnValue("");
  mockCoverage.mockReturnValue({ status: "no-area", ratio: 0, geometry: null });
});

describe("CountryModuleBanner", () => {
  it("with no area shows the tip to draw one", () => {
    render(<CountryModuleBanner />);

    expect(screen.getByText(/country-module-active-label/)).toBeInTheDocument();
    expect(screen.getByText(/country-module-active-description/)).toBeInTheDocument();
    expect(screen.getByTestId("country-module-exit")).toBeInTheDocument();
    expect(screen.queryByTestId("country-module-coverage")).not.toBeInTheDocument();
  });

  it.each([
    ["fully inside", 1, 100],
    ["70% inside", 0.7, 70],
    ["almost fully inside", 0.996, 99],
    ["barely inside", 0.003, 1],
  ])("with an area %s shows only the inside percentage", (_label, ratio, percent) => {
    mockCoverage.mockReturnValue({ status: "inside", ratio, geometry: {} });

    render(<CountryModuleBanner />);

    expect(screen.getByTestId("country-module-coverage")).toHaveTextContent(
      `country-module-coverage-inside ${JSON.stringify({ percent, name: "country-module-ECU-module-name" })}`,
    );
    expect(screen.queryByText(/country-module-active-description/)).not.toBeInTheDocument();
  });

  it.each([
    ["pending", { status: "pending", ratio: 0, geometry: {} }],
    ["fully outside", { status: "outside", ratio: 0, geometry: {} }],
  ])("while %s shows neither the tip nor a percentage", (_label, coverage) => {
    mockCoverage.mockReturnValue(coverage);

    render(<CountryModuleBanner />);

    expect(screen.getByTestId("country-module-exit")).toBeInTheDocument();
    expect(screen.queryByText(/country-module-active-description/)).not.toBeInTheDocument();
    expect(screen.queryByTestId("country-module-coverage")).not.toBeInTheDocument();
  });

  it.each([
    ["regional", "/reports", null],
    ["unscoped", "/private/reports", "ECU"],
    ["saved report", "/reports/abc", "ECU"],
  ])("renders nothing on a %s path", (_label, pathname, country) => {
    mockUsePathname.mockReturnValue(pathname);
    mockUseCountry.mockReturnValue(country);

    const { container } = render(<CountryModuleBanner />);

    expect(container).toBeEmptyDOMElement();
  });

  it("exits to the unscoped path keeping the query string", () => {
    mockSearch.mockReturnValue("bbox=1,2,3,4&indicators=5");

    render(<CountryModuleBanner />);

    const href = screen.getByTestId("country-module-exit").getAttribute("href") ?? "";
    const url = new URL(href, "http://x");
    expect(url.pathname).toBe("/reports");
    expect(url.searchParams.get("bbox")).toBe("1,2,3,4");
    expect(url.searchParams.get("indicators")).toBe("5");
  });

  it("overlays the map only from the lg breakpoint", () => {
    render(<CountryModuleBanner />);

    const strip = screen.getByTestId("country-module-banner");
    expect(strip).toHaveClass("relative", "lg:absolute", "lg:top-16", "lg:inset-x-0");
  });

  it("publishes its height as a CSS variable while mounted and clears it on unmount", () => {
    const { unmount } = render(<CountryModuleBanner />);

    expect(document.documentElement.style.getPropertyValue("--country-module-strip-h")).toBe("0px");

    unmount();

    expect(document.documentElement.style.getPropertyValue("--country-module-strip-h")).toBe("");
  });
});
