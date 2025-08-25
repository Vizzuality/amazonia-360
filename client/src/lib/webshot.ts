import { MutationFunction, useMutation, UseMutationOptions } from "@tanstack/react-query";
import axios from "axios";

/**
 ************************************************************
 ************************************************************
 * Search
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
