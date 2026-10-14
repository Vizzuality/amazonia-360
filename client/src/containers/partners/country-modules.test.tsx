import { fireEvent, render, screen } from "@testing-library/react";
import { NuqsTestingAdapter, type OnUrlUpdateFunction } from "nuqs/adapters/testing";
import { vi } from "vitest";

import type { CountryModule, Partner } from "@/lib/country-modules";

import { ECU_MODULE, getPartnerFixture } from "@integration/fixtures/country-modules";

import CountryModulePartnerships from "./country-modules";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const ECU: CountryModule = {
  ...ECU_MODULE,
  id: "ecu",
  partnersDescription: "Line one\nLine two",
};
const BOL: CountryModule = {
  ...ECU_MODULE,
  id: "bol",
  slug: "BOL",
  country: "BOL",
  moduleName: "Bolivia",
};
const PERU: CountryModule = {
  ...ECU_MODULE,
  id: "per",
  slug: "PER",
  country: "PER",
  moduleName: "Peru",
};

const PARTNERS: Partner[] = [
  getPartnerFixture({
    id: "mae",
    name: "Ministerio del Ambiente",
    label: "MAE",
    moduleIds: ["ecu"],
  }),
  getPartnerFixture({ id: "igm", name: "IGM", label: "IGM", moduleIds: ["ecu"] }),
  getPartnerFixture({ id: "noc", name: "No caption", moduleIds: ["ecu"] }),
  getPartnerFixture({ id: "bolp", name: "Bolivia partner", label: "BP", moduleIds: ["bol"] }),
];

const mockModules = vi.fn<() => CountryModule[]>();
const mockPartners = vi.fn<() => Partner[]>();

vi.mock("@/lib/country-modules", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/country-modules")>()),
  useGetCountryModules: () => mockModules(),
  useGetPartners: () => mockPartners(),
}));

function renderBlock(searchParams = "", onUrlUpdate?: OnUrlUpdateFunction) {
  return render(
    <NuqsTestingAdapter searchParams={searchParams} onUrlUpdate={onUrlUpdate}>
      <CountryModulePartnerships />
    </NuqsTestingAdapter>,
  );
}

describe("CountryModulePartnerships", () => {
  beforeEach(() => {
    mockModules.mockReturnValue([ECU, BOL, PERU]);
    mockPartners.mockReturnValue(PARTNERS);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders nothing when the country-module flag is off", () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_FLAGS", "");

    renderBlock();

    expect(screen.queryByTestId("partners-country-modules")).toBeNull();
  });

  it("renders one tab per module with partners, in module order, first selected", () => {
    renderBlock();

    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "Ecuador Amazonia",
      "Bolivia",
    ]);
    expect(screen.getByTestId("partners-country-tab-ECU")).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByTestId("partners-country-tab-PER")).toBeNull();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "partners-country-modules-title",
    );
  });

  it("renders a card per module partner with the caption only when there is a label", () => {
    renderBlock();

    const cards = screen.getAllByTestId("partners-country-card");
    expect(cards.map((card) => card.textContent)).toEqual(["MAE", "IGM", ""]);
    expect(screen.getByAltText("Ministerio del Ambiente")).toBeInTheDocument();
  });

  it("renders the module description preserving line breaks", () => {
    renderBlock();

    expect(screen.getByText(/Line one/).textContent).toBe("Line one\nLine two");
  });

  it("renders no description when the module has none", () => {
    renderBlock("?country=BOL");

    expect(screen.queryByText(/Line one/)).toBeNull();
  });

  it("preselects the module from the query", () => {
    renderBlock("?country=BOL");

    expect(screen.getByTestId("partners-country-tab-BOL")).toHaveAttribute("aria-selected", "true");
  });

  it("falls back to the first tab for an unknown module", () => {
    renderBlock("?country=XXX");
    expect(screen.getByTestId("partners-country-tab-ECU")).toHaveAttribute("aria-selected", "true");
  });

  it("falls back to the first tab for a module without partners", () => {
    renderBlock("?country=PER");
    expect(screen.getByTestId("partners-country-tab-ECU")).toHaveAttribute("aria-selected", "true");
  });

  it("renders nothing when no module has partners", () => {
    mockPartners.mockReturnValue([]);

    renderBlock();

    expect(screen.queryByTestId("partners-country-modules")).toBeNull();
  });

  it("writes only the selected module slug to the query, replacing history", async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    renderBlock("", onUrlUpdate);

    const bolivia = screen.getByTestId("partners-country-tab-BOL");
    fireEvent.mouseDown(bolivia, { button: 0, ctrlKey: false });
    fireEvent.focus(bolivia);

    await vi.waitFor(() => expect(onUrlUpdate).toHaveBeenCalled());
    const update = onUrlUpdate.mock.calls[0][0];
    expect(update.searchParams.toString()).toBe("country=BOL");
    expect(update.options.history).toBe("replace");
    expect(bolivia).toHaveAttribute("aria-selected", "true");
  });
});
