import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { getIndicatorInfoTooltipClassName, IndicatorInfoTooltipBody } from "./info-tooltip";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const PARTNERS = [
  { id: "p1", name: "MAE" },
  { id: "p2", name: "Esri" },
];

describe("IndicatorInfoTooltipBody", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_FLAGS", "country-module");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders the description", () => {
    render(<IndicatorInfoTooltipBody description="About the data" partners={[]} />);

    expect(screen.getByText("About the data")).toBeInTheDocument();
  });

  it("lists the partners in order under the partners label", () => {
    render(<IndicatorInfoTooltipBody description="About the data" partners={PARTNERS} />);

    expect(screen.getByText("indicator-partners")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "MAE",
      "Esri",
    ]);
  });

  it("renders neither label nor list without partners", () => {
    render(<IndicatorInfoTooltipBody description="About the data" partners={[]} />);

    expect(screen.queryByText("indicator-partners")).not.toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("renders only the description, even with partners, while the country-module flag is off", () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_FLAGS", "");
    render(<IndicatorInfoTooltipBody description="About the data" partners={PARTNERS} />);

    expect(screen.getByText("About the data")).toBeInTheDocument();
    expect(screen.queryByText("indicator-partners")).not.toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});

describe("getIndicatorInfoTooltipClassName", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the padded wide layout with the country-module flag on", () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_FLAGS", "country-module");

    expect(getIndicatorInfoTooltipClassName()).toBe("max-w-[300px] p-3");
  });

  it("returns the legacy width with the country-module flag off", () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_FLAGS", "");

    expect(getIndicatorInfoTooltipClassName()).toBe("max-w-72");
  });
});
