import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import type { CountryModule, Partner } from "@/lib/country-modules";

import { ECU_MODULE, getPartnerFixture } from "@integration/fixtures/country-modules";

import IndicatorsPartners from "./partners";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/i18n/navigation", () => ({
  LocaleLink: ({
    href,
    children,
    ...props
  }: {
    href: string | { pathname: string; query?: Record<string, string> };
    children: React.ReactNode;
  }) => {
    const search = typeof href === "string" ? "" : new URLSearchParams(href.query).toString();
    const path = typeof href === "string" ? href : href.pathname;
    return (
      <a href={search ? `${path}?${search}` : path} {...props}>
        {children}
      </a>
    );
  },
}));

const ECU: CountryModule = { ...ECU_MODULE, id: "ecu" };
const BOL: CountryModule = { ...ECU_MODULE, id: "bol", slug: "BOL", country: "BOL" };

const PARTNERS: Partner[] = [
  getPartnerFixture({ id: "acto", name: "ACTO ARO", regional: true }),
  getPartnerFixture({ id: "gcf", name: "Green Climate Fund", regional: true, logoSize: "large" }),
  getPartnerFixture({ id: "mae", name: "Ministerio del Ambiente", moduleIds: ["ecu"] }),
  getPartnerFixture({ id: "igm", name: "IGM", moduleIds: ["ecu"] }),
];

const mockModules = vi.fn<() => CountryModule[]>();
const mockPartners = vi.fn<() => Partner[]>();

vi.mock("@/lib/country-modules", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/country-modules")>()),
  useGetCountryModules: () => mockModules(),
  useGetPartners: () => mockPartners(),
}));

describe("IndicatorsPartners", () => {
  beforeEach(() => {
    mockModules.mockReturnValue([ECU, BOL]);
    mockPartners.mockReturnValue(PARTNERS);
  });

  it("renders the regional logos when no module is active", () => {
    render(<IndicatorsPartners country={null} />);

    expect(screen.getAllByRole("img").map((img) => img.getAttribute("alt"))).toEqual([
      "ACTO ARO",
      "Green Climate Fund",
    ]);
  });

  it("renders the module partners in the ECU module", () => {
    render(<IndicatorsPartners country="ECU" />);

    expect(screen.getAllByRole("img").map((img) => img.getAttribute("alt"))).toEqual([
      "Ministerio del Ambiente",
      "IGM",
    ]);
  });

  it("renders nothing for a module without partners", () => {
    render(<IndicatorsPartners country="BOL" />);

    expect(screen.queryByTestId("indicators-partners")).not.toBeInTheDocument();
  });

  it("renders the regional partners for an unknown module slug", () => {
    render(<IndicatorsPartners country="XXX" />);

    expect(screen.getByAltText("ACTO ARO")).toBeInTheDocument();
    expect(screen.getByTestId("indicators-partners-learn-more")).toHaveAttribute(
      "href",
      "/partners",
    );
  });

  it("shows the title and a Learn more link to the plain partners page when regional", () => {
    render(<IndicatorsPartners country={null} />);

    expect(screen.getByText("country-module-modal-collaboration-title")).toBeInTheDocument();
    const cta = screen.getByTestId("indicators-partners-learn-more");
    expect(cta).toHaveAttribute("href", "/partners");
    expect(cta).toHaveAttribute("target", "_blank");
    expect(cta).toHaveAttribute("rel", "noopener noreferrer");
    expect(cta).toHaveTextContent("country-module-partnerships-cta");
  });

  it("links Learn more to the partners page filtered by the active module", () => {
    render(<IndicatorsPartners country="ECU" />);

    expect(screen.getByTestId("indicators-partners-learn-more")).toHaveAttribute(
      "href",
      "/partners?country=ECU",
    );
  });
});
