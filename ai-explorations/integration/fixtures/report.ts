import { QueryClient } from "@tanstack/react-query";

import { reportQueryOptions } from "@/lib/report";

import type { Report } from "@/payload-types";

const DEFAULT_LOCATION: Report["location"] = {
  type: "point",
  geometry: { x: -7013128, y: -334111, spatialReference: { wkid: 102100 } },
  buffer: 60,
};

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

export function getTestQueryClientWithReport(report: Report): QueryClient {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  queryClient.setQueryData(reportQueryOptions({ id: report.id, locale: "en" }).queryKey, report);
  return queryClient;
}
