import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { VisualizationType } from "@/containers/results/sidebar/indicators/list/visualization-types";

vi.mock("@/env", () => ({ env: { VITE_URL: "http://localhost:3000" } }));

vi.mock("@/lib/url-state/store", () => ({
  useFormTopics: () => ({ topics: [], setTopics: vi.fn() }),
}));

const renderTypes = (defaultType: "map" | "table" | "chart" | "numeric" | null) =>
  render(
    <VisualizationType
      types={["map", "numeric"]}
      indicatorId={5}
      topicId={0}
      defaultType={defaultType}
    />,
  );

describe("VisualizationType", () => {
  it("badges the type the indicator declares as its default", () => {
    renderTypes("numeric");

    const badges = screen.getAllByText("default");
    expect(badges).toHaveLength(1);
    expect(badges[0].closest("button")).toHaveTextContent("numeric");
  });

  it("badges nothing when the indicator declares no default", () => {
    renderTypes(null);

    expect(screen.queryByText("default")).not.toBeInTheDocument();
  });

  it("badges nothing when the default is not among the offered types", () => {
    // Indicator 0 in the source data: default numeric, but only map is offered.
    render(<VisualizationType types={["map"]} indicatorId={0} topicId={0} defaultType="numeric" />);

    expect(screen.queryByText("default")).not.toBeInTheDocument();
  });
});
