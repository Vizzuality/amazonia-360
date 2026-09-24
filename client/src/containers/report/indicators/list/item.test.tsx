import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { Indicator } from "@/types/indicator";

import { TooltipProvider } from "@/components/ui/tooltip";

import IndicatorsItem from "./item";

vi.mock("@/app/(frontend)/store", () => ({
  useSyncIndicators: () => [[], vi.fn()],
  useSyncIndicatorsSettings: () => [{}, vi.fn()],
}));

const indicator = (over: Partial<Indicator> & Pick<Indicator, "id" | "country">): Indicator =>
  ({
    name: "Demarcaciones hidrográficas",
    order: 0,
    visualization_types: ["map"],
    default_visualization_type: null,
    resource: { type: "component", name: "total-area" },
    ...over,
  }) as Indicator;

describe("IndicatorsItem", () => {
  it("badges a regional indicator", () => {
    render(
      <TooltipProvider>
        <IndicatorsItem {...indicator({ id: 1, country: null })} />
      </TooltipProvider>,
    );

    expect(screen.getByText("country-module-badge-regional")).toBeInTheDocument();
  });

  it("badges an Ecuador-scoped indicator", () => {
    render(
      <TooltipProvider>
        <IndicatorsItem {...indicator({ id: 2, country: "ECU" })} />
      </TooltipProvider>,
    );

    expect(screen.getByText("country-module-ECU-badge")).toBeInTheDocument();
  });

  // The badge renders inside the row's button. Left in the accessibility tree it makes the
  // control's name "REG Demarcaciones hidrográficas", which is how an existing e2e caught it.
  it("names the row button after the indicator, not the badge", () => {
    render(
      <TooltipProvider>
        <IndicatorsItem {...indicator({ id: 3, country: "ECU" })} />
      </TooltipProvider>,
    );

    expect(screen.getByRole("button", { name: "Demarcaciones hidrográficas" })).toBeInTheDocument();
  });
});
