import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import IndicatorsPartners from "./partners";

const mockUseLocale = vi.fn();

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => mockUseLocale(),
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

describe("IndicatorsPartners", () => {
  beforeEach(() => {
    mockUseLocale.mockReturnValue("en");
  });

  it("renders the six regional logos when no module is active", () => {
    render(<IndicatorsPartners country={null} />);

    expect(screen.getAllByRole("img").map((img) => img.getAttribute("alt"))).toEqual([
      "ACTO ARO",
      "Development Data Partnership",
      "IDB Atlas",
      "Green Climate Fund",
      "Esri",
      "Vizzuality",
    ]);
  });

  it("uses the locale variant of the ACTO logo", () => {
    mockUseLocale.mockReturnValue("es");

    render(<IndicatorsPartners country={null} />);

    expect(decodeURIComponent(screen.getByAltText("ACTO ARO").getAttribute("src") ?? "")).toContain(
      "atco-es",
    );
  });

  it("renders the five Ecuador logos in the ECU module", () => {
    render(<IndicatorsPartners country="ECU" />);

    expect(screen.getAllByRole("img").map((img) => img.getAttribute("alt"))).toEqual([
      "Gobierno del Ecuador",
      "Ministerio del Ambiente",
      "Instituto Geográfico Militar",
      "INABIO",
      "The Nature Conservancy",
    ]);
  });

  it("renders nothing for a module without partners", () => {
    render(<IndicatorsPartners country="BOL" />);

    expect(screen.queryByTestId("indicators-partners")).not.toBeInTheDocument();
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
