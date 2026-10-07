import { describe, expect, it } from "vitest";

import type { Partner } from "@/lib/country-modules";

import { ECU_MODULE, getPartnerFixture } from "@integration/fixtures/country-modules";
import { renderWithProviders } from "@integration/wrappers/render";

import CountryModulePartnerships from "./country-modules";
import PartnersHero from "./hero";
import OtherPartners from "./other";

const PARTNERS: Partner[] = [
  getPartnerFixture({
    id: "acto",
    name: "ACTO ARO",
    logo: "/partners/atco-en.avif",
    regional: true,
  }),
  getPartnerFixture({
    id: "mae",
    name: "Ministerio del Ambiente",
    label: "MAE",
    logo: "/partners/ecu/ministerio-del-ambiente.avif",
    moduleIds: [ECU_MODULE.id],
  }),
];

describe("Partners page blocks", () => {
  it("hero renders without accessibility violations", async () => {
    const { screen } = await renderWithProviders(<PartnersHero />);

    await expect.element(screen.getByTestId("partners-hero")).toBeVisible();
    await expect(screen).toHaveNoA11yViolations();
  });

  it("country modules render without accessibility violations", async () => {
    const { screen } = await renderWithProviders(<CountryModulePartnerships />, {
      partners: PARTNERS,
    });

    await expect.element(screen.getByTestId("partners-country-modules")).toBeVisible();
    await expect(screen).toHaveNoA11yViolations();
  });

  it("other partners render without accessibility violations", async () => {
    const { screen } = await renderWithProviders(<OtherPartners />, { partners: PARTNERS });

    await expect.element(screen.getByTestId("partners-other")).toBeVisible();
    await expect(screen).toHaveNoA11yViolations();
  });
});
