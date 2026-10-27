import { FormProvider, useForm } from "react-hook-form";

import { describe, expect, it } from "vitest";

import type { Topic } from "@/types/topic";

import { ReportFormData } from "@/containers/results";

import { getTestReport } from "@integration/fixtures/report";
import { renderWithProviders } from "@integration/wrappers/render";

import { ReportResultsSummary } from "./summary";

declare global {
  interface Window {
    __xss?: number;
  }
}

const TOPIC = { id: 1 } as Topic;
const DESCRIPTION = 'Summary <audio src="x" onerror="window.__xss=1"></audio>';

function ReportFormWrapper({ children }: { children: React.ReactNode }) {
  const report = getTestReport({ topics: [{ topic_id: TOPIC.id, description: DESCRIPTION }] });
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

async function renderSummary(editing: boolean) {
  delete window.__xss;
  await import("@/components/ui/editor/editor");
  const { screen } = await renderWithProviders(
    <ReportFormWrapper>
      <ReportResultsSummary topic={TOPIC} editing={editing} />
    </ReportFormWrapper>,
  );
  return screen;
}

async function waitForMediaErrors() {
  await new Promise((resolve) => setTimeout(resolve, 300));
}

describe("ReportResultsSummary", () => {
  it("does not run event handlers from the stored summary for a viewer", async () => {
    const screen = await renderSummary(false);

    await expect.element(screen.getByText("Summary")).toBeVisible();
    await waitForMediaErrors();

    expect(document.querySelector("[contenteditable]")).toBeNull();
    expect(document.querySelector("[onerror]")).toBeNull();
    expect(window.__xss).toBeUndefined();
  });

  it("does not run event handlers from the stored summary in the editor", async () => {
    const screen = await renderSummary(true);

    await expect.element(screen.getByRole("textbox")).toBeVisible();
    await waitForMediaErrors();

    expect(document.querySelector("[onerror]")).toBeNull();
    expect(window.__xss).toBeUndefined();
  });
});
