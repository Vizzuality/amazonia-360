import { describe, expect, it } from "vitest";

import { renderWithProviders } from "@integration/wrappers/render";

import CountryModulePartnerships from "./country-modules";
import OtherPartners from "./other";

describe("Partners page blocks", () => {
  it("country modules render without accessibility violations", async () => {
    const { screen } = await renderWithProviders(<CountryModulePartnerships />);

    await expect(screen).toHaveNoA11yViolations();
  });

  it("other partners render without accessibility violations", async () => {
    const { screen } = await renderWithProviders(<OtherPartners />);

    await expect(screen).toHaveNoA11yViolations();
  });
});
