export type E2ELocationInput = {
  type: "point" | "multipoint" | "polyline" | "polygon" | "extent" | "mesh";
  geometry: Record<string, unknown>;
  buffer: number;
  custom_title?: string;
} | null;

declare global {
  interface Window {
    __E2E_SET_LOCATION__?: (location: E2ELocationInput) => void;
  }
}
