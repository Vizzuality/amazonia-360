import WidgetPopulation from "@/containers/widgets/overview/population";

import { mockUseGetRasterAnalysis } from "@/jest.setup";
import { render, screen } from "@/jest.utils";

describe("WidgetPopulation", () => {
  beforeEach(() => {
    mockUseGetRasterAnalysis.mockReturnValue({
      data: 100000,
      isFetching: false,
      isFetched: true,
    });
  });

  test("renders WidgetPopulation component without crashing", async () => {
    const { container } = render(<WidgetPopulation />);
    expect(container).toMatchSnapshot();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByText("Population")).toBeInTheDocument();
    expect(screen.getByText("inhabitants")).toBeInTheDocument();
    expect(screen.getByText("100,000")).toBeInTheDocument();
  });

  test("renders WidgetPopulation component with loading state", async () => {
    mockUseGetRasterAnalysis.mockReturnValue({
      data: undefined,
      isFetching: true,
      isFetched: false,
    });

    const { container } = render(<WidgetPopulation />);
    expect(container).toMatchSnapshot();
    expect(screen.getByTestId("card-loader")).toBeInTheDocument();
  });
});
