import {
  QueryFunction,
  MutationFunction,
  UseQueryOptions,
  UseMutationOptions,
  useQuery,
  useMutation,
} from "react-query";

import SearchVM from "@arcgis/core/widgets/Search/SearchViewModel";

const searchVM = new SearchVM({
  popupEnabled: false,
  autoSelect: false,
  includeDefaultSources: true,
});

/**
 ************************************************************
 ************************************************************
 * Search
 * useGetArcGISSuggestions
 ************************************************************
 ************************************************************
 */

export type ArcGISSuggestParams = {
  text: string;
};
export const getSuggestions = async (params: ArcGISSuggestParams) => {
  const { text } = params;

  if (!text) {
    throw new Error("text is required");
  }

  return searchVM.suggest(text);
};

export const getSuggestionsQueryKey = (params: ArcGISSuggestParams) => {
  const { text } = params;
  return ["arcgis", "suggest", text] as const;
};

export const useGetArcGISQueryOptions = <
  TData = Awaited<ReturnType<typeof getSuggestions>>,
  TError = unknown,
>(
  params: ArcGISSuggestParams,
  options: UseQueryOptions<
    Awaited<ReturnType<typeof getSuggestions>>,
    TError,
    TData
  >,
) => {
  const queryKey = getSuggestionsQueryKey(params);
  const queryFn: QueryFunction<
    Awaited<ReturnType<typeof getSuggestions>>
  > = () => getSuggestions(params);
  return { queryKey, queryFn, ...options } as UseQueryOptions<
    Awaited<ReturnType<typeof getSuggestions>>,
    TError,
    TData
  >;
};

export const useGetArcGISSuggestions = <
  TData = Awaited<ReturnType<typeof getSuggestions>>,
  TError = unknown,
>(
  params: ArcGISSuggestParams,
  options?: UseQueryOptions<
    Awaited<ReturnType<typeof getSuggestions>>,
    TError,
    TData
  >,
) => {
  const queryKey = options?.queryKey ?? getSuggestionsQueryKey(params);
  const queryFn: QueryFunction<
    Awaited<ReturnType<typeof getSuggestions>>
  > = () => getSuggestions(params);

  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
};

/**
 ************************************************************
 ************************************************************
 * Post Search
 * getSearch
 ************************************************************
 ************************************************************
 */

export type SearchRequest =
  | string
  | __esri.Geometry
  | __esri.SearchViewModelSuggestResult
  | number[][]
  | undefined;

export const getSearch = (params: SearchRequest) => {
  return searchVM.search(params);
};

export const getGetSearchMutationOptions = <
  TError = unknown,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof getSearch>>,
    TError,
    SearchRequest,
    TContext
  >;
}): UseMutationOptions<
  Awaited<ReturnType<typeof getSearch>>,
  TError,
  SearchRequest,
  TContext
> => {
  const { mutation: mutationOptions } = options ?? {};

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof getSearch>>,
    SearchRequest
  > = (props) => {
    return getSearch(props);
  };

  return { mutationFn, ...mutationOptions };
};

export const useGetSearch = <TError = unknown, TContext = unknown>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof getSearch>>,
    TError,
    SearchRequest,
    TContext
  >;
}) => {
  const mutationOptions = getGetSearchMutationOptions(options);

  return useMutation(mutationOptions);
};
