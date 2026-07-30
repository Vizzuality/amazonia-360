"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import * as geodesicAreaOperator from "@arcgis/core/geometry/operators/geodeticAreaOperator";
import { useSetAtom } from "jotai";

import {
  getGeometryWithBuffer,
  useLocation,
  useLocationGeometryWithStatus,
  useLocationTitle,
} from "@/lib/location";

import { tmpBboxAtom, useSyncLocation } from "@/app/(frontend)/store";

import { BUFFERS } from "@/constants/map";

if (!geodesicAreaOperator.isLoaded()) {
  await geodesicAreaOperator.load();
}

// Buffer-slider state shared by the report location "create" and "confirm" panels.
// The slider/label are driven from local state and committed to the (shared) location
// once per drag instead of once per pointer-move tick, so the off-thread buffer isn't
// recomputed on every tick.
export function useLocationBuffer() {
  const setTmpBbox = useSetAtom(tmpBboxAtom);

  const [location, setLocation] = useSyncLocation();
  const TITLE = useLocationTitle(location);
  const LOCATION = useLocation(location);
  const { geometry: GEOMETRY, isCalculating } = useLocationGeometryWithStatus(location);

  const AREA = useMemo(() => {
    if (!GEOMETRY) return 0;
    return geodesicAreaOperator.execute(GEOMETRY, { unit: "square-kilometers" });
  }, [GEOMETRY]);

  const committedBuffer =
    (location && location.type !== "search" ? location.buffer : undefined) ||
    BUFFERS[LOCATION?.geometry?.type || "point"];
  const [bufferValue, setBufferValue] = useState(committedBuffer);

  // Latest dragged value, captured synchronously so the commit never reads a stale
  // React-state value. Radix only fires onValueCommit when its (controlled) value
  // differs from the slide-start value; on a fast drag the controlled value hasn't
  // flushed by pointer-up, so onValueCommit gets skipped and the buffer never updates.
  // A trailing debounce off onValueChange guarantees the final value commits.
  const pendingBufferRef = useRef(committedBuffer);
  const commitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local slider state when the committed buffer changes from outside (reset,
  // upload, edit-location).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBufferValue(committedBuffer);
    pendingBufferRef.current = committedBuffer;
  }, [committedBuffer]);

  useEffect(() => {
    return () => {
      if (commitTimeoutRef.current) clearTimeout(commitTimeoutRef.current);
    };
  }, []);

  const commitBuffer = async () => {
    const value = pendingBufferRef.current;
    setLocation((prev) => (prev ? { ...prev, buffer: value } : prev));

    const geometry = LOCATION?.geometry;
    if (!location || !geometry || (location.type !== "point" && location.type !== "polyline")) {
      return;
    }

    const gWithBuffer = await getGeometryWithBuffer(geometry, value);
    if (gWithBuffer?.extent) {
      setTmpBbox(gWithBuffer.extent);
    }
  };

  const onValueChange = (value: number[]) => {
    pendingBufferRef.current = value[0];
    setBufferValue(value[0]);
    if (commitTimeoutRef.current) clearTimeout(commitTimeoutRef.current);
    commitTimeoutRef.current = setTimeout(commitBuffer, 120);
  };

  // Radix fires this on release for slow drags / track clicks. Commit immediately and
  // cancel the pending debounce; reads pendingBufferRef (not the possibly-stale arg).
  const onValueCommit = () => {
    if (commitTimeoutRef.current) clearTimeout(commitTimeoutRef.current);
    commitBuffer();
  };

  return {
    location,
    setLocation,
    LOCATION,
    TITLE,
    AREA,
    isCalculating,
    bufferValue,
    onValueChange,
    onValueCommit,
  };
}
