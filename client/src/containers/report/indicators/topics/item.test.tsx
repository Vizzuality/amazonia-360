import { render, screen } from "@testing-library/react";
import { atom } from "jotai";
import { vi } from "vitest";

import { Topic } from "@/types/topic";

import TopicsItem from "./item";

const mockUseSyncIndicators = vi.fn();

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string, values?: { count: number }) =>
    values ? `${key}:${values.count}` : key,
}));

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <span role="img" aria-label={alt} />,
}));

vi.mock("@/lib/hooks", () => ({ useScrollOnExpand: () => ({ current: null }) }));

vi.mock("@/lib/indicators", () => ({
  useGetDefaultIndicators: () => ({ data: [{ id: 1 }, { id: 2 }, { id: 3 }] }),
}));

vi.mock("@/app/(frontend)/store", () => ({
  indicatorsExpandAtom: atom({}),
  useSyncIndicators: () => mockUseSyncIndicators(),
}));

vi.mock("@/containers/report/indicators/subtopics", () => ({ default: () => null }));

const topic = { id: 7, name: "Territory", image: "/x.png" } as Topic;

describe("TopicsItem selected count", () => {
  it("shows 0 when none of the topic's indicators are selected", () => {
    mockUseSyncIndicators.mockReturnValue([[99], vi.fn()]);

    render(<TopicsItem {...topic} />);

    expect(screen.getByText("grid-sidebar-indicators-topic-selected-count:0")).toBeInTheDocument();
    expect(screen.getByText("0")).toHaveAttribute("aria-hidden", "true");
  });

  it("counts only the selected indicators that belong to the topic", () => {
    mockUseSyncIndicators.mockReturnValue([[1, 3, 99], vi.fn()]);

    render(<TopicsItem {...topic} />);

    expect(screen.getByText("grid-sidebar-indicators-topic-selected-count:2")).toHaveClass(
      "sr-only",
    );
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows 0 when no indicators are in the URL", () => {
    mockUseSyncIndicators.mockReturnValue([null, vi.fn()]);

    render(<TopicsItem {...topic} />);

    expect(screen.getByText("grid-sidebar-indicators-topic-selected-count:0")).toBeInTheDocument();
  });
});
