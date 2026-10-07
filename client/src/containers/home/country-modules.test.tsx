import { render, screen, within } from "@testing-library/react";
import { vi } from "vitest";

import type { CountryModule, Partner } from "@/lib/country-modules";
import { useGetDefaultIndicators } from "@/lib/indicators";

import { ECU_MODULE, getPartnerFixture } from "@integration/fixtures/country-modules";

import CountryModules from "./country-modules";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key} ${JSON.stringify(values)}` : key,
}));

const { mockModules } = vi.hoisted(() => ({ mockModules: vi.fn<() => CountryModule[]>() }));

const ECU_WITH_BBOX: CountryModule = { ...ECU_MODULE, bbox: [-9313915, -559071, -8369795, 81173] };
const PARTNERS: Partner[] = [1, 2].map((order) =>
  getPartnerFixture({
    id: `partner-${order}`,
    name: `Partner ${order}`,
    logo: `/partners/${order}.avif`,
    moduleIds: [ECU_MODULE.id],
  }),
);

vi.mock("@/lib/country-modules", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/country-modules")>()),
  useGetCountryModules: () => mockModules(),
  useGetPartners: () => PARTNERS,
  useGetActiveModuleSlugs: () => mockModules().map(({ slug }) => slug),
}));

vi.mock("@/lib/indicators", () => ({ useGetDefaultIndicators: vi.fn() }));

vi.mock("@/i18n/navigation", () => ({
  LocaleLink: ({
    href,
    children,
    ...props
  }: {
    href: { pathname: string; query?: Record<string, string> };
    children: React.ReactNode;
  }) => (
    <a href={`${href.pathname}?${new URLSearchParams(href.query).toString()}`} {...props}>
      {children}
    </a>
  ),
}));

const mockedUseGetDefaultIndicators = vi.mocked(useGetDefaultIndicators);

function mockIndicators(data: { module: { slug: string } | null }[] | undefined) {
  mockedUseGetDefaultIndicators.mockReturnValue({ data } as ReturnType<
    typeof useGetDefaultIndicators
  >);
}

describe("CountryModules", () => {
  beforeEach(() => {
    mockModules.mockReturnValue([ECU_WITH_BBOX]);
    mockIndicators([
      { module: { slug: "ECU" } },
      { module: { slug: "ECU" } },
      { module: { slug: "ECU" } },
      { module: null },
      { module: null },
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
    expect(within(card).getByText(ECU_MODULE.moduleName)).toBeInTheDocument();
    expect(within(card).getByText("landing-country-modules-live")).toBeInTheDocument();
    expect(card.querySelector('img[src*="ECU.png"]')).not.toBeNull();
  });

  it("derives the flag from the module country, not its slug", () => {
    mockModules.mockReturnValue([{ ...ECU_MODULE, slug: "bra-para", country: "BRA" }]);

    render(<CountryModules />);

    const flag = screen.getByTestId("home-country-module-bra-para").getElementsByTagName("img")[0];
    expect(flag?.getAttribute("src")).toContain("BRA.png");
  });

  it("uses the same dataset and partner counts as the header dropdown", () => {
    render(<CountryModules />);

    const partners = PARTNERS.length;
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

  it("renders one link per CMS module and the more-countries card", () => {
    mockModules.mockReturnValue([
      ECU_WITH_BBOX,
      { ...ECU_MODULE, id: "bol", slug: "BOL", country: "BOL", moduleName: "Bolivian Amazon" },
    ]);

    render(<CountryModules />);

    const section = screen.getByTestId("home-country-modules");
    expect(within(section).getAllByRole("link")).toHaveLength(2);
    expect(screen.getByTestId("home-country-module-BOL")).toHaveTextContent("Bolivian Amazon");
    expect(screen.getByText("landing-country-modules-more")).toBeInTheDocument();
  });

  it("renders no module card when the CMS has no active module", () => {
    mockModules.mockReturnValue([]);

    render(<CountryModules />);

    expect(within(screen.getByTestId("home-country-modules")).queryAllByRole("link")).toHaveLength(
      0,
    );
  });

  it("omits the bbox query for a module without one", () => {
    mockModules.mockReturnValue([ECU_MODULE]);

    render(<CountryModules />);

    expect(screen.getByTestId("home-country-module-ECU")).toHaveAttribute("href", "/ECU/reports?");
  });
});
