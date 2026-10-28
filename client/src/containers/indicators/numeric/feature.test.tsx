import { render, screen } from "@testing-library/react";

import { useQueryFeatureId } from "@/lib/indicators";

import { Indicator, ResourceFeature } from "@/types/indicator";

import { NumericIndicatorsFeature } from "@/containers/indicators/numeric/feature";

vi.mock("@/lib/indicators", () => ({ useQueryFeatureId: vi.fn() }));
vi.mock("@/lib/location", () => ({ useLocationGeometry: () => null }));
vi.mock("@/containers/indicators/provider", () => ({
  useIndicator: () => ({
    onIndicatorViewLoading: vi.fn(),
    onIndicatorViewLoaded: vi.fn(),
    onIndicatorViewError: vi.fn(),
  }),
}));

const answer = (values: (number | null)[]) =>
  vi.mocked(useQueryFeatureId).mockReturnValue({
    isFetching: false,
    isError: false,
    isSuccess: true,
    data: { features: values.map((value) => ({ attributes: { value } })) },
  } as unknown as ReturnType<typeof useQueryFeatureId>);

const indicator = {
  id: 1,
  unit: "protected areas",
  resource: {} as ResourceFeature,
} as unknown as Indicator & { resource: ResourceFeature };

describe("NumericIndicatorsFeature", () => {
  it("shows a count of nothing as 0, not as missing data", () => {
    answer([0]);

    render(<NumericIndicatorsFeature {...indicator} />);

    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.queryByTestId("card-state-no_coverage")).not.toBeInTheDocument();
  });

  it("shows an average over nothing as no data", () => {
    answer([null]);

    render(<NumericIndicatorsFeature {...indicator} />);

    expect(screen.getByTestId("card-state-no_coverage")).toBeInTheDocument();
  });

  it("shows no data when the read returns no rows", () => {
    answer([]);

    render(<NumericIndicatorsFeature {...indicator} />);

    expect(screen.getByTestId("card-state-no_coverage")).toBeInTheDocument();
  });
});
