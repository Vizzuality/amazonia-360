import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import OtherPartners from "./other";

const mockUseLocale = vi.fn();

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => mockUseLocale(),
}));

describe("OtherPartners", () => {
  beforeEach(() => {
    mockUseLocale.mockReturnValue("en");
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

  it("renders the six logos in the four design rows", () => {
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

  it("uses the locale variant of the ACTO logo", () => {
    mockUseLocale.mockReturnValue("pt");

    render(<OtherPartners />);

    expect(decodeURIComponent(screen.getByAltText("ACTO ARO").getAttribute("src") ?? "")).toContain(
      "atco-pt",
    );
  });
});
