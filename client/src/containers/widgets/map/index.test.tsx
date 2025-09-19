import React from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, act } from "@testing-library/react";

import { Indicator } from "@/types/indicator";

import { TopicView, IndicatorView, DefaultTopicConfig } from "@/app/parsers";

import { BasemapIds } from "@/components/map/controls/basemap";
import BasemapControl from "@/components/map/controls/basemap"; // Keep original import name
import { TooltipProvider } from "@/components/ui/tooltip";

import WidgetMap from "./index";

// Augment the global scope for test-specific properties
declare global {
  // eslint-disable-next-line no-var
  var capturedOnBasemapChange: ((selectedBasemapId: BasemapIds) => void) | undefined;
}

// Define a more specific type for DynamicComponent props
interface DynamicComponentProps {
  children?: React.ReactNode;
  [key: string]: unknown; // Allow other props
}

// Mock next/dynamic
jest.mock("next/dynamic", () => () => {
  const DynamicComponent = (props: DynamicComponentProps) => (
    <div data-testid="dynamic-mock">{props.children}</div>
  );
  DynamicComponent.displayName = "DynamicComponent";
  DynamicComponent.preload = jest.fn();
  return DynamicComponent;
});

jest.mock("@arcgis/core/PopupTemplate", () => {
  return jest.fn().mockImplementation((options) => {
    return {
      ...options,
    };
  });
});

jest.mock("@arcgis/core/layers/support/FeatureReductionCluster", () => {
  return jest.fn().mockImplementation((options) => {
    return {
      ...options,
    };
  });
});

// Define a type for overview topics data
interface MockOverviewTopicDefaultVisualization {
  id: number;
  name: string;
  slug: string;
  type: string;
  basemapId?: BasemapIds;
}
interface MockOverviewTopic {
  id: number;
  name_en: string;
  default_visualization: MockOverviewTopicDefaultVisualization[];
}

// Mock dependencies
const mockSetTopics = jest.fn();
let mockTopicsState: TopicView[] | null = [];
const mockSetSyncDefaultTopics = jest.fn();
let mockSyncDefaultTopicsState: DefaultTopicConfig[] | null = [];
let mockOverviewTopicsData: MockOverviewTopic[] | undefined = [];

jest.mock("@/app/store", () => ({
  useSyncTopics: () => [mockTopicsState, mockSetTopics],
  useSyncDefaultTopics: () => [mockSyncDefaultTopicsState, mockSetSyncDefaultTopics],
  useSyncLocation: jest.fn(() => [{ type: "country", adm0: "BRA" }, jest.fn()]),
}));

jest.mock("@/lib/topics", () => ({
  useGetOverviewTopics: jest.fn(() => ({
    data: mockOverviewTopicsData,
    isLoading: false,
    isError: false,
  })),
}));

jest.mock("@/lib/location", () => ({
  useLocationGeometry: jest.fn(() => ({
    type: "Polygon",
    coordinates: [
      [
        [0, 0],
        [0, 1],
        [1, 1],
        [1, 0],
        [0, 0],
      ],
    ],
    extent: { xmin: 0, ymin: 0, xmax: 1, ymax: 1, spatialReference: { wkid: 4326 } },
  })),
  useLocation: jest.fn(() => null),
}));

// Define props for the mocked BasemapControl
interface MockBasemapControlProps {
  basemapIdForWidget: BasemapIds;
  onBasemapChange: (selectedBasemapId: BasemapIds) => void;
  widgetId?: string; // From test usage: data-testid={`basemap-control-mock-${props.widgetId}`}
}

jest.mock("@/components/map/controls/basemap", () => {
  const originalModule = jest.requireActual("@/components/map/controls/basemap");

  const MockBasemapControl = jest.fn((props: MockBasemapControlProps) => {
    globalThis.capturedOnBasemapChange = props.onBasemapChange;
    return <div data-testid={`basemap-control-mock-${props.widgetId}`}>Mock BasemapControl</div>;
  });

  return {
    __esModule: true,
    default: MockBasemapControl,
    BASEMAPS: originalModule.BASEMAPS,
  };
});

// Mock translations
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

// Test wrapper component that provides all necessary contexts
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>{children}</TooltipProvider>
    </QueryClientProvider>
  );
};

describe("WidgetMap - Basemap Change Logic", () => {
  const baseMockIndicator: Indicator = {
    id: 1,
    name: "Test Indicator 1",
    description: "Description for test indicator 1",
    resource: {
      type: "feature",
      name: "Test Layer",
      url: "https://example.com/api",
      query_map: {
        where: "SELECT * FROM table",
        returnIntersections: true,
      },
      query_table: {
        where: "SELECT * FROM table",
        returnIntersections: true,
      },
      query_chart: {
        where: "SELECT * FROM table",
        returnIntersections: true,
      },
      query_numeric: {
        where: "SELECT * FROM table",
        returnIntersections: true,
      },
      query_ai: {
        where: "SELECT * FROM table",
        returnIntersections: true,
      },
      layer_id: 1,
    },
    name_es: "",
    name_en: "",
    name_pt: "",
    description_es: "",
    description_en: "",
    description_pt: "",
    description_short_es: "",
    description_short_en: "",
    description_short_pt: "",
    unit_es: "",
    unit_en: "",
    unit_pt: "",
    topic: {
      id: 0,
      name: undefined,
      name_es: "",
      name_en: "",
      name_pt: "",
      image: "",
      description: undefined,
      description_es: "",
      description_en: "",
      description_pt: "",
    },
    subtopic: {
      id: 0,
      topic_id: 0,
      name: undefined,
      name_es: "",
      name_en: "",
      name_pt: "",
      description: undefined,
      description_es: "",
      description_en: "",
      description_pt: "",
      default_visualization: [],
    },
    order: 0,
    visualization_types: [],
  };

  const basemapIdForWidget: BasemapIds = "gray-vector";

  beforeEach(() => {
    mockSetTopics.mockClear();
    mockSetSyncDefaultTopics.mockClear();
    (BasemapControl as jest.Mock).mockClear();
    globalThis.capturedOnBasemapChange = undefined; // Reset before each test

    mockTopicsState = [
      {
        id: 1,
        indicators: [
          { id: 1, name: "Indicator 1", slug: "indicator-1", type: "map" } as IndicatorView,
          {
            id: 2,
            name: "Indicator 2",
            slug: "indicator-2",
            type: "map",
            basemapId: "satellite" as BasemapIds,
          } as IndicatorView,
        ],
      },
      {
        id: 2,
        indicators: [
          {
            id: 3,
            name: "Indicator 3",
            slug: "indicator-3",
            type: "map",
            basemapId: "streets-vector" as BasemapIds,
          } as IndicatorView,
        ],
      },
    ];
    mockSyncDefaultTopicsState = [];
    mockOverviewTopicsData = [
      {
        id: 10,
        name_en: "Default Topic 10",
        default_visualization: [
          { id: 101, name: "Default Indicator 10.1", slug: "default-indicator-10-1", type: "map" },
          {
            id: 102,
            name: "Default Indicator 10.2",
            slug: "default-indicator-10-2",
            type: "map",
            basemapId: "osm",
          },
        ],
      },
      {
        id: 11,
        name_en: "Default Topic 11",
        default_visualization: [
          { id: 111, name: "Default Indicator 11.1", slug: "default-indicator-11-1", type: "map" },
        ],
      },
    ];
  });

  test("should update basemapId in topics when a new, non-default basemap is selected for a syncTopic indicator", () => {
    const currentIndicator = {
      ...baseMockIndicator,
      id: 1,
      topic: { ...baseMockIndicator.topic, id: 1 },
    };
    render(
      <TestWrapper>
        <WidgetMap indicator={currentIndicator} layers={[]} basemapId={basemapIdForWidget} />
      </TestWrapper>,
    );

    // Access the captured function from globalThis
    const onBasemapChange = globalThis.capturedOnBasemapChange;
    expect(onBasemapChange).toBeDefined();

    const newSelectedBasemap: BasemapIds = "satellite";
    act(() => {
      onBasemapChange!(newSelectedBasemap); // Use non-null assertion as we expect it to be defined
    });

    expect(mockSetTopics).toHaveBeenCalledTimes(1);
    const updaterFn = mockSetTopics.mock.calls[0][0];
    const updatedTopics = updaterFn(mockTopicsState);
    const targetIndicator = updatedTopics
      .find((t: TopicView) => t.id === 1)
      ?.indicators?.find((ind: IndicatorView) => ind.id === currentIndicator.id);
    expect(targetIndicator?.basemapId).toBe(newSelectedBasemap);
  });

  test("should set basemapId to undefined in topics when the default basemap is selected", () => {
    const currentIndicator = {
      ...baseMockIndicator,
      id: 1,
      topic: { ...baseMockIndicator.topic, id: 1 },
    };
    mockTopicsState = [
      {
        id: 1,
        indicators: [
          {
            id: 1,
            name: "Indicator 1",
            type: "map",
            slug: "indicator-1",
            basemapId: "satellite" as BasemapIds,
          } as IndicatorView,
          {
            id: 2,
            name: "Indicator 2",
            type: "map",
            slug: "indicator-2",
            basemapId: "osm" as BasemapIds,
          } as IndicatorView,
        ],
      },
    ];

    render(
      <TestWrapper>
        <WidgetMap indicator={currentIndicator} layers={[]} basemapId={basemapIdForWidget} />
      </TestWrapper>,
    );

    const onBasemapChange = globalThis.capturedOnBasemapChange;
    expect(onBasemapChange).toBeDefined();
    act(() => {
      onBasemapChange!(basemapIdForWidget);
    });

    expect(mockSetTopics).toHaveBeenCalledTimes(1);
    const updaterFn = mockSetTopics.mock.calls[0][0];
    const updatedTopics = updaterFn(mockTopicsState);
    const targetIndicator = updatedTopics
      .find((t: TopicView) => t.id === 1)
      ?.indicators?.find((ind: IndicatorView) => ind.id === currentIndicator.id);
    expect(targetIndicator?.basemapId).toBeUndefined();
  });

  test("should not change other indicators or topics", () => {
    const currentIndicator = {
      ...baseMockIndicator,
      id: 1,
      topic: { ...baseMockIndicator.topic, id: 1 },
    };
    render(
      <TestWrapper>
        <WidgetMap indicator={currentIndicator} layers={[]} basemapId={basemapIdForWidget} />
      </TestWrapper>,
    );

    const onBasemapChange = globalThis.capturedOnBasemapChange;
    expect(onBasemapChange).toBeDefined();
    const newSelectedBasemap: BasemapIds = "osm";
    act(() => {
      onBasemapChange!(newSelectedBasemap);
    });

    expect(mockSetTopics).toHaveBeenCalledTimes(1);
    const updaterFn = mockSetTopics.mock.calls[0][0];
    const originalTopicsBeforeUpdate = JSON.parse(JSON.stringify(mockTopicsState));
    const updatedTopics = updaterFn(JSON.parse(JSON.stringify(mockTopicsState)));
    const targetIndicator = updatedTopics
      .find((t: TopicView) => t.id === 1)
      ?.indicators?.find((ind: IndicatorView) => ind.id === currentIndicator.id);
    expect(targetIndicator?.basemapId).toBe(newSelectedBasemap);
    const otherIndicatorSameTopic = updatedTopics
      .find((t: TopicView) => t.id === 1)
      ?.indicators?.find((ind: IndicatorView) => ind.id === 2);
    expect(otherIndicatorSameTopic?.basemapId).toBe(
      originalTopicsBeforeUpdate[0].indicators[1].basemapId,
    );
    const indicatorOtherTopic = updatedTopics
      .find((t: TopicView) => t.id === 2)
      ?.indicators?.find((ind: IndicatorView) => ind.id === 3);
    expect(indicatorOtherTopic?.basemapId).toBe(
      originalTopicsBeforeUpdate[1].indicators[0].basemapId,
    );
  });

  test("should set basemapId in syncDefaultTopics when a new, non-default basemap is selected for a default topic indicator (not in syncTopics)", () => {
    const currentIndicator = {
      ...baseMockIndicator,
      id: 101,
      topic: { ...baseMockIndicator.topic, id: 10 },
    };
    mockTopicsState = [];
    mockSyncDefaultTopicsState = [];

    render(
      <TestWrapper>
        <WidgetMap indicator={currentIndicator} layers={[]} basemapId={basemapIdForWidget} />
      </TestWrapper>,
    );

    const onBasemapChange = globalThis.capturedOnBasemapChange;
    expect(onBasemapChange).toBeDefined();
    const newSelectedBasemap: BasemapIds = "satellite";

    act(() => {
      onBasemapChange!(newSelectedBasemap);
    });

    expect(mockSetTopics).not.toHaveBeenCalled();
    expect(mockSetSyncDefaultTopics).toHaveBeenCalledTimes(1);

    const updaterFn = mockSetSyncDefaultTopics.mock.calls[0][0];
    const updatedDefaultTopics = updaterFn(mockSyncDefaultTopicsState);

    expect(updatedDefaultTopics).toEqual([
      {
        id: 10,
        indicators: [{ id: 101, basemapId: newSelectedBasemap }],
      },
    ]);
  });

  test("should update existing basemapId in syncDefaultTopics for a default topic indicator", () => {
    const currentIndicator = {
      ...baseMockIndicator,
      id: 101,
      topic: { ...baseMockIndicator.topic, id: 10 },
    };
    mockTopicsState = [];
    mockSyncDefaultTopicsState = [
      { id: 10, indicators: [{ id: 101, basemapId: "osm" as BasemapIds }] },
    ];

    render(
      <TestWrapper>
        <WidgetMap indicator={currentIndicator} layers={[]} basemapId={basemapIdForWidget} />
      </TestWrapper>,
    );

    const onBasemapChange = globalThis.capturedOnBasemapChange;
    expect(onBasemapChange).toBeDefined();
    const newSelectedBasemap: BasemapIds = "dark-gray-vector";

    act(() => {
      onBasemapChange!(newSelectedBasemap);
    });

    expect(mockSetSyncDefaultTopics).toHaveBeenCalledTimes(1);
    const updaterFn = mockSetSyncDefaultTopics.mock.calls[0][0];
    const updatedDefaultTopics = updaterFn(mockSyncDefaultTopicsState);

    expect(updatedDefaultTopics).toEqual([
      {
        id: 10,
        indicators: [{ id: 101, basemapId: newSelectedBasemap }],
      },
    ]);
  });

  test("should remove indicator from syncDefaultTopics when default basemap is selected", () => {
    const currentIndicator = {
      ...baseMockIndicator,
      id: 101,
      topic: { ...baseMockIndicator.topic, id: 10 },
    };
    mockTopicsState = [];
    mockSyncDefaultTopicsState = [
      {
        id: 10,
        indicators: [
          { id: 101, basemapId: "satellite" as BasemapIds },
          { id: 102, basemapId: "osm" as BasemapIds },
        ],
      },
      { id: 11, indicators: [{ id: 111, basemapId: "streets-vector" as BasemapIds }] },
    ];

    render(
      <TestWrapper>
        <WidgetMap indicator={currentIndicator} layers={[]} basemapId={basemapIdForWidget} />
      </TestWrapper>,
    );

    const onBasemapChange = globalThis.capturedOnBasemapChange;
    expect(onBasemapChange).toBeDefined();

    act(() => {
      onBasemapChange!(basemapIdForWidget);
    });

    expect(mockSetSyncDefaultTopics).toHaveBeenCalledTimes(1);
    const updaterFn = mockSetSyncDefaultTopics.mock.calls[0][0];
    const updatedDefaultTopics = updaterFn(JSON.parse(JSON.stringify(mockSyncDefaultTopicsState)));

    expect(updatedDefaultTopics).toEqual([
      { id: 10, indicators: [{ id: 102, basemapId: "osm" as BasemapIds }] },
      { id: 11, indicators: [{ id: 111, basemapId: "streets-vector" as BasemapIds }] },
    ]);
  });

  test("should remove topic from syncDefaultTopics if it becomes empty after indicator removal", () => {
    const currentIndicator = {
      ...baseMockIndicator,
      id: 111,
      topic: { ...baseMockIndicator.topic, id: 11 },
    };
    mockTopicsState = [];
    mockSyncDefaultTopicsState = [
      { id: 10, indicators: [{ id: 102, basemapId: "osm" as BasemapIds }] },
      { id: 11, indicators: [{ id: 111, basemapId: "satellite" as BasemapIds }] },
    ];

    render(
      <TestWrapper>
        <WidgetMap indicator={currentIndicator} layers={[]} basemapId={basemapIdForWidget} />
      </TestWrapper>,
    );

    const onBasemapChange = globalThis.capturedOnBasemapChange;
    expect(onBasemapChange).toBeDefined();

    act(() => {
      onBasemapChange!(basemapIdForWidget);
    });

    expect(mockSetSyncDefaultTopics).toHaveBeenCalledTimes(1);
    const updaterFn = mockSetSyncDefaultTopics.mock.calls[0][0];
    const updatedDefaultTopics = updaterFn(JSON.parse(JSON.stringify(mockSyncDefaultTopicsState)));

    expect(updatedDefaultTopics).toEqual([
      { id: 10, indicators: [{ id: 102, basemapId: "osm" as BasemapIds }] },
    ]);
  });

  test("should set syncDefaultTopics to null if all topics are removed", () => {
    const currentIndicator = {
      ...baseMockIndicator,
      id: 102,
      topic: { ...baseMockIndicator.topic, id: 10 },
    };
    mockTopicsState = [];
    mockSyncDefaultTopicsState = [
      { id: 10, indicators: [{ id: 102, basemapId: "osm" as BasemapIds }] },
    ];

    render(
      <TestWrapper>
        <WidgetMap indicator={currentIndicator} layers={[]} basemapId={basemapIdForWidget} />
      </TestWrapper>,
    );

    const onBasemapChange = globalThis.capturedOnBasemapChange;
    expect(onBasemapChange).toBeDefined();

    act(() => {
      onBasemapChange!(basemapIdForWidget);
    });

    expect(mockSetSyncDefaultTopics).toHaveBeenCalledTimes(1);
    const updaterFn = mockSetSyncDefaultTopics.mock.calls[0][0];
    const updatedDefaultTopics = updaterFn(JSON.parse(JSON.stringify(mockSyncDefaultTopicsState)));

    expect(updatedDefaultTopics).toBeNull();
  });
});
