import { render } from "@testing-library/react";
import { vi } from "vitest";

import { useGetOverviewTopics } from "@/lib/topics";

import ReportResultsContentOverview from "@/containers/results/content/overview";

vi.mock("next-intl", () => ({ useLocale: () => "en" }));

vi.mock("@/lib/topics", () => ({ useGetOverviewTopics: vi.fn() }));

const renderItem = vi.fn();
vi.mock("@/containers/results/content/item", () => ({
  default: (props: unknown) => {
    renderItem(props);
    return null;
  },
}));

const DEFAULT_VISUALIZATION = [
  { id: "0", indicator_id: 0, type: "numeric", x: 0, y: 0, w: 1, h: 1 },
  { id: "5", indicator_id: 5, type: "map", x: 0, y: 2, w: 2, h: 4 },
];

describe("ReportResultsContentOverview", () => {
  it("renders the overview topic's own default_visualization", () => {
    vi.mocked(useGetOverviewTopics).mockReturnValue({
      data: [{ id: 0, name: "Geographic context", default_visualization: DEFAULT_VISUALIZATION }],
    } as unknown as ReturnType<typeof useGetOverviewTopics>);

    render(<ReportResultsContentOverview />);

    expect(renderItem).toHaveBeenCalledTimes(1);
    expect(renderItem).toHaveBeenCalledWith(
      expect.objectContaining({
        editable: false,
        topic: expect.objectContaining({
          id: "0",
          topic_id: 0,
          // The widgets come from the topic itself. Subtopic 0 carries a byte-identical copy,
          // so reading it there worked by coincidence and silently diverged from the PDF's
          // geographic-context block, which has always read the topic.
          indicators: DEFAULT_VISUALIZATION,
        }),
      }),
    );
  });

  it("renders nothing while the topic is still loading", () => {
    vi.mocked(useGetOverviewTopics).mockReturnValue({
      data: undefined,
    } as unknown as ReturnType<typeof useGetOverviewTopics>);

    render(<ReportResultsContentOverview />);

    expect(renderItem).not.toHaveBeenCalled();
  });
});
