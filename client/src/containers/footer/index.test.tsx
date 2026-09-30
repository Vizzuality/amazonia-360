import { render, screen } from "@testing-library/react";

import Footer from "./index";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/containers/disclaimers/data", () => ({
  default: () => <div data-testid="data-disclaimer" />,
}));

describe("Footer", () => {
  it("shows the data disclaimer by default", () => {
    render(<Footer />);

    expect(screen.getByTestId("data-disclaimer")).toBeInTheDocument();
  });

  it("leaves the data disclaimer out when asked to", () => {
    render(<Footer showDisclaimer={false} />);

    expect(screen.queryByTestId("data-disclaimer")).not.toBeInTheDocument();
    expect(screen.getByText("terms-and-conditions")).toBeInTheDocument();
  });
});
