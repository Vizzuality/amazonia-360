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
});
