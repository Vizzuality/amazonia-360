"use client";

import { useLocationGeometry } from "@/lib/location";
import { useGetFeatures, useGetIntersectionAnalysis } from "@/lib/query";

import { useSyncLocation } from "@/app/store";

import { DATASETS } from "@/constants/datasets";

import { Card, CardLoader, CardTitle } from "@/containers/card";
import { columns } from "@/containers/widgets/protection/protected-areas/columns";
import WidgetProtectedAreasHeader from "@/containers/widgets/protection/protected-areas/header";
import { ProtectedAreas } from "@/containers/widgets/protection/protected-areas/types";
import { DataTable } from "@/containers/widgets/table";

import { NoData } from "@/components/ui/no-data";

export default function WidgetProtectedAreas() {
  const [location] = useSyncLocation();

  const GEOMETRY = useLocationGeometry(location);

  const queryProtected = useGetFeatures(
    {
      query: DATASETS.areas_protegidas.getFeatures({
        ...(!!GEOMETRY && {
          orderByFields: ["NAME"],
          geometry: GEOMETRY,
        }),
      }),
      feature: DATASETS.areas_protegidas.layer,
    },
    {
      enabled: !!DATASETS.areas_protegidas.getFeatures && !!GEOMETRY,
      select(data): ProtectedAreas[] {
        return data.features.map((f) => f.attributes);
      },
    },
  );

  const queryProtectedCoverage = useGetIntersectionAnalysis({
    id: "areas_protegidas",
    polygon: GEOMETRY,
  });

  return (
    <Card>
      <CardTitle>Protected areas</CardTitle>
      <div className="mt-3">
        <CardLoader
          query={[queryProtected, queryProtectedCoverage]}
          className="h-72"
        >
          {!!queryProtected.data?.length && (
            <div className="space-y-2">
              <WidgetProtectedAreasHeader
                protectedAreas={queryProtected.data ?? []}
                protectedAreaCoverage={
                  queryProtectedCoverage.data?.percentage ?? 0
                }
              />

              <DataTable
                columns={columns}
                data={queryProtected.data ?? []}
                tableOptions={{
                  initialState: {
                    pagination: {
                      pageIndex: 0,
                      pageSize: 7,
                    },
                    sorting: [
                      {
                        id: "NAME",
                        desc: false,
                      },
                    ],
                  },
                }}
              />
            </div>
          )}
          <NoData query={[queryProtected]} />
        </CardLoader>
      </div>
    </Card>
  );
}
