import { FormProvider, useForm } from "react-hook-form";

import { describe, expect, it } from "vitest";

import { ReportFormData } from "@/containers/results";

import { getTestQueryClientWithReport, getTestReport } from "@integration/fixtures/report";
import { getTestSession } from "@integration/fixtures/session";
import { renderWithProviders } from "@integration/wrappers/render";

import SaveReport from "./save";

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

async function renderSaveReportAs(viewerId: string) {
  const report = getTestReport({ user: { relationTo: "users", value: "owner-1" } });

  const { screen } = await renderWithProviders(
    <ReportFormWrapper>
      <SaveReport />
    </ReportFormWrapper>,
    {
      queryClient: getTestQueryClientWithReport(report),
      session: getTestSession({ id: viewerId }),
      params: { id: report.id },
    },
  );

  return screen;
}

describe("SaveReport", () => {
  it("shows Save, not Make a copy, for the report owner", async () => {
    const screen = await renderSaveReportAs("owner-1");

    await expect.element(screen.getByRole("button", { name: "Save" })).toBeVisible();
    await expect
      .element(screen.getByRole("button", { name: "Make a copy" }))
      .not.toBeInTheDocument();
    await expect(screen).toHaveNoA11yViolations();
  });

  it("shows Make a copy, not Save, for a signed-in user who does not own the report", async () => {
    const screen = await renderSaveReportAs("someone-else");

    await expect.element(screen.getByRole("button", { name: "Make a copy" })).toBeVisible();
    await expect.element(screen.getByRole("button", { name: "Save" })).not.toBeInTheDocument();
    await expect(screen).toHaveNoA11yViolations();
  });
});
