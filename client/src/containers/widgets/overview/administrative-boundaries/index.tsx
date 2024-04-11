"use client";

import { useLocationGeometry } from "@/lib/location";
import { useGetFeatures } from "@/lib/query";

import { useSyncLocation } from "@/app/store";

import { DATASETS } from "@/constants/datasets";

import { Card, CardLoader, CardTitle } from "@/containers/card";
import {
  AdministrativeBoundary,
  columns,
} from "@/containers/widgets/overview/administrative-boundaries/columns";
import { DataTable } from "@/containers/widgets/table";

export default function WidgetAdministrativeBoundaries() {
  const [location] = useSyncLocation();

  const GEOMETRY = useLocationGeometry(location);

  const query = useGetFeatures(
    {
      query: DATASETS.admin.getFeatures({
        ...(!!GEOMETRY && {
          orderByFields: ["NAME_0"],
          geometry: GEOMETRY,
        }),
      }),
      feature: DATASETS.admin.layer,
    },
    {
      enabled: !!DATASETS.admin.getFeatures && !!GEOMETRY,
      select(data): AdministrativeBoundary[] {
        return data.features.map((f) => f.attributes);
      },
    },
  );

  return (
    <Card>
      <CardTitle>Administrative Boundaries</CardTitle>
      <div className="mt-3">
        <CardLoader query={query} className="h-72">
          <div className="space-y-2">
            <p className="text-sm font-medium">
              The selected area intersects 1 state, 4 municipalities and 5
              capital cities, including state capital Cobija.
            </p>

            <DataTable
              columns={columns}
              data={query.data ?? []}
              tableOptions={{
                initialState: {
                  pagination: {
                    pageIndex: 0,
                    pageSize: 6,
                  },
                  sorting: [
                    {
                      id: "NAME_1",
                      desc: false,
                    },
                  ],
                },
              }}
            />
          </div>
        </CardLoader>
      </div>
    </Card>
  );
}
