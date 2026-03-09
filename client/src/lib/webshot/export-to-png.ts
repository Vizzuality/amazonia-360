import { toPng } from "html-to-image";

import { downloadBlobResponse } from "./download";
import { getMapScreenshotFn } from "./map-export-registry";

/**
 * html-to-image deep-clones <svg> elements via cloneNode(true) and skips
 * computed-style inlining for their children. This means HTML inside
 * <foreignObject> (e.g. visx HtmlLabel) loses all class-based styles
 * when serialized to a data URI (no stylesheet available).
 *
 * This function reads computed styles from the ORIGINAL DOM and writes
 * them as inline `style` attributes on a CLONE. The original is never
 * modified — no visual flash, no restore step needed.
 */
function inlineForeignObjectStyles(original: HTMLElement, clone: HTMLElement) {
  const origFOs = original.querySelectorAll("svg foreignObject");
  const cloneFOs = clone.querySelectorAll("svg foreignObject");

  for (let i = 0; i < origFOs.length; i++) {
    const origChildren = origFOs[i].querySelectorAll("*");
    const cloneChildren = cloneFOs[i].querySelectorAll("*");

    for (let j = 0; j < origChildren.length; j++) {
      const origNode = origChildren[j];
      const cloneNode = cloneChildren[j];
      if (!(origNode instanceof HTMLElement) || !(cloneNode instanceof HTMLElement)) continue;

      const computed = window.getComputedStyle(origNode);
      for (let k = 0; k < computed.length; k++) {
        const prop = computed[k];
        cloneNode.style.setProperty(prop, computed.getPropertyValue(prop));
      }
    }
  }
}

export async function exportToPng(element: HTMLElement, filename: string): Promise<void> {
  // 1. Create an off-screen clone — the original is NEVER modified.
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.position = "absolute";
  clone.style.left = "-9999px";
  clone.style.top = "-9999px";
  clone.style.pointerEvents = "none";
  // Preserve original dimensions so CSS computes identically.
  clone.style.width = `${element.offsetWidth}px`;
  clone.style.height = `${element.offsetHeight}px`;
  // Insert as sibling so ancestor-based CSS selectors still match.
  element.parentElement!.appendChild(clone);

  try {
    // 2. Take screenshots of maps found in the element via the WeakMap registry.
    const originalMaps = Array.from(element.querySelectorAll(".map"));
    const cloneMaps = Array.from(clone.querySelectorAll(".map"));

    for (let i = 0; i < originalMaps.length; i++) {
      const takeScreenshot = getMapScreenshotFn(originalMaps[i] as HTMLElement);
      if (!takeScreenshot) continue;

      const dataUrl = await takeScreenshot();
      if (!dataUrl) continue;

      const cloneMapParent = cloneMaps[i]?.parentElement;
      if (!cloneMapParent) continue;

      const overlay = document.createElement("img");
      overlay.src = dataUrl;
      overlay.style.position = "absolute";
      overlay.style.inset = "0";
      overlay.style.width = "100%";
      overlay.style.height = "100%";
      overlay.style.objectFit = "cover";
      overlay.style.zIndex = "5";
      overlay.style.pointerEvents = "none";

      if (getComputedStyle(cloneMapParent).position === "static") {
        cloneMapParent.style.position = "relative";
      }
      cloneMapParent.appendChild(overlay);
    }

    // 3. Inline computed styles from the ORIGINAL's foreignObject children
    //    onto the CLONE. html-to-image deep-clones <svg> via cloneNode(true)
    //    and skips style inlining for SVG children, so class-based styles
    //    (including CHROMA-luminance text colors) would be lost without this.
    inlineForeignObjectStyles(element, clone);

    // 4. Capture the clone with html-to-image.
    //    The `style` option overrides the root element on html-to-image's
    //    internal clone, resetting the off-screen positioning we applied
    //    to hide our clone from the user.
    const dataUrl = await toPng(clone, {
      pixelRatio: 2,
      style: {
        position: "static",
        left: "auto",
        top: "auto",
        pointerEvents: "auto",
      },
      filter: (node: HTMLElement) => {
        if (node.dataset?.exportExclude !== undefined) return false;
        if (node.tagName === "CANVAS") {
          return !node.closest(".map");
        }
        return true;
      },
    });

    // 5. Convert data URL to Blob and download
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    await downloadBlobResponse(blob, filename);
  } finally {
    clone.remove();
  }
}
