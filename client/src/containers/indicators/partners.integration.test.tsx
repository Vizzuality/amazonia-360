import { describe, expect, it } from "vitest";

import type { Partner } from "@/lib/country-modules";

import { ECU_MODULE, getPartnerFixture } from "@integration/fixtures/country-modules";
import { renderWithProviders } from "@integration/wrappers/render";

import IndicatorsPartners from "./partners";

const PARTNERS: Partner[] = [
  getPartnerFixture({ id: "vizz", name: "Vizzuality", regional: true }),
  getPartnerFixture({ id: "gob", name: "Gobierno del Ecuador", moduleIds: [ECU_MODULE.id] }),
];

describe("IndicatorsPartners", () => {
  it("renders the regional partner logos without accessibility violations", async () => {
    const { screen } = await renderWithProviders(<IndicatorsPartners country={null} />, {
      partners: PARTNERS,
    });

    await expect.element(screen.getByAltText("Vizzuality")).toBeVisible();
    await expect.element(screen.getByAltText("Gobierno del Ecuador")).not.toBeInTheDocument();
    const cta = screen.getByTestId("indicators-partners-learn-more");
    await expect.element(cta).toHaveAttribute("href", expect.stringMatching(/\/partners$/));
    await expect.element(cta).toHaveAttribute("target", "_blank");
    await expect.element(cta).toHaveAttribute("rel", "noopener noreferrer");
    await expect(screen).toHaveNoA11yViolations();
  });

  it("renders the Ecuador partner logos without accessibility violations", async () => {
    const { screen } = await renderWithProviders(<IndicatorsPartners country="ECU" />, {
      partners: PARTNERS,
    });

    await expect.element(screen.getByAltText("Gobierno del Ecuador")).toBeVisible();
    await expect.element(screen.getByAltText("Vizzuality")).not.toBeInTheDocument();
    const cta = screen.getByTestId("indicators-partners-learn-more");
    await expect
      .element(cta)
      .toHaveAttribute("href", expect.stringMatching(/\/partners\?country=ECU$/));
    await expect.element(cta).toHaveAttribute("target", "_blank");
    await expect.element(cta).toHaveAttribute("rel", "noopener noreferrer");
    await expect(screen).toHaveNoA11yViolations();
  });
});
