import { useMemo, useState } from "react";

import { flatGroup } from "@visx/vendor/d3-array";

import { useLocationGeometry } from "@/lib/location";
import { useGetFeatures } from "@/lib/query";

import { useSyncLocation } from "@/app/store";

import { DATASETS } from "@/constants/datasets";

import WidgetsColumn from "@/containers/widgets/column";
import Resource from "@/containers/widgets/other-resources/resource";
import { ResourceProps } from "@/containers/widgets/other-resources/types";
import WidgetsRow from "@/containers/widgets/row";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function OtherResources() {
  const [tab, setTab] = useState("all");

  const [location] = useSyncLocation();

  const GEOMETRY = useLocationGeometry(location);

  const query = useGetFeatures(
    {
      query: DATASETS.acu_knowledge.getFeatures({
        ...(!!GEOMETRY && {
          orderByFields: ["Name"],
          geometry: GEOMETRY,
        }),
      }),
      feature: DATASETS.acu_knowledge.layer,
    },
    {
      enabled: !!DATASETS.acu_knowledge.getFeatures && !!GEOMETRY,
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
      <h2 className="text-xl font-semibold mb-4">Other resources</h2>
      <Tabs defaultValue={tab} className="flex flex-col space-y-4 items-start">
        <TabsList>
          <TabsTrigger value="all" onClick={() => setTab("all")}>
            All ({query.data?.length || 0})
          </TabsTrigger>

          {GROUPS.map((group) => (
            <TabsTrigger
              key={group[0]}
              value={group[0]}
              onClick={() => setTab(group[0])}
            >
              {group[0]} ({group[1].length})
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent className="w-full" value="all">
          <WidgetsRow className="print:grid-cols-2">
            {query.data?.map((r, idx) => (
              <WidgetsColumn
                className="col-span-3 print:col-span-1 print:[&:nth-child(7n)]:break-before-page"
                key={idx}
              >
                <Resource key={idx} {...r} />
              </WidgetsColumn>
            ))}
          </WidgetsRow>
        </TabsContent>

        {GROUPS.map((group) => (
          <TabsContent className="w-full" key={group[0]} value={group[0]}>
            <WidgetsRow className="print:grid-cols-2">
              {group[1].map((r, idx) => (
                <WidgetsColumn
                  className="col-span-3 print:col-span-1 print:[&:nth-child(7n)]:break-before-page"
                  key={idx}
                >
                  <Resource key={idx} {...r} />
                </WidgetsColumn>
              ))}
            </WidgetsRow>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
