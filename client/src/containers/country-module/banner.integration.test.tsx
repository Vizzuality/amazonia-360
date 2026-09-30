import { describe, expect, it } from "vitest";

import { renderWithProviders } from "@integration/wrappers/render";

import CountryModuleBanner from "./banner";

describe("CountryModuleBanner", () => {
  it("renders the strip on a country path with the exit href and no accessibility violations", async () => {
    const { screen } = await renderWithProviders(<CountryModuleBanner />, {
      pathname: "/en/ECU/reports",
      searchParams: new URLSearchParams("bbox=1,2,3,4&indicators=5"),
    });

    await expect.element(screen.getByTestId("country-module-banner")).toBeVisible();
    await expect
      .element(screen.getByTestId("country-module-exit"))
      .toHaveAttribute("href", expect.stringContaining("/en/reports"));
    const href = screen.getByTestId("country-module-exit").element().getAttribute("href") ?? "";
    const params = new URL(href, "http://x").searchParams;
    expect(params.get("bbox")).toBe("1,2,3,4");
    expect(params.get("indicators")).toBe("5");
    await expect(screen).toHaveNoA11yViolations();
  });
});
