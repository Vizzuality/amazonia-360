"use client";

import { useLocationGeometry } from "@/lib/location";
import { useGetFeatures } from "@/lib/query";

import { useSyncLocation } from "@/app/store";

import { DATASETS } from "@/constants/datasets";

import {
  Card,
  CardContent,
  CardHeader,
  CardInfo,
  CardLoader,
  CardNoData,
  CardTitle,
} from "@/containers/card";
import { columns } from "@/containers/widgets/financial/idb-operations/columns";
import { IDBOperation } from "@/containers/widgets/financial/types";
import { DataTable } from "@/containers/widgets/table";

export default function WidgetIDBOperations() {
  const [location] = useSyncLocation();

  const GEOMETRY = useLocationGeometry(location);

  const query = useGetFeatures(
    {
      query: DATASETS.idb_operations.getFeatures({
        ...(!!GEOMETRY && {
          geometry: GEOMETRY,
        }),
      }),
      feature: DATASETS.idb_operations.layer,
    },
    {
      enabled: !!DATASETS.idb_operations.getFeatures && !!GEOMETRY,
      select(data): IDBOperation[] {
        return data.features.map((f) => f.attributes);
      },
    },
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>IDB operations</CardTitle>
        <CardInfo ids={[+"idb_operations"]} />
      </CardHeader>

      <CardContent className="space-y-2">
        <CardLoader query={[query]} className="h-72">
          <CardNoData query={[query]}>
            <DataTable
              columns={columns}
              data={query.data ?? []}
              tableOptions={{
                initialState: {
                  pagination: {
                    pageIndex: 0,
                    pageSize: 5,
                  },
                  sorting: [
                    {
                      id: "opername",
                      desc: false,
                    },
                  ],
                },
              }}
            />
          </CardNoData>
        </CardLoader>
      </CardContent>
    </Card>
  );
}
