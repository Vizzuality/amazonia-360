import * as ArcGISReactiveUtils from "@arcgis/core/core/reactiveUtils";

export type LayerViewStatus = "loading" | "success" | "empty" | "error";

export type SettledLayerViewStatus = Exclude<LayerViewStatus, "loading">;

/**
 * One `exportImage` against the atlas.iadb.org image services takes 12-15s when
 * a report draws six maps at once, so this has to be generous. It also has to
 * exist: a service that answers with an auth challenge instead of metadata
 * leaves `Layer.loadStatus` at "loading" and `view.whenLayerView()` pending for
 * good.
 */
export const LAYER_VIEW_TIMEOUT = 60_000;

function whenAborted(signal: AbortSignal): Promise<never> {
  return new Promise((_, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }
    signal.addEventListener("abort", () => reject(signal.reason), { once: true });
  });
}

/**
 * Resolves once `layer` has finished drawing in `view`, or with the reason it
 * never will.
 *
 * `whenOnce(() => !layerView.updating)` looks like the right predicate and is
 * not: `LayerView2D.updating` short-circuits to `false` while a layer view is
 * suspended — hidden, outside its scale range, or in a view that isn't ready —
 * so it reads as "done" before anything has been drawn. Feature and vector tile
 * layers mostly get away with it because their query is already tracked by the
 * time we look; an ImageryLayer has nothing in flight until the render loop
 * issues its `exportImage`, so it is the one that loses the race and exports a
 * bare basemap.
 *
 * "Not suspended and not updating" is what actually means drawn: a suspended
 * layer view is by definition not drawing, and an unsuspended one reports
 * `updating` continuously from creation through to the finished export.
 */
export async function whenLayerViewSettled(
  view: __esri.MapView,
  layer: __esri.Layer,
  { signal, timeout = LAYER_VIEW_TIMEOUT }: { signal?: AbortSignal; timeout?: number } = {},
): Promise<SettledLayerViewStatus> {
  // An invisible layer's view stays suspended for good, so waiting on it would
  // stall the map for as long as the layer is hidden.
  if (layer.visible === false) {
    return "empty";
  }

  const deadline = new AbortController();
  const timer = setTimeout(() => deadline.abort(), timeout);
  const abort = signal ? AbortSignal.any([signal, deadline.signal]) : deadline.signal;

  let layerView: __esri.LayerView | undefined;

  try {
    layerView = await Promise.race([view.whenLayerView(layer), whenAborted(abort)]);

    await ArcGISReactiveUtils.whenOnce(() => !layerView!.suspended && !layerView!.updating, abort);

    return "success";
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }

    // The rejection can come from our own race or from inside `whenOnce`, which
    // substitutes its own abort error, so ask the deadline rather than the error.
    if (deadline.signal.aborted) {
      // Still suspended when the clock ran out: this layer will not draw at this
      // scale, which is nothing to show rather than a broken service.
      return layerView?.suspended ? "empty" : "error";
    }

    // `whenLayerView()` rejects for every kind of failure, not only
    // "layerview:create-error" — a service that 404s, a renderer the SDK cannot
    // build, an unsupported spatial reference. All of them are a failed layer.
    return "error";
  } finally {
    clearTimeout(timer);
  }
}
