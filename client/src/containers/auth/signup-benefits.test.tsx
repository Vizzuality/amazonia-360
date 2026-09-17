import { render, screen } from "@testing-library/react";

import { SignupBenefits } from "./signup-benefits";

describe("SignupBenefits", () => {
  it("renders the benefits title", () => {
    render(<SignupBenefits />);

    expect(screen.getByText("auth-signup-benefits-title")).toBeInTheDocument();
  });

  it("renders the three benefit strings in order", () => {
    render(<SignupBenefits />);

    const items = screen.getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "auth-signup-benefit-reports",
      "auth-signup-benefit-summaries",
      "auth-signup-benefit-community",
    ]);
  });

  it("renders each benefit's check icon as decorative", () => {
    render(<SignupBenefits />);

    const items = screen.getAllByRole("listitem");
    items.forEach((item) => {
      expect(item.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    });
  });
});
