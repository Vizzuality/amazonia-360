import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";

import { locationAtom } from "@/app/(frontend)/store";

import { renderWithProviders } from "@integration/wrappers/render";

import { ConfirmDialog } from "./confirm-dialog";

vi.mock("@/lib/report/use-report-country", () => ({ useReportCountry: () => ["ECU"] }));

vi.mock("@/lib/location", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/location")>()),
  useLocationGeometryWithStatus: (location: unknown) => ({
    geometry: location ? { id: "area-geometry" } : null,
    isCalculating: false,
  }),
}));

vi.mock("@/lib/country/coverage", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/country/coverage")>()),
  useGetCountryAmazoniaBoundary: () => ({ data: { id: "ecu" } }),
  getCountryCoverageRatio: () => 0,
}));

describe("ConfirmDialog", () => {
  it("shows the outside-module bullet for an area outside the report module and has no accessibility violations", async () => {
    const { screen } = await renderWithProviders(<ConfirmDialog onConfirm={() => {}} />, {
      pathname: "/en/reports/test-report-1",
      initialAtoms: [[locationAtom, { type: "polygon" }]],
    });

    await userEvent.click(screen.getByRole("button"));

    await expect.element(screen.getByRole("alertdialog")).toBeVisible();
    await expect
      .element(screen.getByRole("listitem").nth(2))
      .toHaveTextContent(
        "Your new area is outside Ecuador, so the national indicators in this report won't have data for it.",
      );
    await expect({
      baseElement: screen.getByRole("alertdialog").element(),
    }).toHaveNoA11yViolations();
  });
});
