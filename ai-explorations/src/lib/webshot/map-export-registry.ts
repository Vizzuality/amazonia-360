type TakeScreenshotFn = () => Promise<string | null>;

const registry = new WeakMap<HTMLElement, TakeScreenshotFn>();

export function registerMapForExport(
  container: HTMLElement,
  takeScreenshot: TakeScreenshotFn,
): void {
  registry.set(container, takeScreenshot);
}

export function unregisterMapForExport(container: HTMLElement): void {
  registry.delete(container);
}

export function getMapScreenshotFn(container: HTMLElement): TakeScreenshotFn | undefined {
  return registry.get(container);
}
