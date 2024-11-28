import { useMemo } from "react";

import { useQueryFeatureId } from "@/lib/indicators";

import { Indicator, ResourceFeature } from "@/app/api/indicators/route";

import { Card, CardContent, CardLoader, CardTitle } from "@/containers/card";
import { DataTable } from "@/containers/table";

export interface TableIndicatorsProps extends Indicator {
  resource: ResourceFeature;
}

export const TableIndicators = ({ name, resource }: TableIndicatorsProps) => {
  const query = useQueryFeatureId({ resource, type: "table" });

  const DATA = useMemo(() => {
    if (!query.data) return [];

    return query.data.features.map((feature) => {
      return feature.attributes;
    });
  }, [query.data]);

  const COLUMNS = useMemo(() => {
    if (!query.data) return [];

    return query.data.fields.map((field) => {
      return {
        header: field.alias || field.name,
        accessorKey: field.alias || field.name,
      };
    });
  }, [query.data]);

  return (
    <Card>
      <CardTitle>{name}</CardTitle>
      <CardContent>
        <CardLoader query={[query]} className="h-72">
          <DataTable
            data={DATA}
            columns={COLUMNS}
            tableOptions={{
              initialState: {
                sorting: [
                  {
                    id: COLUMNS[0]?.accessorKey,
                    desc: false,
                  },
                ],
              },
            }}
          />
        </CardLoader>
      </CardContent>
    </Card>
  );
};
