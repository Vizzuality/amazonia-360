import { QueryFunction, UseQueryOptions, useQuery } from "react-query";

import SearchVM from "@arcgis/core/widgets/Search/SearchViewModel";

import { env } from "@/env.mjs";

import { DATASETS } from "@/constants/datasets";

const searchVM = new SearchVM({
  popupEnabled: false,
  autoSelect: false,
  includeDefaultSources: false,
  sources: [
    {
      name: "Admin",
      layer: DATASETS.admin.layer,
      searchFields: ["NAME_0", "NAME_1", "NAME_2"],
      displayField: "COMPNAME",
      outFields: ["*"],
      maxResults: 1,
      maxSuggestions: 2,
      suggestionsEnabled: true,
      minSuggestCharacters: 1,
    },
    {
      name: "Ciudades Capitales",
      layer: DATASETS.ciudades_capitales.layer,
      searchFields: ["NAME_0", "NAME_1", "NAME_2"],
      displayField: "COMPNAME",
      outFields: ["*"],
      maxResults: 1,
      maxSuggestions: 2,
      suggestionsEnabled: true,
      minSuggestCharacters: 1,
    },
    {
      name: "ArcGIS World Geocoding Service",
      url: "https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer",
      singleLineFieldName: "SingleLine",
      apiKey: env.NEXT_PUBLIC_ARCGIS_API_KEY,
      countryCode: [
        "BRA",
        "BOL",
        "COL",
        "ECU",
        "GUY",
        "SUR",
        "PER",
        "VEN",
      ].join(","),
      outFields: ["*"],
      maxResults: 1,
      maxSuggestions: 2,
      suggestionsEnabled: true,
      minSuggestCharacters: 1,
    },
  ],
});

/**
 ************************************************************
 ************************************************************
 * Suggestions
 * useGetSuggestions
 ************************************************************
 ************************************************************
 */

export type GetSuggestParams = {
  text: string;
};
export const getSuggestions = async (params: GetSuggestParams) => {
  const { text } = params;

  if (!text) {
    throw new Error("text is required");
  }

  return searchVM.suggest(text);
};

export const getSuggestionsQueryKey = (params: GetSuggestParams) => {
  const { text } = params;
  return ["arcgis", "suggest", text] as const;
};

export const getSuggestionsQueryOptions = <
  TData = Awaited<ReturnType<typeof getSuggestions>>,
  TError = unknown,
>(
  params: GetSuggestParams,
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
  return { queryKey, queryFn, ...options } as UseQueryOptions<
    Awaited<ReturnType<typeof getSuggestions>>,
    TError,
    TData
  >;
};

export const useGetSuggestions = <
  TData = Awaited<ReturnType<typeof getSuggestions>>,
  TError = unknown,
>(
  params: GetSuggestParams,
  options?: UseQueryOptions<
    Awaited<ReturnType<typeof getSuggestions>>,
    TError,
    TData
  >,
) => {
  const { queryKey, queryFn } = getSuggestionsQueryOptions(params, options);

  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
};

/**
 ************************************************************
 ************************************************************
 * Search
 * useGetSearch
 ************************************************************
 ************************************************************
 */

export type GetSearchParams = __esri.SuggestResult | undefined;
export const getSearch = async (params: GetSearchParams) => {
  if (!params) return null;

  const { text, key, sourceIndex } = params;

  if (!text || !key || sourceIndex === undefined) {
    throw new Error("text, key and sourceIndex are required");
  }

  return searchVM.search(params);
};

export const getSearchQueryKey = (params: GetSearchParams) => {
  if (!params) return null;

  const { text, key, sourceIndex } = params;

  if (!text || !key || sourceIndex === undefined) {
    throw new Error("text, key and sourceIndex are required");
  }

  return ["arcgis", "suggest", text, key, sourceIndex] as const;
};

export const getSearchQueryOptions = <
  TData = Awaited<ReturnType<typeof getSearch>>,
  TError = unknown,
>(
  params?: GetSearchParams,
  options?: UseQueryOptions<
    Awaited<ReturnType<typeof getSearch>>,
    TError,
    TData
  >,
) => {
  const queryKey = options?.queryKey ?? getSearchQueryKey(params);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getSearch>>> = () =>
    getSearch(params);
  return { queryKey, queryFn, ...options } as UseQueryOptions<
    Awaited<ReturnType<typeof getSearch>>,
    TError,
    TData
  >;
};

export const useGetSearch = <
  TData = Awaited<ReturnType<typeof getSearch>>,
  TError = unknown,
>(
  params: GetSearchParams,
  options?: UseQueryOptions<
    Awaited<ReturnType<typeof getSearch>>,
    TError,
    TData
  >,
) => {
  const { queryKey, queryFn } = getSearchQueryOptions(params, options);

  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
};
