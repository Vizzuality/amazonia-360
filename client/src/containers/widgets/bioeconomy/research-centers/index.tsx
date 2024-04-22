"use client";

import { useLocationGeometry } from "@/lib/location";
import { useGetFeatures } from "@/lib/query";

import { useSyncLocation } from "@/app/store";

import { DATASETS } from "@/constants/datasets";

import { Card, CardLoader, CardTitle } from "@/containers/card";
import {
  ResearchCenter,
  columns,
} from "@/containers/widgets/bioeconomy/research-centers/columns";
import { DataTable } from "@/containers/widgets/table";

export default function WidgetResearchCenters() {
  const [location] = useSyncLocation();

  const GEOMETRY = useLocationGeometry(location);

  const query = useGetFeatures(
    {
      query: DATASETS.institutional_tracking.getFeatures({
        ...(!!GEOMETRY && {
          orderByFields: ["Org_Name"],
          geometry: GEOMETRY,
          returnGeometry: false,
        }),
      }),
      feature: DATASETS.institutional_tracking.layer,
    },
    {
      enabled: !!DATASETS.institutional_tracking.getFeatures && !!GEOMETRY,
      select(data): ResearchCenter[] {
        return data.features.map((f) => f.attributes);
      },
    },
  );

  return (
    <Card>
      <CardTitle>Research centers</CardTitle>
      <CardLoader query={[query]} className="h-72">
        <DataTable
          columns={columns}
          data={query.data ?? []}
          tableOptions={{
            initialState: {
              pagination: {
                pageIndex: 0,
                pageSize: 7,
              },
              sorting: [
                {
                  id: "Org_Name",
                  desc: false,
                },
              ],
            },
          }}
        />
      </CardLoader>
    </Card>
  );
}
