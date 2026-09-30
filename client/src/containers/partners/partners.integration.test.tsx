import { describe, expect, it } from "vitest";

import { renderWithProviders } from "@integration/wrappers/render";

import CountryModulePartnerships from "./country-modules";
import PartnersHero from "./hero";
import OtherPartners from "./other";

describe("Partners page blocks", () => {
  it("hero renders without accessibility violations", async () => {
    const { screen } = await renderWithProviders(<PartnersHero />);

    await expect.element(screen.getByTestId("partners-hero")).toBeVisible();
    await expect(screen).toHaveNoA11yViolations();
  });

  it("country modules render without accessibility violations", async () => {
    const { screen } = await renderWithProviders(<CountryModulePartnerships />);

    await expect.element(screen.getByTestId("partners-country-modules")).toBeVisible();
    await expect(screen).toHaveNoA11yViolations();
  });

  it("other partners render without accessibility violations", async () => {
    const { screen } = await renderWithProviders(<OtherPartners />);

    await expect.element(screen.getByTestId("partners-other")).toBeVisible();
    await expect(screen).toHaveNoA11yViolations();
  });
});
