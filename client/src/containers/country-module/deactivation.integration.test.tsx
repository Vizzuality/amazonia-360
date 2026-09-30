import { describe, expect, it } from "vitest";

import { renderWithProviders } from "@integration/wrappers/render";

import CountryModuleDeactivation from "./deactivation";
import { countryModuleDeactivatedAtom } from "./store";

describe("CountryModuleDeactivation", () => {
  it("renders the deactivated modal without accessibility violations", async () => {
    const { screen } = await renderWithProviders(<CountryModuleDeactivation />, {
      pathname: "/en/reports",
      initialAtoms: [[countryModuleDeactivatedAtom, "ECU"]],
    });

    await expect.element(screen.getByTestId("country-module-deactivated-dialog")).toBeVisible();
    await expect(screen).toHaveNoA11yViolations();
  });

  it("renders nothing while no module was deactivated", async () => {
    const { screen } = await renderWithProviders(<CountryModuleDeactivation />, {
      pathname: "/en/reports",
    });

    await expect
      .element(screen.getByTestId("country-module-deactivated-dialog"))
      .not.toBeInTheDocument();
  });
});
