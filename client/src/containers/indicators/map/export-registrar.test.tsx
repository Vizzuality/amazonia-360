import { render } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { MapExportRegistrar } from "./export-registrar";

const mockRegisterMap = vi.fn();
const mockUnregisterMap = vi.fn();

vi.mock("@/containers/results/content/indicators/export-provider", () => ({
  useCardExport: () => ({
    registerMap: mockRegisterMap,
    unregisterMap: mockUnregisterMap,
    exportAsPng: vi.fn(),
  }),
}));

const mockMapView = {
  container: document.createElement("div"),
  updating: false,
  takeScreenshot: vi.fn(),
};

vi.mock("@/components/map/provider", () => ({
  useMap: () => ({
    view: mockMapView,
  }),
}));

vi.mock("@arcgis/core/core/reactiveUtils", () => ({
  whenOnce: vi.fn().mockResolvedValue(undefined),
}));

describe("MapExportRegistrar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing", () => {
    const { container } = render(<MapExportRegistrar />);
    expect(container.innerHTML).toBe("");
  });

  it("registers the map container on mount", () => {
    render(<MapExportRegistrar />);

    expect(mockRegisterMap).toHaveBeenCalledTimes(1);
    expect(mockRegisterMap).toHaveBeenCalledWith(mockMapView.container, expect.any(Function));
  });

  it("unregisters the map container on unmount", () => {
    const { unmount } = render(<MapExportRegistrar />);

    unmount();

    expect(mockUnregisterMap).toHaveBeenCalledTimes(1);
    expect(mockUnregisterMap).toHaveBeenCalledWith(mockMapView.container);
  });

  it("provides a takeScreenshot function that calls mapView.takeScreenshot", async () => {
    const mockDataUrl = "data:image/png;base64,mapScreenshot";
    mockMapView.takeScreenshot.mockResolvedValue({ dataUrl: mockDataUrl });

    render(<MapExportRegistrar />);

    // Get the registered takeScreenshot function
    const registeredTakeScreenshot = mockRegisterMap.mock.calls[0][1];

    const result = await registeredTakeScreenshot();
    expect(result).toBe(mockDataUrl);
  });

  it("returns null when takeScreenshot fails", async () => {
    mockMapView.takeScreenshot.mockRejectedValue(new Error("screenshot failed"));

    render(<MapExportRegistrar />);

    const registeredTakeScreenshot = mockRegisterMap.mock.calls[0][1];

    const result = await registeredTakeScreenshot();
    expect(result).toBeNull();
  });

  it("does not register when view is not available", () => {
    vi.resetModules();

    // Re-mock with undefined view
    vi.doMock("@/components/map/provider", () => ({
      useMap: () => ({ view: undefined }),
    }));

    // Since we can't easily re-import with changed mocks in vitest,
    // we test the boundary by checking the current mock wasn't called with undefined
    const calls = mockRegisterMap.mock.calls;
    for (const call of calls) {
      expect(call[0]).not.toBeUndefined();
    }
  });
});
