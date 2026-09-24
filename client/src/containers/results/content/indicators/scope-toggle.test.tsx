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

vi.mock("@/lib/report/use-report-country", () => ({
  useReportCountry: () => ["ECU"],
}));

vi.mock("@/app/(frontend)/store", () => ({
  useFormTopics: () => ({ topics: mockTopics(), setTopics: mockSetTopics }),
}));

const ECU_REPLACING_REGIONAL = [
  {
    id: 216,
    name: "Protected Areas (Ecuador module)",
    replaces: { id: "11" },
    visualization_types: ["map", "table", "numeric", "chart"],
  },
  { id: 11, name: "Protected Areas", visualization_types: ["map", "table", "numeric", "chart"] },
  {
    id: 219,
    name: "Biogeographic Units (Ecuador module)",
    replaces: "17",
    visualization_types: ["map", "table", "numeric", "chart"],
  },
  { id: 17, name: "Biome Types", visualization_types: ["map", "numeric", "chart"] },
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

  test("renders nothing when the counterpart cannot render the widget's type", () => {
    mockTopics.mockReturnValue([
      { topic_id: 1, indicators: [{ indicator_id: 219, type: "table" }] },
    ]);

    const { container } = render(
      <IndicatorScopeToggle indicatorId={219} topicId={1} type="table" />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  test.each(["chart", "numeric"] as const)(
    "offers the swap both ways between 11 and 216 as a %s",
    (type) => {
      mockTopics.mockReturnValue([
        { topic_id: 1, indicators: [{ indicator_id: 11, type }] },
        { topic_id: 2, indicators: [{ indicator_id: 216, type }] },
      ]);

      renderToggle(<IndicatorScopeToggle indicatorId={11} topicId={1} type={type} />);
      renderToggle(<IndicatorScopeToggle indicatorId={216} topicId={2} type={type} />);

      const [toModule, toRegional] = screen.getAllByRole("button");
      expect(toModule).toHaveAccessibleName(/Ecuador module/);
      expect(toModule).toBeEnabled();
      expect(toRegional).not.toHaveAccessibleName(/Ecuador module/);
      expect(toRegional).toBeEnabled();
    },
  );

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
