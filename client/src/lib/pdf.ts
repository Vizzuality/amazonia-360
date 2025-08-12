type BBox = [number, number, number, number];

export type GeoJSONPolygon = {
  type: "Polygon";
  coordinates: number[][][];
};

/**
 ************************************************************
 ************************************************************
 * Search
 * useGetMutationPDF
 ************************************************************
 ************************************************************
 */

import { MutationFunction, useMutation, UseMutationOptions } from "@tanstack/react-query";
import axios from "axios";

export type PDFPayload = {
  pagePath: string;
  geometry?: GeoJSONPolygon;
  generatedTextContent?: object;
};

export const getPDF = async (payload: PDFPayload) => {
  return axios.request<Blob>({
    url: "/local-api/report",
    method: "POST",
    responseType: "blob",
    headers: { "Content-Type": "application/json" },
    data: payload,
  });
};

export const getPDFMutationOptions = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<Awaited<ReturnType<typeof getPDF>>, TError, PDFPayload, TContext>,
): UseMutationOptions<Awaited<ReturnType<typeof getPDF>>, TError, PDFPayload, TContext> => {
  const mutationFn: MutationFunction<Awaited<ReturnType<typeof getPDF>>, PDFPayload> = (vars) =>
    getPDF(vars);
  return { mutationFn, ...options };
};

export const useGetMutationPDF = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<Awaited<ReturnType<typeof getPDF>>, TError, PDFPayload, TContext>,
) => {
  return useMutation(getPDFMutationOptions(options));
};

export type ReportPDFParams = {
  pagePath: string;
  geometry: {
    type: "Polygon";
    coordinates: number[][][]; // GeoJSON Polygon
  };
};

export async function downloadBlobResponse(res: Response, fallbackName = "report.pdf") {
  if (!res) return;

  const cd = res.headers.get("Content-Disposition") ?? undefined;
  const match = cd?.match(/filename\*?=.*?''?([^;]+)|filename="?([^"]+)"?/i);
  const filename = match?.[1] || match?.[2] || fallbackName;

  const blob = await res.blob();

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = decodeURIComponent(filename.trim());
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const date = new Date().toISOString().split("T")[0];

export function filenameFromCD(cd?: string | null, fallback = `report_${date}.pdf`) {
  if (!cd) return fallback;
  const m = /filename\*?=.*?''?([^;]+)|filename="?([^"]+)"?/i.exec(cd);
  return decodeURIComponent((m?.[1] || m?.[2] || fallback).trim());
}

export function parseBBox(bboxStr: string): BBox {
  const arr = bboxStr
    .split(",")
    .map((v) => parseFloat(v.trim()))
    .filter((n) => !Number.isNaN(n));
  if (arr.length !== 4) throw new Error("wrong BBox");
  return arr as BBox;
}

export function normalizeBBox([minX, minY, maxX, maxY]: BBox): BBox {
  if (minX > maxX) [minX, maxX] = [maxX, minX];
  if (minY > maxY) [minY, maxY] = [maxY, minY];
  return [minX, minY, maxX, maxY];
}

export function bboxToGeoJSONPolygon(bbox: BBox): GeoJSONPolygon {
  const [minX, minY, maxX, maxY] = normalizeBBox(bbox);
  return {
    type: "Polygon",
    coordinates: [
      [
        [minX, minY],
        [maxX, minY],
        [maxX, maxY],
        [minX, maxY],
        [minX, minY],
      ],
    ],
  };
}
