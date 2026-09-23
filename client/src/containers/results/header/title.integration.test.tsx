import { FormProvider, useForm } from "react-hook-form";

import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";

import { ReportFormData } from "@/containers/results";

import { Report } from "@/payload-types";
import { getTestQueryClientWithReport, getTestReport } from "@integration/fixtures/report";
import { renderWithProviders } from "@integration/wrappers/render";

import TitleReport from "./title";

function TitleFormWrapper({ report, children }: { report: Report; children: React.ReactNode }) {
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

describe("TitleReport", () => {
  it("renders the title the form holds", async () => {
    const report = getTestReport({ title: "Seeded Title" });
    const { screen } = await renderWithProviders(
      <TitleFormWrapper report={report}>
        <TitleReport />
      </TitleFormWrapper>,
      { queryClient: getTestQueryClientWithReport(report), params: { id: report.id } },
    );

    await expect.element(screen.getByRole("heading", { name: "Seeded Title" })).toBeVisible();
    await expect(screen).toHaveNoA11yViolations();
  });

  it("reverts to the original title without a server round trip when the edit is cancelled", async () => {
    const report = getTestReport({ title: "Keep This Title" });
    const { screen } = await renderWithProviders(
      <TitleFormWrapper report={report}>
        <TitleReport />
      </TitleFormWrapper>,
      { queryClient: getTestQueryClientWithReport(report), params: { id: report.id } },
    );

    await userEvent.click(screen.getByRole("button", { name: "Edit" }));

    const titleInput = screen.getByRole("textbox");
    await userEvent.fill(titleInput, "Should Not Stick");

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await expect.element(screen.getByRole("heading", { name: "Keep This Title" })).toBeVisible();
    await expect.element(screen.getByRole("textbox")).not.toBeInTheDocument();
  });
});
