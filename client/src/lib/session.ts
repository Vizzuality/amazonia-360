import { QueryFunction, UseQueryOptions, useQuery } from "@tanstack/react-query";
import axios from "axios";
/**
 ************************************************************
 ************************************************************
 * CLIENT ANALYSIS
 * - useSession
 ************************************************************
 ************************************************************
 */
export type SessionParams = unknown;

export type SessionQueryOptions<TData, TError> = UseQueryOptions<
  Awaited<ReturnType<typeof getSession>>,
  TError,
  TData
>;

export const getSession = async () => {
  return axios.get("/api/session");
};

export const getSessionKey = () => {
  return ["grid", "meta"];
};

export const getSessionOptions = <TData = Awaited<ReturnType<typeof getSession>>, TError = unknown>(
  options?: Omit<SessionQueryOptions<TData, TError>, "queryKey">,
) => {
  const queryKey = getSessionKey();
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getSession>>> = () => getSession();
  return { queryKey, queryFn, ...options } as SessionQueryOptions<TData, TError>;
};

export const useSession = <TData = Awaited<ReturnType<typeof getSession>>, TError = unknown>(
  options?: Omit<SessionQueryOptions<TData, TError>, "queryKey">,
) => {
  const { queryKey, queryFn } = getSessionOptions(options);

  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
};
