import "server-only";

import { getPayload } from "payload";

import { QueryClient } from "@tanstack/react-query";
import { Locale } from "next-intl";

import {
  getCountryModule,
  getCountryModulesReadArgs,
  getPartner,
  getPartnersReadArgs,
} from "@/lib/cms-content";

import config from "@/payload.config";

import { getCountryModulesQueryOptions, getPartnersQueryOptions } from "./queries";

// Seeded through the Local API rather than the factories' REST `queryFn`: the server would
// otherwise call itself over HTTP on every page render.
export async function prefetchCountryModules(queryClient: QueryClient, locale: Locale) {
  const payload = await getPayload({ config });
  const [modules, partners] = await Promise.all([
    payload.find({ collection: "country-modules", ...getCountryModulesReadArgs(locale) }),
    payload.find({ collection: "partners", ...getPartnersReadArgs(locale) }),
  ]);

  queryClient.setQueryData(
    getCountryModulesQueryOptions(locale).queryKey,
    modules.docs.map(getCountryModule),
  );
  queryClient.setQueryData(getPartnersQueryOptions(locale).queryKey, partners.docs.map(getPartner));
}
