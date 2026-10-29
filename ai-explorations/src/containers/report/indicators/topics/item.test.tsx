import { render, screen } from "@testing-library/react";
import { atom } from "jotai";
import { describe, expect, it, vi } from "vitest";

import { Topic } from "@/types/topic";

import TopicsItem from "./item";

const mockUseSyncIndicators = vi.fn();

vi.mock("use-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string, values?: { count: number }) =>
    values ? `${key}:${values.count}` : key,
}));

vi.mock("@/components/image", () => ({
  default: ({ alt }: { alt: string }) => <span role="img" aria-label={alt} />,
}));

vi.mock("@/lib/hooks", () => ({ useScrollOnExpand: () => ({ current: null }) }));

vi.mock("@/lib/indicators", () => ({
  useGetDefaultIndicators: () => ({ data: [{ id: 1 }, { id: 2 }, { id: 3 }] }),
}));

vi.mock("@/lib/url-state/store", () => ({
  indicatorsExpandAtom: atom({}),
  useSyncIndicators: () => mockUseSyncIndicators(),
}));

vi.mock("@/containers/report/indicators/subtopics", () => ({ default: () => null }));

const topic = { id: 7, name: "Territory", image: "/x.png" } as Topic;

describe("TopicsItem selected count", () => {
  it("hides the count when none of the topic's indicators are selected", () => {
    mockUseSyncIndicators.mockReturnValue([[99], vi.fn()]);

    render(<TopicsItem {...topic} />);

    expect(
      screen.queryByText(/grid-sidebar-indicators-topic-selected-count/),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("counts only the selected indicators that belong to the topic", () => {
    mockUseSyncIndicators.mockReturnValue([[1, 3, 99], vi.fn()]);

    render(<TopicsItem {...topic} />);

    expect(screen.getByText("grid-sidebar-indicators-topic-selected-count:2")).toHaveClass(
      "sr-only",
    );
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("hides the count when no indicators are in the URL", () => {
    mockUseSyncIndicators.mockReturnValue([null, vi.fn()]);

    render(<TopicsItem {...topic} />);

    expect(
      screen.queryByText(/grid-sidebar-indicators-topic-selected-count/),
    ).not.toBeInTheDocument();
  });
});
