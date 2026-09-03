import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { getTopicSummaryStamp } from "@/lib/ai";

import { Topic } from "@/types/topic";

import { Location, TopicView } from "@/app/(frontend)/parsers";

import { ReportResultsSummary } from "./summary";

const MANAUS: Location = { type: "search", key: "manaus", text: "Manaus", sourceIndex: 0 };
const BELEM: Location = { type: "search", key: "belem", text: "Belém", sourceIndex: 0 };

const TOPIC = { id: 1 } as Topic;

const mockTopics = vi.fn<() => TopicView[]>();
const mockLocation = vi.fn<() => Location | null>(() => MANAUS);

vi.mock("@/app/(frontend)/store", () => ({
  useFormTopics: vi.fn(() => ({ topics: mockTopics(), setTopics: vi.fn() })),
  useFormLocation: vi.fn(() => ({ location: mockLocation(), setLocation: vi.fn() })),
}));

// The MDX editor mounts even while hidden, and it is not what these tests are about.
vi.mock("@/components/ui/editor", () => ({
  ForwardRefEditor: () => <div data-testid="editor" />,
}));

// Reached through `lib/ai`, and both read the validated env at import time.
vi.mock("@/lib/indicators", () => ({
  getIndicators: vi.fn(),
  getQueryFeatureId: vi.fn(),
  getQueryImageryId: vi.fn(),
}));

vi.mock("@/types/generated/text-generation", () => ({
  generateDescriptionTextAiPost: vi.fn(),
}));

/** A topic whose summary was generated from `stampedIndicatorIds` over `stampedLocation`. */
const topicView = ({
  indicatorIds,
  stampedIndicatorIds = indicatorIds,
  stampedLocation = MANAUS,
  stamped = true,
}: {
  indicatorIds: number[];
  stampedIndicatorIds?: number[];
  stampedLocation?: Location;
  stamped?: boolean;
}): TopicView => ({
  id: "1",
  topic_id: 1,
  description: "Some prose about the area.",
  description_stamp: stamped
    ? getTopicSummaryStamp(stampedIndicatorIds, stampedLocation)
    : undefined,
  indicators: indicatorIds.map((indicator_id) => ({
    id: `${indicator_id}`,
    indicator_id,
    type: "numeric",
    x: 0,
    y: 0,
    w: 1,
    h: 1,
  })),
});

const outdatedNotice = () => screen.queryByText("report-results-sidebar-ai-summaries-outdated");

/** The header only passes `onRegenerate` to a session allowed to generate. */
const renderAsEditor = (onRegenerate = vi.fn()) =>
  render(<ReportResultsSummary topic={TOPIC} onRegenerate={onRegenerate} />);

describe("ReportResultsSummary — out of date notice", () => {
  beforeEach(() => {
    mockLocation.mockReturnValue(MANAUS);
  });

  test("stays quiet while the report matches the stamp", () => {
    mockTopics.mockReturnValue([topicView({ indicatorIds: [3, 5] })]);

    renderAsEditor();

    expect(outdatedNotice()).not.toBeInTheDocument();
  });

  test("shows up when an indicator is added to the topic", () => {
    mockTopics.mockReturnValue([
      topicView({ indicatorIds: [3, 5, 9], stampedIndicatorIds: [3, 5] }),
    ]);

    renderAsEditor();

    expect(outdatedNotice()).toBeInTheDocument();
  });

  test("shows up when the area is redrawn", () => {
    mockTopics.mockReturnValue([topicView({ indicatorIds: [3, 5], stampedLocation: BELEM })]);

    renderAsEditor();

    expect(outdatedNotice()).toBeInTheDocument();
  });

  test("stays quiet for a summary written before stamps existed", () => {
    mockTopics.mockReturnValue([topicView({ indicatorIds: [3, 5, 9], stamped: false })]);

    renderAsEditor();

    expect(outdatedNotice()).not.toBeInTheDocument();
  });

  test("stays hidden from a viewer who cannot regenerate", () => {
    mockTopics.mockReturnValue([
      topicView({ indicatorIds: [3, 5, 9], stampedIndicatorIds: [3, 5] }),
    ]);

    render(<ReportResultsSummary topic={TOPIC} />);

    expect(outdatedNotice()).not.toBeInTheDocument();
  });

  test("hands regeneration back to the caller instead of running it", () => {
    const onRegenerate = vi.fn();
    mockTopics.mockReturnValue([
      topicView({ indicatorIds: [3, 5, 9], stampedIndicatorIds: [3, 5] }),
    ]);

    renderAsEditor(onRegenerate);
    fireEvent.click(
      screen.getByRole("button", { name: "report-results-sidebar-ai-summaries-regenerate" }),
    );

    expect(onRegenerate).toHaveBeenCalledTimes(1);
  });

  test("leaves the prose alone — nothing regenerates on its own", () => {
    mockTopics.mockReturnValue([
      topicView({ indicatorIds: [3, 5, 9], stampedIndicatorIds: [3, 5] }),
    ]);

    renderAsEditor();

    expect(screen.getByText("Some prose about the area.")).toBeInTheDocument();
  });
});
