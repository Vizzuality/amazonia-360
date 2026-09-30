import { render, screen } from "@testing-library/react";
import { NuqsTestingAdapter, type OnUrlUpdateFunction } from "nuqs/adapters/testing";
import { vi } from "vitest";

import { getPartnerCountries } from "@/lib/country/partners";

import CountryModulePartnerships from "./country-modules";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

function renderBlock(searchParams = "", onUrlUpdate?: OnUrlUpdateFunction) {
  return render(
    <NuqsTestingAdapter searchParams={searchParams} onUrlUpdate={onUrlUpdate}>
      <CountryModulePartnerships />
    </NuqsTestingAdapter>,
  );
}

describe("CountryModulePartnerships", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders nothing when the country-module flag is off", () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_FLAGS", "");

    renderBlock();

    expect(screen.queryByTestId("partners-country-modules")).toBeNull();
  });

  it("renders one tab per partner country with the first selected", () => {
    renderBlock();

    const codes = getPartnerCountries().map((entry) => entry.code);
    expect(screen.getAllByRole("tab")).toHaveLength(codes.length);
    expect(screen.getByTestId(`partners-country-tab-${codes[0]}`)).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "partners-country-modules-title",
    );
  });

  it("renders a labelled card per Ecuador partner", () => {
    renderBlock();

    const cards = screen.getAllByTestId("partners-country-card");
    expect(cards.map((card) => card.textContent)).toEqual([
      "Gobierno del Ecuador",
      "MAE",
      "IGM",
      "INABIO",
      "TNC",
    ]);
    expect(screen.getByText("partners-country-module-ECU-description")).toBeInTheDocument();
  });

  it("preselects the country from the query", () => {
    renderBlock("?country=ECU");

    expect(screen.getByTestId("partners-country-tab-ECU")).toHaveAttribute("aria-selected", "true");
  });

  it("falls back to the first tab for an unknown country", () => {
    renderBlock("?country=XXX");

    expect(screen.getByTestId("partners-country-tab-ECU")).toHaveAttribute("aria-selected", "true");
  });
});
