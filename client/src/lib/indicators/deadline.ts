/**
 * How long a widget or evidence read waits on ArcGIS before it counts as `unavailable`. Kept well
 * under the summary's own deadline, so one hung indicator cannot spend all of it. Maps keep their
 * own, longer `LAYER_VIEW_TIMEOUT`: drawing six of them at once is slow, a data read should not be.
 */
export const INDICATOR_READ_TIMEOUT = 30_000;

export const getReadSignal = (signal?: AbortSignal): AbortSignal => {
  const deadline = AbortSignal.timeout(INDICATOR_READ_TIMEOUT);

  return signal ? AbortSignal.any([signal, deadline]) : deadline;
};
