import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";

import { renderWithProviders } from "@integration/wrappers/render";

import CountrySelector from "./index";

describe("CountrySelector", () => {
  it("renders without accessibility violations", async () => {
    const { screen } = await renderWithProviders(<CountrySelector />, {
      pathname: "/en/reports/grid",
    });

    await expect(screen).toHaveNoA11yViolations();
  });

  it("renders the open panel without accessibility violations", async () => {
    const { screen } = await renderWithProviders(<CountrySelector />, {
      pathname: "/en/reports/grid",
    });

    await userEvent.click(screen.getByTestId("country-selector-trigger"));
    await expect.element(screen.getByRole("dialog")).toBeVisible();

    await expect(screen).toHaveNoA11yViolations();
  });

  it("links Ecuador to the current path under its code, keeping the query", async () => {
    const { screen } = await renderWithProviders(<CountrySelector />, {
      pathname: "/en/reports/grid",
      searchParams: new URLSearchParams("location=abc&ref=newsletter"),
    });

    await userEvent.click(screen.getByTestId("country-selector-trigger"));
    const rows = screen.getByTestId("country-selector-option");

    await expect.element(rows.nth(0)).toHaveAttribute("data-country", "REGIONAL");
    await expect.element(rows.nth(1)).toHaveAttribute("data-country", "ECU");
    await expect
      .element(rows.nth(1))
      .toHaveAttribute("href", "/en/ECU/reports/grid?location=abc&ref=newsletter");
  });

  it("links the Amazon Region back to the unprefixed path from inside a country", async () => {
    const { screen } = await renderWithProviders(<CountrySelector />, {
      pathname: "/en/ECU/reports/grid",
      searchParams: new URLSearchParams("location=abc"),
    });

    await userEvent.click(screen.getByTestId("country-selector-trigger"));
    const rows = screen.getByTestId("country-selector-option");

    await expect.element(rows.nth(0)).toHaveAttribute("href", "/en/reports/grid?location=abc");
  });
});
