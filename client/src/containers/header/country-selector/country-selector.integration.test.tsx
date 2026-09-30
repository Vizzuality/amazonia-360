import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";

import { locationAtom } from "@/app/(frontend)/store";

import { renderWithProviders } from "@integration/wrappers/render";

import CountrySelector from "./index";

vi.mock("@/lib/location", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/location")>()),
  useLocationGeometryWithStatus: (location: unknown) => ({
    geometry: location ? { id: "area-geometry" } : null,
    isCalculating: false,
  }),
}));

vi.mock("@/lib/country/coverage", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/country/coverage")>()),
  useGetLiveCountryBoundaries: () => ({ data: [{ code: "ECU", geometry: { id: "ecu" } }] }),
  getCountryCoverageRatio: () => 0,
}));

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
      searchParams: new URLSearchParams("bbox=1,2,3,4&ref=newsletter"),
    });

    await userEvent.click(screen.getByTestId("country-selector-trigger"));
    const rows = screen.getByTestId("country-selector-option");

    await expect.element(rows.nth(0)).toHaveAttribute("data-country", "REGIONAL");
    await expect.element(rows.nth(1)).toHaveAttribute("data-country", "ECU");
    await expect
      .element(rows.nth(1))
      .toHaveAttribute("href", "/en/ECU/reports/grid?bbox=1%2C2%2C3%2C4&ref=newsletter");
  });

  it("links the Amazon Region back to the unprefixed path from inside a country", async () => {
    const { screen } = await renderWithProviders(<CountrySelector />, {
      pathname: "/en/ECU/reports/grid",
      searchParams: new URLSearchParams("bbox=1,2,3,4"),
    });

    await userEvent.click(screen.getByTestId("country-selector-trigger"));
    const rows = screen.getByTestId("country-selector-option");

    await expect
      .element(rows.nth(0))
      .toHaveAttribute("href", "/en/reports/grid?bbox=1%2C2%2C3%2C4");
  });

  it("renders a disabled country row without a link and keeps the open panel accessible", async () => {
    const { screen } = await renderWithProviders(<CountrySelector />, {
      pathname: "/en/reports/grid",
      initialAtoms: [[locationAtom, { type: "polygon" }]],
    });

    await userEvent.click(screen.getByTestId("country-selector-trigger"));
    const row = screen.getByTestId("country-selector-option").nth(1);

    await expect.element(row).toHaveAttribute("aria-disabled", "true");
    await expect.element(row).not.toHaveAttribute("href");
    await expect(screen).toHaveNoA11yViolations();
  });
});
