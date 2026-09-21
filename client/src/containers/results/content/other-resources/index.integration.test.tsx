import { describe, expect, it, vi } from "vitest";

import { getTestQueryClientWithReport, getTestReport } from "@integration/fixtures/report";
import { renderWithProviders } from "@integration/wrappers/render";

import OtherResources from "./index";

vi.mock("@/lib/location", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/location")>();
  return {
    ...actual,
    useLocationGadm: () => ({ data: { gid0: ["BRA"] } }),
  };
});

vi.mock("@/lib/query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/query")>();
  return {
    ...actual,
    useGetFeatures: () => ({
      data: [
        {
          FID: 1,
          Country: "Brazil",
          CountryIso: "BRA",
          Type: "Publications",
          Name: "Amazon Report",
          Description: "A sample publication.",
          Department: "Research",
          OrgUnit: "Amazonia",
          Topic: "Biodiversity",
          Month: "January",
          Year: 2024,
          OperNum: "1",
          URL: "https://example.com",
          Author: "Jane Doe",
          Lat: 0,
          Long: 0,
        },
      ],
      isFetching: false,
      isFetched: true,
    }),
  };
});

describe("OtherResources", () => {
  it("renders the knowledge resources heading once features are loaded", async () => {
    const report = getTestReport();

    const { screen } = await renderWithProviders(<OtherResources />, {
      queryClient: getTestQueryClientWithReport(report),
      params: { id: report.id },
    });

    await expect
      .element(screen.getByRole("heading", { name: "Additional knowledge resources" }))
      .toBeVisible();
    await expect(screen).toHaveNoA11yViolations();
  });
});
