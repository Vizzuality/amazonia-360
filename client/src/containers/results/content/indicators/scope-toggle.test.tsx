import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { TooltipProvider } from "@/components/ui/tooltip";

import IndicatorScopeToggle from "./scope-toggle";

const renderToggle = (ui: React.ReactNode) => render(<TooltipProvider>{ui}</TooltipProvider>);

const mockIndicators = vi.fn();
const mockTopics = vi.fn();
const mockSetTopics = vi.fn();

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    `${key}:${JSON.stringify(values ?? {})}`,
  useLocale: () => "en",
}));

vi.mock("@/lib/indicators", () => ({
  useGetIndicators: () => ({ data: mockIndicators() }),
}));

vi.mock("@/lib/use-report-country", () => ({
  useReportCountry: () => ["ECU"],
}));

vi.mock("@/app/(frontend)/store", () => ({
  useFormTopics: () => ({ topics: mockTopics(), setTopics: mockSetTopics }),
}));

const ECU_REPLACING_REGIONAL = [
  { id: 216, name: "Protected Areas (Ecuador module)", replaces: { id: "11" } },
  { id: 11, name: "Protected Areas" },
];

const TOPIC_WITH_THE_ECU_WIDGET = [
  { topic_id: 1, indicators: [{ indicator_id: 216, type: "map" }] },
];

beforeEach(() => {
  mockIndicators.mockReturnValue(ECU_REPLACING_REGIONAL);
  mockTopics.mockReturnValue(TOPIC_WITH_THE_ECU_WIDGET);
  mockSetTopics.mockClear();
});

describe("IndicatorScopeToggle", () => {
  test("offers the indicator its module replaced", () => {
    renderToggle(<IndicatorScopeToggle indicatorId={216} topicId={1} type="map" />);

    expect(screen.getByRole("button")).toHaveAccessibleName(/Protected Areas/);
    expect(screen.getByRole("button")).toBeEnabled();
  });

  test("renders nothing for an indicator with no counterpart", () => {
    const { container } = render(<IndicatorScopeToggle indicatorId={999} topicId={1} type="map" />);

    expect(container).toBeEmptyDOMElement();
  });

  test("swapping rewrites only the matching widget's indicator id", async () => {
    mockTopics.mockReturnValue([
      {
        topic_id: 1,
        indicators: [
          { indicator_id: 216, type: "map" },
          { indicator_id: 216, type: "chart" },
        ],
      },
      { topic_id: 2, indicators: [{ indicator_id: 216, type: "map" }] },
    ]);

    renderToggle(<IndicatorScopeToggle indicatorId={216} topicId={1} type="map" />);
    await userEvent.click(screen.getByRole("button"));

    const next = mockSetTopics.mock.calls[0][0](mockTopics());
    expect(next[0].indicators).toEqual([
      { indicator_id: 11, type: "map" },
      { indicator_id: 216, type: "chart" },
    ]);
    expect(next[1].indicators).toEqual([{ indicator_id: 216, type: "map" }]);
  });

  test("is disabled when the counterpart already occupies that slot in the topic", () => {
    mockTopics.mockReturnValue([
      {
        topic_id: 1,
        indicators: [
          { indicator_id: 216, type: "map" },
          { indicator_id: 11, type: "map" },
        ],
      },
    ]);

    renderToggle(<IndicatorScopeToggle indicatorId={216} topicId={1} type="map" />);

    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByRole("button")).toHaveAccessibleName(/scope-toggle-taken/);
  });
});
