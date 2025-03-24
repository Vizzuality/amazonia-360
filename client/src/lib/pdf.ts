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

export type GetPDFParams = {
  url: string;
};

export const getPDF = async (params: GetPDFParams) => {
  if (!params) return null;

  return axios.request<Blob>({
    url: "/local-api/pdf",
    method: "POST",
    responseType: "blob",
    headers: {
      "Content-Type": "application/json",
    },
    data: params,
  });
};

export const getPDFMutationOptions = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<Awaited<ReturnType<typeof getPDF>>, TError, GetPDFParams, TContext>,
): UseMutationOptions<Awaited<ReturnType<typeof getPDF>>, TError, GetPDFParams, TContext> => {
  const mutationFn: MutationFunction<Awaited<ReturnType<typeof getPDF>>, GetPDFParams> = (props) =>
    getPDF(props);

  return { mutationFn, ...options };
};

export const useGetMutationPDF = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<Awaited<ReturnType<typeof getPDF>>, TError, GetPDFParams, TContext>,
) => {
  const mutationOptions = getPDFMutationOptions(options);

  return useMutation(mutationOptions);
};
