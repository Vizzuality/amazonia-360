import { FormProvider, useForm } from "react-hook-form";

import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";

import { ReportFormData } from "@/containers/results";

import { getTestReport } from "@integration/fixtures/report";
import { renderWithProviders } from "@integration/wrappers/render";

import TitleReport from "./title";

function TitleFormWrapper({ title, children }: { title: string; children: React.ReactNode }) {
  const report = getTestReport({ title });
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
    const { screen } = await renderWithProviders(
      <TitleFormWrapper title="Seeded Title">
        <TitleReport />
      </TitleFormWrapper>,
    );

    await expect.element(screen.getByRole("heading", { name: "Seeded Title" })).toBeVisible();
    await expect(screen).toHaveNoA11yViolations();
  });

  it("reverts to the original title without a server round trip when the edit is cancelled", async () => {
    const { screen } = await renderWithProviders(
      <TitleFormWrapper title="Keep This Title">
        <TitleReport />
      </TitleFormWrapper>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Edit" }));

    const titleInput = screen.getByRole("textbox");
    await userEvent.fill(titleInput, "Should Not Stick");

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await expect.element(screen.getByRole("heading", { name: "Keep This Title" })).toBeVisible();
    await expect.element(screen.getByRole("textbox")).not.toBeInTheDocument();
  });
});
