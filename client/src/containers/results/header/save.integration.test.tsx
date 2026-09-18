import { FormProvider, useForm } from "react-hook-form";

import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import { reportQueryOptions } from "@/lib/report";

import { ReportFormData } from "@/containers/results";

import { getTestReport } from "@integration/fixtures/report";
import { getTestSession } from "@integration/fixtures/session";
import { renderWithProviders } from "@integration/wrappers/render";

import SaveReport from "./save";

function getQueryClientWithReport(report: ReturnType<typeof getTestReport>) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  queryClient.setQueryData(reportQueryOptions({ id: report.id, locale: "en" }).queryKey, report);
  return queryClient;
}

function ReportFormWrapper({ children }: { children: React.ReactNode }) {
  const report = getTestReport();
  const methods = useForm<ReportFormData>({
    values: {
      title: report.title,
      description: report.description,
      topics: report.topics,
      location: report.location,
    },
  });

  return <FormProvider {...methods}>{children}</FormProvider>;
}

describe("SaveReport", () => {
  it("shows Save, not Make a copy, for the report owner", async () => {
    const report = getTestReport({ user: { relationTo: "users", value: "owner-1" } });
    const session = getTestSession({ id: "owner-1" });

    const { screen } = await renderWithProviders(
      <ReportFormWrapper>
        <SaveReport />
      </ReportFormWrapper>,
      {
        queryClient: getQueryClientWithReport(report),
        session,
        params: { id: report.id },
      },
    );

    await expect.element(screen.getByRole("button", { name: "Save" })).toBeVisible();
    await expect
      .element(screen.getByRole("button", { name: "Make a copy" }))
      .not.toBeInTheDocument();
    await expect(screen).toHaveNoA11yViolations();
  });

  it("shows Make a copy, not Save, for a signed-in user who does not own the report", async () => {
    const report = getTestReport({ user: { relationTo: "users", value: "owner-1" } });
    const session = getTestSession({ id: "someone-else" });

    const { screen } = await renderWithProviders(
      <ReportFormWrapper>
        <SaveReport />
      </ReportFormWrapper>,
      {
        queryClient: getQueryClientWithReport(report),
        session,
        params: { id: report.id },
      },
    );

    await expect.element(screen.getByRole("button", { name: "Make a copy" })).toBeVisible();
    await expect.element(screen.getByRole("button", { name: "Save" })).not.toBeInTheDocument();
    await expect(screen).toHaveNoA11yViolations();
  });
});
