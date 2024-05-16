import Header from "@/containers/header";

import { render, screen } from "@/jest.utils";

const mockUsePathname = jest.fn<string, unknown[]>();
jest.mock("next/navigation", () => ({
  usePathname() {
    return mockUsePathname();
  },
}));

describe("Header", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/");
  });

  it("renders Header component without crashing", () => {
    render(<Header />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("renders the title", () => {
    render(<Header />);
    expect(screen.getByText("Amazonia360")).toBeInTheDocument();
  });

  it("renders the logo", () => {
    render(<Header />);
    expect(screen.getByAltText("IDB")).toBeInTheDocument();
  });

  it("renders the badge", () => {
    render(<Header />);
    expect(screen.getByText("Prototype")).toBeInTheDocument();
  });

  // Selected
  it("renders the Home link selected", () => {
    const { container } = render(<Header />);
    expect(container).toMatchSnapshot();
  });

  it("renders the Report Tool link selected", () => {
    mockUsePathname.mockReturnValue("/report");
    const { container } = render(<Header />);
    expect(container).toMatchSnapshot();
  });

  it("renders the Hub link selected", () => {
    mockUsePathname.mockReturnValue("/hub");
    const { container } = render(<Header />);
    expect(container).toMatchSnapshot();
  });
});
