import type { Report } from "@/payload-types";

const DEFAULT_LOCATION: Report["location"] = {
  type: "point",
  geometry: { x: -7013128, y: -334111, spatialReference: { wkid: 102100 } },
  buffer: 60,
};

/**
 * Builds a `reports` collection document for seeding a query client, mirroring the
 * shape `queryClient.setQueryData` receives from the real `/reports/[id]` route loader.
 *
 * @param overrides - Report fields to replace on the default fixture.
 * @returns A complete `Report` document.
 */
export function getTestReport(overrides: Partial<Report> = {}): Report {
  const now = new Date().toISOString();

  return {
    id: "test-report-1",
    title: "Test Report",
    description: null,
    user: { relationTo: "users", value: "test-user-1" },
    location: DEFAULT_LOCATION,
    topics: [],
    updatedAt: now,
    createdAt: now,
    _status: "published",
    ...overrides,
  };
}
