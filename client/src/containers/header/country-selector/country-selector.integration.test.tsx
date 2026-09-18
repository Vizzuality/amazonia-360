import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";

import en from "@/i18n/translations/en.json";
import { renderWithProviders } from "@integration/wrappers/render";

import CountrySelector from "./desktop";

async function openPicker(screen: Awaited<ReturnType<typeof renderWithProviders>>["screen"]) {
  await userEvent.click(
    screen.getByRole("button", { name: new RegExp(en["country-module-selector-label"]) }),
  );
}

describe("CountrySelector", () => {
  it("renders without accessibility violations", async () => {
    const { screen } = await renderWithProviders(<CountrySelector />, {
      pathname: "/en/reports/grid",
    });

    await expect(screen).toHaveNoA11yViolations();
  });

  it("shows the Amazon Region as active when the URL carries no country code", async () => {
    const { screen } = await renderWithProviders(<CountrySelector />, {
      pathname: "/en/reports/grid",
    });

    expect(
      screen.getByRole("button", { name: new RegExp(en["country-module-amazon-region-name"]) }),
    ).toBeInTheDocument();
  });

  it("links the module option to the current path plus its code, keeping search params", async () => {
    const { screen } = await renderWithProviders(<CountrySelector />, {
      pathname: "/en/reports/grid",
      searchParams: new URLSearchParams("bbox=-70,-10,-60,0&ref=newsletter"),
    });

    await openPicker(screen);
    const link = screen.getByRole("link", { name: new RegExp(en["country-module-ECU-name"]) });

    await expect
      .element(link)
      .toHaveAttribute("href", "/en/ECU/reports/grid?bbox=-70%2C-10%2C-60%2C0&ref=newsletter");
  });

  it("links the Amazon Region back to the unprefixed path from inside a country", async () => {
    const { screen } = await renderWithProviders(<CountrySelector />, {
      pathname: "/en/ECU/reports/grid",
    });

    await openPicker(screen);
    const link = screen.getByRole("link", {
      name: new RegExp(en["country-module-amazon-region-name"]),
    });

    await expect.element(link).toHaveAttribute("href", "/en/reports/grid");
  });
});
