import { MutationFunction, useMutation, UseMutationOptions } from "@tanstack/react-query";
import axios from "axios";

/**
 ************************************************************
 ************************************************************
 * WebshotReport
 * usePostWebshotReportMutation
 ************************************************************
 ************************************************************
 */

export type PostWebshotReportParams = {
  pagePath: string;
  generatedTextContent?: Record<string, unknown>;
};

export const postWebshotReport = async (payload: PostWebshotReportParams) => {
  return axios.request<Blob>({
    url: "/local-api/webshot/report",
    method: "POST",
    responseType: "blob",
    headers: { "Content-Type": "application/json" },
    data: payload,
  });
};

export const postWebshotReportMutationOptions = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    Awaited<ReturnType<typeof postWebshotReport>>,
    TError,
    PostWebshotReportParams,
    TContext
  >,
): UseMutationOptions<
  Awaited<ReturnType<typeof postWebshotReport>>,
  TError,
  PostWebshotReportParams,
  TContext
> => {
  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof postWebshotReport>>,
    PostWebshotReportParams
  > = (vars) => postWebshotReport(vars);
  return { mutationFn, ...options };
};

export const usePostWebshotReportMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    Awaited<ReturnType<typeof postWebshotReport>>,
    TError,
    PostWebshotReportParams,
    TContext
  >,
) => {
  return useMutation(postWebshotReportMutationOptions(options));
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

/**
 ************************************************************
 ************************************************************
 * WebshotWidgets
 * usePostWebshotWidgetsMutation
 ************************************************************
 ************************************************************
 */

export type PostWebshotWidgetsParams = {
  pagePath: string;
  outputFileName: string;
  params: Record<string, unknown>;
};

export const postWebshotWidgets = async (payload: PostWebshotWidgetsParams) => {
  return axios.request<Blob>({
    url: "/local-api/webshot/widgets",
    method: "POST",
    responseType: "blob",
    headers: { "Content-Type": "application/json" },
    data: payload,
  });
};

export const postWebshotWidgetsMutationOptions = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    Awaited<ReturnType<typeof postWebshotWidgets>>,
    TError,
    PostWebshotWidgetsParams,
    TContext
  >,
): UseMutationOptions<
  Awaited<ReturnType<typeof postWebshotWidgets>>,
  TError,
  PostWebshotWidgetsParams,
  TContext
> => {
  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof postWebshotWidgets>>,
    PostWebshotWidgetsParams
  > = (vars) => postWebshotWidgets(vars);
  return { mutationFn, ...options };
};

export const usePostWebshotWidgetsMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    Awaited<ReturnType<typeof postWebshotWidgets>>,
    TError,
    PostWebshotWidgetsParams,
    TContext
  >,
) => {
  return useMutation(postWebshotWidgetsMutationOptions(options));
};
