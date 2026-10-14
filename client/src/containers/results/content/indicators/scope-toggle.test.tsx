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

const ECU_MODULE = { id: "ecu-module", slug: "ECU", tag: "ECU" };

const ECU_REPLACING_REGIONAL = [
  {
    id: 216,
    name: "Protected Areas (Ecuador module)",
    module: ECU_MODULE,
    replaces: { id: "11" },
    visualization_types: ["map", "table", "numeric", "chart"],
  },
  {
    id: 11,
    name: "Protected Areas",
    module: null,
    visualization_types: ["map", "table", "numeric", "chart"],
  },
  {
    id: 219,
    name: "Biogeographic Units (Ecuador module)",
    module: ECU_MODULE,
    replaces: "17",
    visualization_types: ["map", "table", "numeric", "chart"],
  },
  { id: 17, name: "Biome Types", module: null, visualization_types: ["map", "numeric", "chart"] },
];

const TOPIC_WITH_THE_ECU_WIDGET = [
  { topic_id: 1, indicators: [{ indicator_id: 216, type: "map" }] },
];

beforeEach(() => {
  mockIndicators.mockReturnValue(ECU_REPLACING_REGIONAL);
  mockTopics.mockReturnValue(TOPIC_WITH_THE_ECU_WIDGET);
  mockSetTopics.mockClear();
});

const getOption = (label: string) => screen.getByRole("button", { name: new RegExp(`^${label}`) });

describe("IndicatorScopeToggle", () => {
  test("marks the national side pressed on a module widget and offers the regional one", () => {
    renderToggle(<IndicatorScopeToggle indicatorId={216} topicId={1} type="map" />);

    expect(screen.getByRole("group")).toHaveAccessibleName(/indicator-scope-toggle/);
    expect(getOption("ECU")).toHaveAttribute("aria-pressed", "true");
    expect(getOption("country-module-badge-regional")).toHaveAttribute("aria-pressed", "false");
    expect(getOption("country-module-badge-regional")).toHaveAccessibleName(/Protected Areas/);
  });

  test("marks the regional side pressed on a regional widget", () => {
    mockTopics.mockReturnValue([{ topic_id: 1, indicators: [{ indicator_id: 11, type: "map" }] }]);

    renderToggle(<IndicatorScopeToggle indicatorId={11} topicId={1} type="map" />);

    expect(getOption("country-module-badge-regional")).toHaveAttribute("aria-pressed", "true");
    expect(getOption("ECU")).toHaveAttribute("aria-pressed", "false");
    expect(getOption("ECU")).toHaveAccessibleName(/Ecuador module/);
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

  test("pressing the other side swaps only the matching widget's indicator id", async () => {
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
    await userEvent.click(getOption("country-module-badge-regional"));

    const next = mockSetTopics.mock.calls[0][0](mockTopics());
    expect(next[0].indicators).toEqual([
      { indicator_id: 11, type: "map" },
      { indicator_id: 216, type: "chart" },
    ]);
    expect(next[1].indicators).toEqual([{ indicator_id: 216, type: "map" }]);
  });

  test("pressing the side already selected does nothing", async () => {
    renderToggle(<IndicatorScopeToggle indicatorId={216} topicId={1} type="map" />);
    await userEvent.click(getOption("ECU"));

    expect(mockSetTopics).not.toHaveBeenCalled();
  });

  test("the other side is disabled when the counterpart already occupies that slot", async () => {
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
    const regional = getOption("country-module-badge-regional");
    await userEvent.click(regional);

    expect(regional).toHaveAttribute("aria-disabled", "true");
    expect(regional).toHaveAccessibleName(/scope-toggle-taken/);
    expect(mockSetTopics).not.toHaveBeenCalled();
  });
});
