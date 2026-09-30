import { describe, expect, it } from "vitest";

import { renderWithProviders } from "@integration/wrappers/render";

import IndicatorsPartners from "./partners";

describe("IndicatorsPartners", () => {
  it("renders the regional partner logos without accessibility violations", async () => {
    const { screen } = await renderWithProviders(<IndicatorsPartners country={null} />);

    await expect.element(screen.getByAltText("Vizzuality")).toBeVisible();
    await expect.element(screen.getByAltText("Gobierno del Ecuador")).not.toBeInTheDocument();
    const cta = screen.getByTestId("indicators-partners-learn-more");
    await expect.element(cta).toHaveAttribute("href", expect.stringMatching(/\/partners$/));
    await expect.element(cta).toHaveAttribute("target", "_blank");
    await expect(screen).toHaveNoA11yViolations();
  });

  it("renders the Ecuador partner logos without accessibility violations", async () => {
    const { screen } = await renderWithProviders(<IndicatorsPartners country="ECU" />);

    await expect.element(screen.getByAltText("Gobierno del Ecuador")).toBeVisible();
    await expect.element(screen.getByAltText("Vizzuality")).not.toBeInTheDocument();
    await expect(screen).toHaveNoA11yViolations();
  });
});
