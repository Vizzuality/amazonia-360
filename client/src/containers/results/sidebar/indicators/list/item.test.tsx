import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { Indicator } from "@/types/indicator";

import { TooltipProvider } from "@/components/ui/tooltip";

import { IndicatorsItem } from "./item";

vi.mock("@/app/(frontend)/store", () => ({
  useFormTopics: () => ({ topics: [] }),
}));

const indicator = (over: Partial<Indicator> & Pick<Indicator, "id" | "module">): Indicator =>
  ({
    name: "Demarcaciones hidrográficas",
    order: 0,
    visualization_types: ["map"],
    default_visualization_type: null,
    resource: { type: "component", name: "total-area" },
    ...over,
  }) as Indicator;

const ECU_MODULE = { slug: "ECU", tag: "ECU" };

describe("IndicatorsItem", () => {
  it("badges a regional indicator", () => {
    render(
      <TooltipProvider>
        <IndicatorsItem topicId={1} indicator={indicator({ id: 1, module: null })} />
      </TooltipProvider>,
    );

    expect(screen.getByText("country-module-badge-regional")).toBeInTheDocument();
  });

  it("badges an Ecuador-scoped indicator", () => {
    render(
      <TooltipProvider>
        <IndicatorsItem topicId={1} indicator={indicator({ id: 2, module: ECU_MODULE })} />
      </TooltipProvider>,
    );

    expect(screen.getByText("ECU")).toBeInTheDocument();
  });
});
