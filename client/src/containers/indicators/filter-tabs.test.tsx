import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { Indicator } from "@/types/indicator";

import {
  getFilteredIndicators,
  getIndicatorScopeCounts,
  IndicatorsFilterTabs,
} from "./filter-tabs";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${values.count}` : key,
  useLocale: () => "en",
}));

describe("getIndicatorScopeCounts", () => {
  it("splits national from regional indicators", () => {
    const indicators: Pick<Indicator, "country">[] = [
      { country: null },
      { country: "ECU" },
      { country: null },
    ];

    expect(getIndicatorScopeCounts(indicators)).toEqual({ all: 3, regional: 2, national: 1 });
  });
});

describe("getFilteredIndicators", () => {
  const indicators: Pick<Indicator, "country" | "id">[] = [
    { country: null, id: 1 },
    { country: "ECU", id: 2 },
  ];

  it("returns everything for all", () => {
    expect(getFilteredIndicators(indicators, "all")).toEqual(indicators);
  });

  it("keeps only regional indicators", () => {
    expect(getFilteredIndicators(indicators, "regional")).toEqual([indicators[0]]);
  });

  it("keeps only national indicators", () => {
    expect(getFilteredIndicators(indicators, "national")).toEqual([indicators[1]]);
  });
});

describe("IndicatorsFilterTabs", () => {
  it("shows the computed count per tab and reports the tab clicked", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <IndicatorsFilterTabs
        value="all"
        onValueChange={onValueChange}
        counts={{ all: 185, regional: 164, national: 21 }}
      />,
    );

    expect(screen.getByText("country-module-filter-all:185")).toBeInTheDocument();
    expect(screen.getByText("country-module-filter-regional:164")).toBeInTheDocument();
    expect(screen.getByText("country-module-filter-national:21")).toBeInTheDocument();

    await user.click(screen.getByText("country-module-filter-national:21"));
    expect(onValueChange).toHaveBeenCalledWith("national");
  });
});
