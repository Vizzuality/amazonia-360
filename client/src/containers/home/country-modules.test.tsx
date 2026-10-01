import { render, screen, within } from "@testing-library/react";
import { vi } from "vitest";

import { getCountryModulePartnerLogos } from "@/lib/country/partners";
import { useGetDefaultIndicators } from "@/lib/indicators";

import CountryModules from "./country-modules";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key} ${JSON.stringify(values)}` : key,
}));

vi.mock("@/lib/indicators", () => ({ useGetDefaultIndicators: vi.fn() }));

vi.mock("@/i18n/navigation", () => ({
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

const mockedUseGetDefaultIndicators = vi.mocked(useGetDefaultIndicators);

function mockIndicators(data: { country: string | null }[] | undefined) {
  mockedUseGetDefaultIndicators.mockReturnValue({ data } as ReturnType<
    typeof useGetDefaultIndicators
  >);
}

describe("CountryModules", () => {
  beforeEach(() => {
    mockIndicators([
      { country: "ECU" },
      { country: "ECU" },
      { country: "ECU" },
      { country: null },
      { country: null },
    ]);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders nothing when the country-module flag is off", () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_FLAGS", "");

    render(<CountryModules />);

    expect(screen.queryByTestId("home-country-modules")).toBeNull();
  });

  it("renders the eyebrow, title and description", () => {
    render(<CountryModules />);

    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
      "landing-country-modules-note",
    );
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "landing-country-modules-title",
    );
    expect(screen.getByText("landing-country-modules-description")).toBeInTheDocument();
  });

  it("links the Ecuador card to its reports page with the Amazonia bbox", () => {
    render(<CountryModules />);

    expect(screen.getByTestId("home-country-module-ECU")).toHaveAttribute(
      "href",
      "/ECU/reports?bbox=-9313915%2C-559071%2C-8369795%2C81173",
    );
  });

  it("shows the Ecuador name, live badge and flag", () => {
    render(<CountryModules />);

    const card = screen.getByTestId("home-country-module-ECU");
    expect(within(card).getByText("country-module-ECU-module-name")).toBeInTheDocument();
    expect(within(card).getByText("landing-country-modules-live")).toBeInTheDocument();
    expect(card.querySelector('img[src*="ECU.png"]')).not.toBeNull();
  });

  it("uses the same dataset and partner counts as the header dropdown", () => {
    render(<CountryModules />);

    const partners = getCountryModulePartnerLogos("ECU").length;
    expect(
      screen.getByText(
        `country-module-country-description ${JSON.stringify({ count: 3, partners })}`,
      ),
    ).toBeInTheDocument();
    expect(mockedUseGetDefaultIndicators).toHaveBeenCalledWith(
      expect.objectContaining({ locale: "en", country: expect.arrayContaining(["ECU"]) }),
    );
  });

  it("shows a skeleton instead of the subtitle while indicators load", () => {
    mockIndicators(undefined);

    render(<CountryModules />);

    const card = screen.getByTestId("home-country-module-ECU");
    expect(card.querySelector(".animate-pulse")).not.toBeNull();
    expect(within(card).queryByText(/country-module-country-description/)).toBeNull();
  });

  it("renders a single link and the more-countries card without Suriname", () => {
    render(<CountryModules />);

    const section = screen.getByTestId("home-country-modules");
    expect(within(section).getAllByRole("link")).toHaveLength(1);
    expect(screen.getByText("landing-country-modules-more")).toBeInTheDocument();
    expect(screen.queryByText("country-module-SUR-module-name")).toBeNull();
  });
});
