import * as projection from "@arcgis/core/geometry/projection.js";
import SearchVM from "@arcgis/core/widgets/Search/SearchViewModel";
import {
  MutationFunction,
  QueryFunction,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";

import { DATASETS } from "@/constants/datasets";

const searchVM = new SearchVM({
  popupEnabled: false,
  autoSelect: false,
  includeDefaultSources: false,

  sources: [
    {
      name: "Admin0",
      layer: DATASETS.admin0.layer,
      searchFields: ["NAME_0"],
      displayField: "COMPNAME",
      outFields: ["*"],
      maxResults: 1,
      maxSuggestions: 2,
      suggestionsEnabled: true,
      minSuggestCharacters: 1,
    },
    {
      name: "Admin1",
      layer: DATASETS.admin1.layer,
      searchFields: ["NAME_0", "NAME_1"],
      displayField: "COMPNAME",
      outFields: ["*"],
      maxResults: 1,
      maxSuggestions: 2,
      suggestionsEnabled: true,
      minSuggestCharacters: 1,
    },
    {
      name: "Admin2",
      layer: DATASETS.admin2.layer,
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
      searchFields: ["NOMBCAP", "NAME_0", "NAME_1", "NAME_2"],
      displayField: "COMPNAME",
      outFields: ["*"],
      maxResults: 1,
      maxSuggestions: 2,
      suggestionsEnabled: true,
      minSuggestCharacters: 1,
    },
    // {
    //   name: "ArcGIS World Geocoding Service",
    //   url: "https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer",
    //   singleLineFieldName: "SingleLine",
    //   countryCode: ["BRA", "BOL", "COL", "ECU", "PER", "VEN"].join(","),
    //   outFields: ["*"],
    //   maxResults: 1,
    //   maxSuggestions: 2,
    //   suggestionsEnabled: true,
    //   minSuggestCharacters: 1,
    // },
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
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getSuggestions>>, TError, TData>,
    "queryKey"
  >,
) => {
  const queryKey = getSuggestionsQueryKey(params);
  const queryFn: QueryFunction<
    Awaited<ReturnType<typeof getSuggestions>>
  > = () => getSuggestions(params);
  return { queryKey, queryFn, ...options };
};

export const useGetSuggestions = <
  TData = Awaited<ReturnType<typeof getSuggestions>>,
  TError = unknown,
>(
  params: GetSuggestParams,
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getSuggestions>>, TError, TData>,
    "queryKey"
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

export type GetSearchParams = __esri.SuggestResult | null | undefined;
export const getSearch = async (params: GetSearchParams) => {
  if (!params) return null;

  const { text, key, sourceIndex } = params;

  if (!text || !key || sourceIndex === undefined) {
    console.error("text, key and sourceIndex are required");
  }

  const g = await searchVM.search(params).then((res) => {
    if (res.numResults === 1) {
      const r = res.results[0].results[0];

      const projectedGeo = projection.project(r.feature.geometry, {
        wkid: 102100,
      });
      const g = Array.isArray(projectedGeo) ? projectedGeo[0] : projectedGeo;

      return {
        type: g.type,
        geometry: g.toJSON(),
      };
    }
    return null;
  });

  return g;
};

export const getSearchQueryKey = (params: GetSearchParams) => {
  if (!params) return ["arcgis", "suggest", ""] as const;

  const { text, key, sourceIndex } = params;

  if (!text || !key || sourceIndex === undefined) {
    console.error("text, key and sourceIndex are required");
  }

  return ["arcgis", "suggest", text, key, sourceIndex] as const;
};

export const getSearchQueryOptions = <
  TData = Awaited<ReturnType<typeof getSearch>>,
  TError = unknown,
>(
  params?: GetSearchParams,
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getSearch>>, TError, TData>,
    "queryKey"
  >,
) => {
  const queryKey = getSearchQueryKey(params);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getSearch>>> = () =>
    getSearch(params);
  return { queryKey, queryFn, ...options };
};

export const useGetSearch = <
  TData = Awaited<ReturnType<typeof getSearch>>,
  TError = unknown,
>(
  params: GetSearchParams,
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getSearch>>, TError, TData>,
    "queryKey"
  >,
) => {
  const { queryKey, queryFn } = getSearchQueryOptions(params, options);

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
 * useGetMutationSearch
 ************************************************************
 ************************************************************
 */

export const getSearchMutationOptions = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    Awaited<ReturnType<typeof getSearch>>,
    TError,
    __esri.SuggestResult,
    TContext
  >,
): UseMutationOptions<
  Awaited<ReturnType<typeof getSearch>>,
  TError,
  __esri.SuggestResult,
  TContext
> => {
  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof getSearch>>,
    __esri.SuggestResult
  > = (props) => getSearch(props);

  return { mutationFn, ...options };
};

export const useGetMutationSearch = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    Awaited<ReturnType<typeof getSearch>>,
    TError,
    __esri.SuggestResult,
    TContext
  >,
) => {
  const mutationOptions = getSearchMutationOptions(options);

  return useMutation(mutationOptions);
};
