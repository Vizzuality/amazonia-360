"use client";

import { useEffect } from "react";

import { CustomLocation } from "@/app/(frontend)/parsers";
import { useSyncLocation } from "@/app/(frontend)/store";

declare global {
  interface Window {
    __E2E_SET_LOCATION__?: (location: CustomLocation | null) => void;
  }
}

/**
 * Invisible component that exposes `window.__E2E_SET_LOCATION__` so that
 * Playwright E2E tests can inject a geometry into the Jotai `locationAtom`
 * without needing the ArcGIS MapView canvas (which requires WebGL + a valid
 * API key).
 *
 * Gated by `NEXT_PUBLIC_E2E_BRIDGE=true` — the parent layout only renders
 * this component when the env var is set.
 */
export default function E2EBridge() {
  const [, setLocation] = useSyncLocation();

  useEffect(() => {
    window.__E2E_SET_LOCATION__ = (location) => {
      setLocation(location);
    };

    return () => {
      delete window.__E2E_SET_LOCATION__;
    };
  }, [setLocation]);

  return null;
}
