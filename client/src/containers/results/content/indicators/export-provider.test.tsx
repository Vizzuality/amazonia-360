import { renderHook, act } from "@testing-library/react";
import { toPng } from "html-to-image";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

import { downloadBlobResponse } from "@/lib/webshot";

import { CardExportProvider, useCardExport } from "./export-provider";

vi.mock("html-to-image", () => ({
  toPng: vi.fn(),
}));

vi.mock("@/lib/webshot", () => ({
  downloadBlobResponse: vi.fn(),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return <CardExportProvider>{children}</CardExportProvider>;
}

/** Create a card inside document.body so it has a parentElement for clone insertion. */
function createCard() {
  const card = document.createElement("div");
  document.body.appendChild(card);
  return card;
}

describe("CardExportProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("provides registerMap, unregisterMap, and exportAsPng", () => {
    const { result } = renderHook(() => useCardExport(), { wrapper });

    expect(result.current.registerMap).toBeDefined();
    expect(result.current.unregisterMap).toBeDefined();
    expect(result.current.exportAsPng).toBeDefined();
  });

  describe("exportAsPng", () => {
    it("captures a card without maps and triggers download", async () => {
      const mockDataUrl = "data:image/png;base64,abc123";
      const mockBlob = new Blob(["png-data"], { type: "image/png" });

      vi.mocked(toPng).mockResolvedValue(mockDataUrl);
      global.fetch = vi.fn().mockResolvedValue({ blob: () => Promise.resolve(mockBlob) });

      const { result } = renderHook(() => useCardExport(), { wrapper });
      const card = createCard();

      await act(async () => {
        await result.current.exportAsPng(card, "test-card.png");
      });

      expect(toPng).toHaveBeenCalledTimes(1);
      expect(toPng).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({ pixelRatio: 2 }),
      );
      expect(downloadBlobResponse).toHaveBeenCalledWith(mockBlob, "test-card.png");

      card.remove();
    });

    it("passes an off-screen clone to toPng, NOT the original element", async () => {
      const mockDataUrl = "data:image/png;base64,abc123";
      const mockBlob = new Blob(["png-data"], { type: "image/png" });

      vi.mocked(toPng).mockResolvedValue(mockDataUrl);
      global.fetch = vi.fn().mockResolvedValue({ blob: () => Promise.resolve(mockBlob) });

      const { result } = renderHook(() => useCardExport(), { wrapper });
      const card = createCard();

      await act(async () => {
        await result.current.exportAsPng(card, "test-card.png");
      });

      const passedElement = vi.mocked(toPng).mock.calls[0][0];
      expect(passedElement).not.toBe(card);
      // Clone should be off-screen
      expect(passedElement.style.left).toBe("-9999px");

      card.remove();
    });

    it("never modifies the original card element", async () => {
      const mockDataUrl = "data:image/png;base64,abc123";
      const mockBlob = new Blob(["png-data"], { type: "image/png" });

      vi.mocked(toPng).mockResolvedValue(mockDataUrl);
      global.fetch = vi.fn().mockResolvedValue({ blob: () => Promise.resolve(mockBlob) });

      const { result } = renderHook(() => useCardExport(), { wrapper });
      const card = createCard();
      const controlsDiv = document.createElement("div");
      controlsDiv.setAttribute("data-export-exclude", "");
      card.appendChild(controlsDiv);

      const originalHTML = card.innerHTML;
      const originalStyle = card.getAttribute("style");
      const originalChildCount = card.childNodes.length;

      // Capture inline styles at the moment toPng is called
      vi.mocked(toPng).mockImplementation(async () => {
        // Original must be unchanged even during capture
        expect(card.innerHTML).toBe(originalHTML);
        expect(card.getAttribute("style")).toBe(originalStyle);
        expect(card.childNodes.length).toBe(originalChildCount);
        return mockDataUrl;
      });

      await act(async () => {
        await result.current.exportAsPng(card, "test-card.png");
      });

      // Original unchanged after export
      expect(card.innerHTML).toBe(originalHTML);
      expect(card.getAttribute("style")).toBe(originalStyle);

      card.remove();
    });

    it("removes the clone after export completes", async () => {
      const mockDataUrl = "data:image/png;base64,abc123";
      const mockBlob = new Blob(["png-data"], { type: "image/png" });

      vi.mocked(toPng).mockResolvedValue(mockDataUrl);
      global.fetch = vi.fn().mockResolvedValue({ blob: () => Promise.resolve(mockBlob) });

      const { result } = renderHook(() => useCardExport(), { wrapper });
      const card = createCard();
      const parentChildCount = card.parentElement!.childNodes.length;

      await act(async () => {
        await result.current.exportAsPng(card, "test-card.png");
      });

      // Clone should be cleaned up — parent back to original child count
      expect(card.parentElement!.childNodes.length).toBe(parentChildCount);

      card.remove();
    });

    it("removes the clone even if toPng fails", async () => {
      vi.mocked(toPng).mockRejectedValue(new Error("capture failed"));

      const { result } = renderHook(() => useCardExport(), { wrapper });
      const card = createCard();
      const parentChildCount = card.parentElement!.childNodes.length;

      let error: Error | undefined;
      await act(async () => {
        try {
          await result.current.exportAsPng(card, "fail.png");
        } catch (e) {
          error = e as Error;
        }
      });

      expect(error?.message).toBe("capture failed");
      expect(card.parentElement!.childNodes.length).toBe(parentChildCount);

      card.remove();
    });

    it("hides data-export-exclude elements via toPng filter", async () => {
      const mockDataUrl = "data:image/png;base64,abc123";
      const mockBlob = new Blob(["png-data"], { type: "image/png" });

      vi.mocked(toPng).mockResolvedValue(mockDataUrl);
      global.fetch = vi.fn().mockResolvedValue({ blob: () => Promise.resolve(mockBlob) });

      const { result } = renderHook(() => useCardExport(), { wrapper });
      const card = createCard();

      await act(async () => {
        await result.current.exportAsPng(card, "test-card.png");
      });

      const filterFn = vi.mocked(toPng).mock.calls[0][1]?.filter as (node: HTMLElement) => boolean;
      expect(filterFn).toBeDefined();

      const excludedEl = document.createElement("div");
      excludedEl.setAttribute("data-export-exclude", "");
      document.body.appendChild(excludedEl);
      expect(filterFn(excludedEl)).toBe(false);
      document.body.removeChild(excludedEl);

      const regularEl = document.createElement("div");
      expect(filterFn(regularEl)).toBe(true);

      card.remove();
    });

    it("creates a temporary overlay for registered maps on the clone", async () => {
      const mockMapDataUrl = "data:image/png;base64,mapScreenshot";
      const mockCardDataUrl = "data:image/png;base64,cardCapture";
      const mockBlob = new Blob(["png-data"], { type: "image/png" });

      global.fetch = vi.fn().mockResolvedValue({ blob: () => Promise.resolve(mockBlob) });

      const takeScreenshot = vi.fn().mockResolvedValue(mockMapDataUrl);

      // Create a mock map DOM structure
      const card = createCard();
      const mapParent = document.createElement("div");
      mapParent.style.position = "relative";
      const mapContainer = document.createElement("div");
      mapContainer.className = "map";
      const mapElement = document.createElement("div");
      mapContainer.appendChild(mapElement);
      mapParent.appendChild(mapContainer);
      card.appendChild(mapParent);

      // Verify overlay is on the clone (not the original) during capture
      vi.mocked(toPng).mockImplementation(async (element) => {
        const el = element as HTMLElement;
        // Clone should have the overlay
        const overlays = el.querySelectorAll("img");
        expect(overlays.length).toBe(1);
        // Original should NOT have any overlays
        expect(card.querySelectorAll("img").length).toBe(0);
        return mockCardDataUrl;
      });

      const { result } = renderHook(() => useCardExport(), { wrapper });

      act(() => {
        result.current.registerMap(mapElement, takeScreenshot);
      });

      await act(async () => {
        await result.current.exportAsPng(card, "map-card.png");
      });

      expect(takeScreenshot).toHaveBeenCalled();
      expect(toPng).toHaveBeenCalled();
      expect(downloadBlobResponse).toHaveBeenCalledWith(mockBlob, "map-card.png");

      // Original should be completely untouched
      expect(mapParent.querySelectorAll("img").length).toBe(0);

      card.remove();
    });

    it("handles map screenshot returning null gracefully", async () => {
      const mockCardDataUrl = "data:image/png;base64,cardCapture";
      const mockBlob = new Blob(["png-data"], { type: "image/png" });

      vi.mocked(toPng).mockResolvedValue(mockCardDataUrl);
      global.fetch = vi.fn().mockResolvedValue({ blob: () => Promise.resolve(mockBlob) });

      const takeScreenshot = vi.fn().mockResolvedValue(null);

      const card = createCard();
      const mapContainer = document.createElement("div");
      mapContainer.className = "map";
      const mapElement = document.createElement("div");
      mapContainer.appendChild(mapElement);
      card.appendChild(mapContainer);

      const { result } = renderHook(() => useCardExport(), { wrapper });

      act(() => {
        result.current.registerMap(mapElement, takeScreenshot);
      });

      await act(async () => {
        await result.current.exportAsPng(card, "no-map.png");
      });

      expect(toPng).toHaveBeenCalled();
      expect(downloadBlobResponse).toHaveBeenCalledWith(mockBlob, "no-map.png");

      card.remove();
    });

    it("filters out map canvas elements during capture", async () => {
      const mockCardDataUrl = "data:image/png;base64,abc";
      const mockBlob = new Blob(["png-data"], { type: "image/png" });

      vi.mocked(toPng).mockResolvedValue(mockCardDataUrl);
      global.fetch = vi.fn().mockResolvedValue({ blob: () => Promise.resolve(mockBlob) });

      const { result } = renderHook(() => useCardExport(), { wrapper });
      const card = createCard();

      await act(async () => {
        await result.current.exportAsPng(card, "test.png");
      });

      const filterFn = vi.mocked(toPng).mock.calls[0][1]?.filter as (node: HTMLElement) => boolean;
      expect(filterFn).toBeDefined();

      const mapDiv = document.createElement("div");
      mapDiv.className = "map";
      const canvas = document.createElement("canvas");
      mapDiv.appendChild(canvas);
      document.body.appendChild(mapDiv);

      expect(filterFn(canvas)).toBe(false);

      const standaloneCanvas = document.createElement("canvas");
      document.body.appendChild(standaloneCanvas);
      expect(filterFn(standaloneCanvas)).toBe(true);

      const div = document.createElement("div");
      expect(filterFn(div)).toBe(true);

      document.body.removeChild(mapDiv);
      document.body.removeChild(standaloneCanvas);

      card.remove();
    });
  });

  describe("SVG foreignObject style inlining on clone", () => {
    function createCardWithSvgForeignObject() {
      const card = createCard();
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      const fo = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
      const container = document.createElement("div");
      container.className = "p-3";
      const label = document.createElement("p");
      label.className = "font-bold text-white";
      label.textContent = "38.89%";
      container.appendChild(label);
      fo.appendChild(container);
      svg.appendChild(fo);
      card.appendChild(svg);
      return { card, container, label };
    }

    function mockComputedStyleFor(targets: Map<Element, Record<string, string>>) {
      const original = window.getComputedStyle;
      return vi.spyOn(window, "getComputedStyle").mockImplementation((el) => {
        const overrides = targets.get(el);
        if (!overrides) return original(el);

        const props = Object.keys(overrides);
        return {
          length: props.length,
          ...Object.fromEntries(props.map((p, i) => [i, p])),
          getPropertyValue: (prop: string) => overrides[prop] ?? "",
          [Symbol.iterator]: function* () {
            yield* props;
          },
        } as unknown as CSSStyleDeclaration;
      });
    }

    it("inlines computed styles on the clone, not the original", async () => {
      const mockBlob = new Blob(["png-data"], { type: "image/png" });
      global.fetch = vi.fn().mockResolvedValue({ blob: () => Promise.resolve(mockBlob) });

      const { card, container, label } = createCardWithSvgForeignObject();
      const originalContainerStyle = container.getAttribute("style");
      const originalLabelStyle = label.getAttribute("style");

      mockComputedStyleFor(
        new Map<Element, Record<string, string>>([
          [container, { padding: "12px" }],
          [label, { color: "rgb(255, 255, 255)", "font-weight": "700" }],
        ]),
      );

      vi.mocked(toPng).mockImplementation(async (element) => {
        const el = element as HTMLElement;
        // Clone's foreignObject children should have inlined styles
        const cloneContainer = el.querySelector("svg foreignObject div") as HTMLElement;
        const cloneLabel = el.querySelector("svg foreignObject p") as HTMLElement;
        expect(cloneContainer.style.padding).toBe("12px");
        expect(cloneLabel.style.color).toBe("rgb(255, 255, 255)");
        expect(cloneLabel.style.fontWeight).toBe("700");

        // Original must be untouched
        expect(container.getAttribute("style")).toBe(originalContainerStyle);
        expect(label.getAttribute("style")).toBe(originalLabelStyle);

        return "data:image/png;base64,abc";
      });

      const { result } = renderHook(() => useCardExport(), { wrapper });
      await act(async () => {
        await result.current.exportAsPng(card, "test.png");
      });

      expect(toPng).toHaveBeenCalled();
      // Original still untouched after export
      expect(container.getAttribute("style")).toBe(originalContainerStyle);
      expect(label.getAttribute("style")).toBe(originalLabelStyle);

      card.remove();
    });

    it("inlines CHROMA-luminance text color (text-foreground) on the clone", async () => {
      const mockBlob = new Blob(["png-data"], { type: "image/png" });
      global.fetch = vi.fn().mockResolvedValue({ blob: () => Promise.resolve(mockBlob) });

      const { card, label } = createCardWithSvgForeignObject();

      // Simulate text-foreground (dark text on light background)
      mockComputedStyleFor(new Map([[label, { color: "rgb(0, 39, 56)", "font-weight": "700" }]]));

      vi.mocked(toPng).mockImplementation(async (element) => {
        const cloneLabel = (element as HTMLElement).querySelector(
          "svg foreignObject p",
        ) as HTMLElement;
        expect(cloneLabel.style.color).toBe("rgb(0, 39, 56)");
        return "data:image/png;base64,abc";
      });

      const { result } = renderHook(() => useCardExport(), { wrapper });
      await act(async () => {
        await result.current.exportAsPng(card, "test.png");
      });

      expect(toPng).toHaveBeenCalled();
      card.remove();
    });

    it("never modifies original foreignObject styles even if toPng fails", async () => {
      vi.mocked(toPng).mockRejectedValue(new Error("capture failed"));

      const { card, label } = createCardWithSvgForeignObject();
      expect(label.getAttribute("style")).toBeNull();

      const { result } = renderHook(() => useCardExport(), { wrapper });
      let error: Error | undefined;
      await act(async () => {
        try {
          await result.current.exportAsPng(card, "fail.png");
        } catch (e) {
          error = e as Error;
        }
      });

      expect(error?.message).toBe("capture failed");
      expect(label.getAttribute("style")).toBeNull();

      card.remove();
    });
  });

  describe("registerMap / unregisterMap", () => {
    it("does not register the same element twice", async () => {
      const mockCardDataUrl = "data:image/png;base64,abc";
      const mockBlob = new Blob(["png-data"], { type: "image/png" });

      vi.mocked(toPng).mockResolvedValue(mockCardDataUrl);
      global.fetch = vi.fn().mockResolvedValue({ blob: () => Promise.resolve(mockBlob) });

      const takeScreenshot1 = vi.fn().mockResolvedValue("data:image/png;base64,first");
      const takeScreenshot2 = vi.fn().mockResolvedValue("data:image/png;base64,second");

      const card = createCard();
      const mapContainer = document.createElement("div");
      mapContainer.className = "map";
      const mapElement = document.createElement("div");
      mapContainer.appendChild(mapElement);
      card.appendChild(mapContainer);

      const { result } = renderHook(() => useCardExport(), { wrapper });

      act(() => {
        result.current.registerMap(mapElement, takeScreenshot1);
        result.current.registerMap(mapElement, takeScreenshot2);
      });

      await act(async () => {
        await result.current.exportAsPng(card, "test.png");
      });

      expect(takeScreenshot1).toHaveBeenCalledTimes(1);
      expect(takeScreenshot2).not.toHaveBeenCalled();

      card.remove();
    });

    it("removes registration on unregister", async () => {
      const mockCardDataUrl = "data:image/png;base64,abc";
      const mockBlob = new Blob(["png-data"], { type: "image/png" });

      vi.mocked(toPng).mockResolvedValue(mockCardDataUrl);
      global.fetch = vi.fn().mockResolvedValue({ blob: () => Promise.resolve(mockBlob) });

      const takeScreenshot = vi.fn().mockResolvedValue("data:image/png;base64,map");
      const mapElement = document.createElement("div");
      const card = createCard();

      const { result } = renderHook(() => useCardExport(), { wrapper });

      act(() => {
        result.current.registerMap(mapElement, takeScreenshot);
        result.current.unregisterMap(mapElement);
      });

      await act(async () => {
        await result.current.exportAsPng(card, "test.png");
      });

      expect(takeScreenshot).not.toHaveBeenCalled();

      card.remove();
    });
  });
});
