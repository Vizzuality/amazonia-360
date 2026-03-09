import { toPng } from "html-to-image";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

import { downloadBlobResponse } from "./download";
import { exportToPng } from "./export-to-png";
import { registerMapForExport, unregisterMapForExport } from "./map-export-registry";

vi.mock("html-to-image", () => ({
  toPng: vi.fn(),
}));

vi.mock("./download", () => ({
  downloadBlobResponse: vi.fn(),
}));

/** Create an element inside document.body so it has a parentElement for clone insertion. */
function createElement() {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

describe("exportToPng", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("captures an element without maps and triggers download", async () => {
    const mockDataUrl = "data:image/png;base64,abc123";
    const mockBlob = new Blob(["png-data"], { type: "image/png" });

    vi.mocked(toPng).mockResolvedValue(mockDataUrl);
    global.fetch = vi.fn().mockResolvedValue({ blob: () => Promise.resolve(mockBlob) });

    const el = createElement();

    await exportToPng(el, "test.png");

    expect(toPng).toHaveBeenCalledTimes(1);
    expect(toPng).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ pixelRatio: 2 }),
    );
    expect(downloadBlobResponse).toHaveBeenCalledWith(mockBlob, "test.png");

    el.remove();
  });

  it("passes an off-screen clone to toPng, NOT the original element", async () => {
    const mockDataUrl = "data:image/png;base64,abc123";
    const mockBlob = new Blob(["png-data"], { type: "image/png" });

    vi.mocked(toPng).mockResolvedValue(mockDataUrl);
    global.fetch = vi.fn().mockResolvedValue({ blob: () => Promise.resolve(mockBlob) });

    const el = createElement();

    await exportToPng(el, "test.png");

    const passedElement = vi.mocked(toPng).mock.calls[0][0];
    expect(passedElement).not.toBe(el);
    expect(passedElement.style.left).toBe("-9999px");

    el.remove();
  });

  it("never modifies the original element", async () => {
    const mockDataUrl = "data:image/png;base64,abc123";
    const mockBlob = new Blob(["png-data"], { type: "image/png" });

    vi.mocked(toPng).mockResolvedValue(mockDataUrl);
    global.fetch = vi.fn().mockResolvedValue({ blob: () => Promise.resolve(mockBlob) });

    const el = createElement();
    const controlsDiv = document.createElement("div");
    controlsDiv.setAttribute("data-export-exclude", "");
    el.appendChild(controlsDiv);

    const originalHTML = el.innerHTML;
    const originalStyle = el.getAttribute("style");
    const originalChildCount = el.childNodes.length;

    vi.mocked(toPng).mockImplementation(async () => {
      expect(el.innerHTML).toBe(originalHTML);
      expect(el.getAttribute("style")).toBe(originalStyle);
      expect(el.childNodes.length).toBe(originalChildCount);
      return mockDataUrl;
    });

    await exportToPng(el, "test.png");

    expect(el.innerHTML).toBe(originalHTML);
    expect(el.getAttribute("style")).toBe(originalStyle);

    el.remove();
  });

  it("removes the clone after export completes", async () => {
    const mockDataUrl = "data:image/png;base64,abc123";
    const mockBlob = new Blob(["png-data"], { type: "image/png" });

    vi.mocked(toPng).mockResolvedValue(mockDataUrl);
    global.fetch = vi.fn().mockResolvedValue({ blob: () => Promise.resolve(mockBlob) });

    const el = createElement();
    const parentChildCount = el.parentElement!.childNodes.length;

    await exportToPng(el, "test.png");

    expect(el.parentElement!.childNodes.length).toBe(parentChildCount);

    el.remove();
  });

  it("removes the clone even if toPng fails", async () => {
    vi.mocked(toPng).mockRejectedValue(new Error("capture failed"));

    const el = createElement();
    const parentChildCount = el.parentElement!.childNodes.length;

    await expect(exportToPng(el, "fail.png")).rejects.toThrow("capture failed");
    expect(el.parentElement!.childNodes.length).toBe(parentChildCount);

    el.remove();
  });

  it("hides data-export-exclude elements via toPng filter", async () => {
    const mockDataUrl = "data:image/png;base64,abc123";
    const mockBlob = new Blob(["png-data"], { type: "image/png" });

    vi.mocked(toPng).mockResolvedValue(mockDataUrl);
    global.fetch = vi.fn().mockResolvedValue({ blob: () => Promise.resolve(mockBlob) });

    const el = createElement();

    await exportToPng(el, "test.png");

    const filterFn = vi.mocked(toPng).mock.calls[0][1]?.filter as (node: HTMLElement) => boolean;
    expect(filterFn).toBeDefined();

    const excludedEl = document.createElement("div");
    excludedEl.setAttribute("data-export-exclude", "");
    document.body.appendChild(excludedEl);
    expect(filterFn(excludedEl)).toBe(false);
    document.body.removeChild(excludedEl);

    const regularEl = document.createElement("div");
    expect(filterFn(regularEl)).toBe(true);

    el.remove();
  });

  it("creates a temporary overlay for registered maps on the clone", async () => {
    const mockMapDataUrl = "data:image/png;base64,mapScreenshot";
    const mockCardDataUrl = "data:image/png;base64,cardCapture";
    const mockBlob = new Blob(["png-data"], { type: "image/png" });

    global.fetch = vi.fn().mockResolvedValue({ blob: () => Promise.resolve(mockBlob) });

    const takeScreenshot = vi.fn().mockResolvedValue(mockMapDataUrl);

    const el = createElement();
    const mapParent = document.createElement("div");
    mapParent.style.position = "relative";
    const mapContainer = document.createElement("div");
    mapContainer.className = "map";
    mapParent.appendChild(mapContainer);
    el.appendChild(mapParent);

    registerMapForExport(mapContainer, takeScreenshot);

    vi.mocked(toPng).mockImplementation(async (element) => {
      const clone = element as HTMLElement;
      expect(clone.querySelectorAll("img").length).toBe(1);
      expect(el.querySelectorAll("img").length).toBe(0);
      return mockCardDataUrl;
    });

    await exportToPng(el, "map.png");

    expect(takeScreenshot).toHaveBeenCalled();
    expect(toPng).toHaveBeenCalled();
    expect(downloadBlobResponse).toHaveBeenCalledWith(mockBlob, "map.png");
    expect(mapParent.querySelectorAll("img").length).toBe(0);

    unregisterMapForExport(mapContainer);
    el.remove();
  });

  it("handles map screenshot returning null gracefully", async () => {
    const mockCardDataUrl = "data:image/png;base64,cardCapture";
    const mockBlob = new Blob(["png-data"], { type: "image/png" });

    vi.mocked(toPng).mockResolvedValue(mockCardDataUrl);
    global.fetch = vi.fn().mockResolvedValue({ blob: () => Promise.resolve(mockBlob) });

    const takeScreenshot = vi.fn().mockResolvedValue(null);

    const el = createElement();
    const mapContainer = document.createElement("div");
    mapContainer.className = "map";
    el.appendChild(mapContainer);

    registerMapForExport(mapContainer, takeScreenshot);

    await exportToPng(el, "no-map.png");

    expect(toPng).toHaveBeenCalled();
    expect(downloadBlobResponse).toHaveBeenCalledWith(mockBlob, "no-map.png");

    unregisterMapForExport(mapContainer);
    el.remove();
  });

  it("filters out map canvas elements during capture", async () => {
    const mockCardDataUrl = "data:image/png;base64,abc";
    const mockBlob = new Blob(["png-data"], { type: "image/png" });

    vi.mocked(toPng).mockResolvedValue(mockCardDataUrl);
    global.fetch = vi.fn().mockResolvedValue({ blob: () => Promise.resolve(mockBlob) });

    const el = createElement();

    await exportToPng(el, "test.png");

    const filterFn = vi.mocked(toPng).mock.calls[0][1]?.filter as (node: HTMLElement) => boolean;

    const mapDiv = document.createElement("div");
    mapDiv.className = "map";
    const canvas = document.createElement("canvas");
    mapDiv.appendChild(canvas);
    document.body.appendChild(mapDiv);
    expect(filterFn(canvas)).toBe(false);

    const standaloneCanvas = document.createElement("canvas");
    document.body.appendChild(standaloneCanvas);
    expect(filterFn(standaloneCanvas)).toBe(true);

    expect(filterFn(document.createElement("div"))).toBe(true);

    document.body.removeChild(mapDiv);
    document.body.removeChild(standaloneCanvas);
    el.remove();
  });

  describe("SVG foreignObject style inlining on clone", () => {
    function createElementWithSvgForeignObject() {
      const el = createElement();
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
      el.appendChild(svg);
      return { el, container, label };
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

      const { el, container, label } = createElementWithSvgForeignObject();
      const originalContainerStyle = container.getAttribute("style");
      const originalLabelStyle = label.getAttribute("style");

      mockComputedStyleFor(
        new Map<Element, Record<string, string>>([
          [container, { padding: "12px" }],
          [label, { color: "rgb(255, 255, 255)", "font-weight": "700" }],
        ]),
      );

      vi.mocked(toPng).mockImplementation(async (element) => {
        const clone = element as HTMLElement;
        const cloneContainer = clone.querySelector("svg foreignObject div") as HTMLElement;
        const cloneLabel = clone.querySelector("svg foreignObject p") as HTMLElement;
        expect(cloneContainer.style.padding).toBe("12px");
        expect(cloneLabel.style.color).toBe("rgb(255, 255, 255)");
        expect(cloneLabel.style.fontWeight).toBe("700");

        expect(container.getAttribute("style")).toBe(originalContainerStyle);
        expect(label.getAttribute("style")).toBe(originalLabelStyle);

        return "data:image/png;base64,abc";
      });

      await exportToPng(el, "test.png");

      expect(toPng).toHaveBeenCalled();
      expect(container.getAttribute("style")).toBe(originalContainerStyle);
      expect(label.getAttribute("style")).toBe(originalLabelStyle);

      el.remove();
    });

    it("inlines CHROMA-luminance text color on the clone", async () => {
      const mockBlob = new Blob(["png-data"], { type: "image/png" });
      global.fetch = vi.fn().mockResolvedValue({ blob: () => Promise.resolve(mockBlob) });

      const { el, label } = createElementWithSvgForeignObject();

      mockComputedStyleFor(new Map([[label, { color: "rgb(0, 39, 56)", "font-weight": "700" }]]));

      vi.mocked(toPng).mockImplementation(async (element) => {
        const cloneLabel = (element as HTMLElement).querySelector(
          "svg foreignObject p",
        ) as HTMLElement;
        expect(cloneLabel.style.color).toBe("rgb(0, 39, 56)");
        return "data:image/png;base64,abc";
      });

      await exportToPng(el, "test.png");

      expect(toPng).toHaveBeenCalled();
      el.remove();
    });

    it("never modifies original foreignObject styles even if toPng fails", async () => {
      vi.mocked(toPng).mockRejectedValue(new Error("capture failed"));

      const { el, label } = createElementWithSvgForeignObject();
      expect(label.getAttribute("style")).toBeNull();

      await expect(exportToPng(el, "fail.png")).rejects.toThrow("capture failed");
      expect(label.getAttribute("style")).toBeNull();

      el.remove();
    });
  });

  describe("map registry integration", () => {
    it("skips maps not registered in the WeakMap", async () => {
      const mockCardDataUrl = "data:image/png;base64,abc";
      const mockBlob = new Blob(["png-data"], { type: "image/png" });

      vi.mocked(toPng).mockResolvedValue(mockCardDataUrl);
      global.fetch = vi.fn().mockResolvedValue({ blob: () => Promise.resolve(mockBlob) });

      const el = createElement();
      const mapContainer = document.createElement("div");
      mapContainer.className = "map";
      el.appendChild(mapContainer);

      await exportToPng(el, "test.png");

      expect(toPng).toHaveBeenCalled();
      expect(downloadBlobResponse).toHaveBeenCalledWith(mockBlob, "test.png");

      el.remove();
    });

    it("does not call screenshot after unregistering", async () => {
      const mockCardDataUrl = "data:image/png;base64,abc";
      const mockBlob = new Blob(["png-data"], { type: "image/png" });

      vi.mocked(toPng).mockResolvedValue(mockCardDataUrl);
      global.fetch = vi.fn().mockResolvedValue({ blob: () => Promise.resolve(mockBlob) });

      const takeScreenshot = vi.fn().mockResolvedValue("data:image/png;base64,map");
      const el = createElement();
      const mapContainer = document.createElement("div");
      mapContainer.className = "map";
      el.appendChild(mapContainer);

      registerMapForExport(mapContainer, takeScreenshot);
      unregisterMapForExport(mapContainer);

      await exportToPng(el, "test.png");

      expect(takeScreenshot).not.toHaveBeenCalled();

      el.remove();
    });
  });
});
