"use client";

import { ReactNode, createContext, useCallback, useContext, useMemo, useRef } from "react";

import { toPng } from "html-to-image";

import { downloadBlobResponse } from "@/lib/webshot";

type TakeScreenshotFn = () => Promise<string | null>;

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

type MapRegistration = {
  element: HTMLElement;
  takeScreenshot: TakeScreenshotFn;
};

type CardExportContextProps = {
  registerMap: (element: HTMLElement, takeScreenshot: TakeScreenshotFn) => void;
  unregisterMap: (element: HTMLElement) => void;
  exportAsPng: (cardElement: HTMLElement, filename: string) => Promise<void>;
};

const CardExportContext = createContext<CardExportContextProps>({
  registerMap: () => {},
  unregisterMap: () => {},
  exportAsPng: async () => {},
});

export function CardExportProvider({ children }: { children: ReactNode }) {
  const mapRegistrations = useRef<MapRegistration[]>([]);

  const registerMap = useCallback((element: HTMLElement, takeScreenshot: TakeScreenshotFn) => {
    const existing = mapRegistrations.current.find((r) => r.element === element);
    if (!existing) {
      mapRegistrations.current.push({ element, takeScreenshot });
    }
  }, []);

  const unregisterMap = useCallback((element: HTMLElement) => {
    mapRegistrations.current = mapRegistrations.current.filter((r) => r.element !== element);
  }, []);

  const exportAsPng = useCallback(async (cardElement: HTMLElement, filename: string) => {
    // 1. Create an off-screen clone — the original is NEVER modified.
    const clone = cardElement.cloneNode(true) as HTMLElement;
    clone.style.position = "absolute";
    clone.style.left = "-9999px";
    clone.style.top = "-9999px";
    clone.style.pointerEvents = "none";
    // Preserve original dimensions so CSS computes identically.
    clone.style.width = `${cardElement.offsetWidth}px`;
    clone.style.height = `${cardElement.offsetHeight}px`;
    // Insert as sibling so ancestor-based CSS selectors still match.
    cardElement.parentElement!.appendChild(clone);

    try {
      // 2. Take screenshots of registered maps and add overlays to the CLONE.
      const originalMaps = Array.from(cardElement.querySelectorAll(".map"));

      for (const registration of mapRegistrations.current) {
        const dataUrl = await registration.takeScreenshot();
        if (!dataUrl) continue;

        const originalMapContainer = registration.element.closest(".map");
        const mapIndex = originalMaps.indexOf(originalMapContainer as HTMLElement);
        if (mapIndex === -1) continue;

        const cloneMaps = Array.from(clone.querySelectorAll(".map"));
        const cloneMapParent = cloneMaps[mapIndex]?.parentElement;
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
      inlineForeignObjectStyles(cardElement, clone);

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
  }, []);

  const value = useMemo(
    () => ({ registerMap, unregisterMap, exportAsPng }),
    [registerMap, unregisterMap, exportAsPng],
  );

  return <CardExportContext.Provider value={value}>{children}</CardExportContext.Provider>;
}

export function useCardExport() {
  return useContext(CardExportContext);
}
