import { vi } from "vitest";

import { LAYER_VIEW_TIMEOUT, whenLayerViewSettled } from "./layer-view-status";

// A stand-in for `reactiveUtils.whenOnce`: resolves as soon as the predicate is
// truthy, rejects when the signal aborts. The real one is push-based off
// Accessor notifications; polling gives the same observable contract here.
vi.mock("@arcgis/core/core/reactiveUtils", () => ({
  whenOnce: (getValue: () => unknown, signal?: AbortSignal) =>
    new Promise((resolve, reject) => {
      let timer: ReturnType<typeof setTimeout>;

      const stop = () => clearTimeout(timer);

      // Aborting is push-based in the real implementation, so it must not wait
      // for the next poll.
      signal?.addEventListener(
        "abort",
        () => {
          stop();
          reject(signal.reason);
        },
        { once: true },
      );

      const tick = () => {
        if (signal?.aborted) {
          return;
        }
        const value = getValue();
        if (value) {
          resolve(value);
          return;
        }
        timer = setTimeout(tick, 10);
      };
      tick();
    }),
}));

type FakeLayer = { id: string; visible: boolean };
type FakeLayerView = { layer: unknown; suspended: boolean; updating: boolean };

const layer = (overrides: Partial<FakeLayer> = {}): __esri.Layer =>
  ({ id: "13", visible: true, ...overrides }) as unknown as __esri.Layer;

function makeLayerView(l: __esri.Layer, state: { suspended: boolean; updating: boolean }) {
  return { layer: l, ...state } as FakeLayerView;
}

function makeView({
  layerView,
  whenLayerView,
}: {
  layerView?: FakeLayerView;
  whenLayerView?: () => Promise<unknown>;
}) {
  return {
    allLayerViews: layerView ? [layerView] : [],
    whenLayerView: whenLayerView ?? (() => Promise.resolve(layerView)),
  } as unknown as __esri.MapView;
}

describe("whenLayerViewSettled", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("resolves success once the layer view stops updating", async () => {
    const l = layer();
    const lv = makeLayerView(l, { suspended: false, updating: true });
    const promise = whenLayerViewSettled(makeView({ layerView: lv }), l);

    await vi.advanceTimersByTimeAsync(10);
    lv.updating = false;
    await vi.advanceTimersByTimeAsync(10);

    await expect(promise).resolves.toBe("success");
  });

  test("does not report success while the layer view is suspended", async () => {
    // A suspended layer view reports `updating: false` without having drawn.
    const l = layer();
    const lv = makeLayerView(l, { suspended: true, updating: false });
    const promise = whenLayerViewSettled(makeView({ layerView: lv }), l);

    await vi.advanceTimersByTimeAsync(1_000);
    lv.suspended = false;
    await vi.advanceTimersByTimeAsync(10);

    await expect(promise).resolves.toBe("success");
  });

  test("reports empty for a layer view that never leaves suspended", async () => {
    const l = layer();
    const lv = makeLayerView(l, { suspended: true, updating: false });
    const promise = whenLayerViewSettled(makeView({ layerView: lv }), l, { timeout: 500 });

    await vi.advanceTimersByTimeAsync(600);

    await expect(promise).resolves.toBe("empty");
  });

  test("reports empty for a hidden layer without waiting", async () => {
    const view = makeView({ whenLayerView: () => new Promise(() => {}) });

    await expect(whenLayerViewSettled(view, layer({ visible: false }))).resolves.toBe("empty");
  });

  test("reports error when the layer view fails to be created", async () => {
    const view = makeView({
      whenLayerView: () => Promise.reject(Object.assign(new Error("nope"), { name: "some:error" })),
    });
    const promise = whenLayerViewSettled(view, layer());

    await vi.advanceTimersByTimeAsync(10);

    await expect(promise).resolves.toBe("error");
  });

  test("reports error when the service never answers", async () => {
    const view = makeView({ whenLayerView: () => new Promise(() => {}) });
    const promise = whenLayerViewSettled(view, layer());

    await vi.advanceTimersByTimeAsync(LAYER_VIEW_TIMEOUT + 10);

    await expect(promise).resolves.toBe("error");
  });

  test("honours a caller abort instead of reporting a status", async () => {
    const l = layer();
    const lv = makeLayerView(l, { suspended: false, updating: true });
    const controller = new AbortController();
    const promise = whenLayerViewSettled(makeView({ layerView: lv }), l, {
      signal: controller.signal,
    });

    await vi.advanceTimersByTimeAsync(10);
    controller.abort(new Error("unmounted"));

    await expect(promise).rejects.toThrow("unmounted");
  });

  test("respects a custom timeout", async () => {
    const view = makeView({ whenLayerView: () => new Promise(() => {}) });
    const promise = whenLayerViewSettled(view, layer(), { timeout: 500 });

    await vi.advanceTimersByTimeAsync(600);

    await expect(promise).resolves.toBe("error");
  });
});
