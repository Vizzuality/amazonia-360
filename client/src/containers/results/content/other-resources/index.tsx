"use client";

import { useMemo, useState } from "react";

import { flatGroup } from "@visx/vendor/d3-array";
import { useTranslations } from "next-intl";

import { useLocationGadm } from "@/lib/location";
import { useGetFeatures } from "@/lib/query";

import { useSyncLocation } from "@/app/(frontend)/store";

import { DATASETS } from "@/constants/datasets";

import { CardLoader, CardNoData } from "@/containers/card";
import OtherResourcesGroup from "@/containers/results/content/other-resources/group";
import { ResourceProps } from "@/containers/results/content/other-resources/types";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function OtherResources() {
  const t = useTranslations();
  const [tab, setTab] = useState("all");

  const [location] = useSyncLocation();

  const queryGadm = useLocationGadm(location);

  const query = useGetFeatures(
    {
      query: DATASETS.acu_knowledge.getFeatures({
        ...(!!queryGadm.data?.gid0 && {
          orderByFields: ["Year DESC", "Month DESC"],
          // where: `CountryIso in (${queryGadm.data?.gid0.map((g) => `'${g}'`)})`,
          where: queryGadm.data?.gid0.map((g) => `CountryIso LIKE '%${g}%'`).join(" OR "),
        }),
      }),
      feature: DATASETS.acu_knowledge.layer,
    },
    {
      enabled: !!DATASETS.acu_knowledge.getFeatures && !!queryGadm.data?.gid0,
      select(data): ResourceProps[] {
        return data.features.map((f) => f.attributes);
      },
    },
  );

  const GROUPS = useMemo(() => {
    if (!query.data) return [];

    const groups = flatGroup(query.data, (d) => d.Type);

    return groups.toSorted((a, b) => a[0].localeCompare(b[0]));
  }, [query.data]);

  return (
    <div className="container print:break-before-page">
      <h2 className="mb-4 text-2xl font-semibold text-primary">{t("knowledge-resources")}</h2>

      <CardLoader query={[query]} className="h-80">
        <CardNoData query={[query]}>
          <Tabs defaultValue={tab} className="flex flex-col items-start space-y-4">
            <TabsList className="flex-wrap justify-start gap-x-4 gap-y-1 space-x-0 print:hidden">
              <TabsTrigger value="all" onClick={() => setTab("all")}>
                {t("all")} ({query.data?.length || 0})
              </TabsTrigger>

              {GROUPS.map((group) => (
                <TabsTrigger key={group[0]} value={group[0]} onClick={() => setTab(group[0])}>
                  {group[0]} ({group[1].length})
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent className="w-full" value="all">
              <OtherResourcesGroup data={query.data} />
            </TabsContent>

            {GROUPS.map((group) => (
              <TabsContent className="w-full" key={group[0]} value={group[0]}>
                <OtherResourcesGroup data={group[1]} />
              </TabsContent>
            ))}
          </Tabs>
        </CardNoData>
      </CardLoader>
    </div>
  );
}
