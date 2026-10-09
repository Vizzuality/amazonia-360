import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import type { Partner } from "@/lib/country-modules";

import { getPartnerFixture } from "@integration/fixtures/country-modules";

import OtherPartners from "./other";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const REGIONAL: Partner[] = [
  getPartnerFixture({ regional: true, id: "acto", name: "ACTO ARO" }),
  getPartnerFixture({ regional: true, id: "idb", name: "IDB Atlas" }),
  getPartnerFixture({ regional: true, id: "ddp", name: "Development Data Partnership" }),
  getPartnerFixture({ regional: true, id: "esri", name: "Esri" }),
  getPartnerFixture({ regional: true, id: "vizz", name: "Vizzuality" }),
  getPartnerFixture({ regional: true, id: "gcf", name: "Green Climate Fund", logoSize: "large" }),
  getPartnerFixture({ id: "mae", name: "MAE", moduleIds: ["ecu"] }),
];

const mockPartners = vi.fn<() => Partner[]>();

vi.mock("@/lib/country-modules", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/country-modules")>()),
  useGetPartners: () => mockPartners(),
}));

describe("OtherPartners", () => {
  beforeEach(() => {
    mockPartners.mockReturnValue(REGIONAL);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders the title and subtitle", () => {
    render(<OtherPartners />);

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("partners-other-title");
    expect(screen.getByText("partners-other-description")).toBeInTheDocument();
  });

  it("titles the block as the only partners when the country-module flag is off", () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_FLAGS", "");
    render(<OtherPartners />);

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("partners-regional-title");
    expect(screen.getByText("partners-other-description")).toBeInTheDocument();
  });

  it("renders only the regional partners in 1-2-2-1 rows", () => {
    render(<OtherPartners />);

    const rows = screen
      .getAllByRole("list")
      .map((list) =>
        Array.from(list.querySelectorAll("img")).map((img) => img.getAttribute("alt")),
      );
    expect(rows).toEqual([
      ["ACTO ARO"],
      ["IDB Atlas", "Development Data Partnership"],
      ["Esri", "Vizzuality"],
      ["Green Climate Fund"],
    ]);
  });

  it("renders nothing when there are no regional partners", () => {
    mockPartners.mockReturnValue([getPartnerFixture({ id: "mae", moduleIds: ["ecu"] })]);

    render(<OtherPartners />);

    expect(screen.queryByTestId("partners-other")).toBeNull();
  });

  it("sizes large logos from their data and leaves the others at the default", () => {
    render(<OtherPartners />);

    expect(screen.getByAltText("Green Climate Fund")).toHaveClass("h-[72px]");
    expect(screen.getByAltText("Esri")).toHaveClass("h-20");
    expect(screen.getByAltText("Esri")).not.toHaveClass("h-[72px]");
  });
});
