"use client";

import { useLocationGeometry } from "@/lib/location";
import { useGetFeatures } from "@/lib/query";

import { useSyncLocation } from "@/app/store";

import { DATASETS } from "@/constants/datasets";

import {
  Card,
  CardContent,
  CardLoader,
  CardNoData,
  CardTitle,
} from "@/containers/card";
import { columns } from "@/containers/widgets/overview/administrative-boundaries/columns";
import WidgetAdministrativeBoundariesHeader from "@/containers/widgets/overview/administrative-boundaries/header";
import {
  AdministrativeBoundary,
  City,
} from "@/containers/widgets/overview/administrative-boundaries/types";
import { DataTable } from "@/containers/widgets/table";

export default function WidgetAdministrativeBoundaries() {
  const [location] = useSyncLocation();

  const GEOMETRY = useLocationGeometry(location);

  const queryAdmin = useGetFeatures(
    {
      query: DATASETS.admin2.getFeatures({
        ...(!!GEOMETRY && {
          orderByFields: ["NAME_0"],
          geometry: GEOMETRY,
        }),
      }),
      feature: DATASETS.admin2.layer,
    },
    {
      enabled: !!DATASETS.admin2.getFeatures && !!GEOMETRY,
      select(data): AdministrativeBoundary[] {
        return data.features.map((f) => f.attributes);
      },
    },
  );

  const queryCities = useGetFeatures(
    {
      query: DATASETS.ciudades_capitales.getFeatures({
        ...(!!GEOMETRY && {
          geometry: GEOMETRY,
        }),
      }),
      feature: DATASETS.ciudades_capitales.layer,
    },
    {
      enabled: !!DATASETS.ciudades_capitales.getFeatures && !!GEOMETRY,
      select(data): City[] {
        return data.features.map((f) => f.attributes);
      },
    },
  );

  return (
    <Card>
      <CardTitle>Administrative Boundaries</CardTitle>
      <CardContent className="space-y-2">
        <CardLoader query={[queryAdmin, queryCities]} className="h-72">
          <CardNoData query={[queryAdmin, queryCities]}>
            <WidgetAdministrativeBoundariesHeader
              administrativeBoundaries={queryAdmin.data ?? []}
              cities={queryCities.data ?? []}
            />

            <DataTable
              columns={columns}
              data={queryAdmin.data ?? []}
              tableOptions={{
                initialState: {
                  pagination: {
                    pageIndex: 0,
                    pageSize: 7,
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
          </CardNoData>
        </CardLoader>
      </CardContent>
    </Card>
  );
}
