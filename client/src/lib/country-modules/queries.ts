import { queryOptions, useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";

import { fetchCountryModules, fetchPartners } from "@/lib/cms-content";

import type { CountryModule, Partner } from "./types";

const NO_MODULES: readonly CountryModule[] = [];
const NO_PARTNERS: readonly Partner[] = [];
const NO_SLUGS: readonly string[] = [];

export const getCountryModulesQueryOptions = (locale: string) =>
  queryOptions({
    queryKey: ["country-modules", locale] as const,
    queryFn: () => fetchCountryModules({ locale }),
    staleTime: Infinity,
  });

export const getPartnersQueryOptions = (locale: string) =>
  queryOptions({
    queryKey: ["partners", locale] as const,
    queryFn: () => fetchPartners({ locale }),
    staleTime: Infinity,
  });

const getSlugs = (modules: CountryModule[]): readonly string[] => modules.map(({ slug }) => slug);

export const useGetCountryModules = (): readonly CountryModule[] => {
  const { data } = useQuery(getCountryModulesQueryOptions(useLocale()));
  return data ?? NO_MODULES;
};

export const useGetPartners = (): readonly Partner[] => {
  const { data } = useQuery(getPartnersQueryOptions(useLocale()));
  return data ?? NO_PARTNERS;
};

export const useGetActiveModuleSlugs = (): readonly string[] => {
  const { data } = useQuery({ ...getCountryModulesQueryOptions(useLocale()), select: getSlugs });
  return data ?? NO_SLUGS;
};
