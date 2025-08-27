import { useMemo } from "react";

import { AccessorKeyColumnDefBase } from "@tanstack/react-table";

import { formatNumber } from "@/lib/formats";
import { useQueryFeatureId } from "@/lib/indicators";
import { useLocationGeometry } from "@/lib/location";

import { Indicator, ResourceFeature } from "@/types/indicator";

import { useSyncLocation } from "@/app/store";

import { CardLoader } from "@/containers/card";
import { DataTable } from "@/containers/widgets/table";

export interface TableIndicatorsProps extends Indicator {
  resource: ResourceFeature;
}

export const TableIndicators = ({ id, resource }: TableIndicatorsProps) => {
  const [location] = useSyncLocation();
  const GEOMETRY = useLocationGeometry(location);

  const query = useQueryFeatureId({ id, resource, type: "table", geometry: GEOMETRY });

  const DATA = useMemo(() => {
    if (!query.data) return [];

    return query.data.features.map((feature) => {
      return feature.attributes;
    });
  }, [query.data]);

  const COLUMNS = useMemo<AccessorKeyColumnDefBase<unknown>[]>(() => {
    if (!query.data) return [];

    return query.data.fields.map((field) => {
      return {
        header: field.alias || field.name,
        accessorKey: field.alias || field.name,
        sortDescFirst: field.type === "double",
        cell: (props) => {
          const v = props.getValue();
          if (typeof v === "number") {
            return formatNumber(v);
          }
          return v;
        },
      };
    });
  }, [query.data]);

  return (
    <CardLoader query={[query]} className="h-72">
      <DataTable
        data={DATA}
        columns={COLUMNS}
        tableOptions={{
          initialState: {
            sorting: [
              {
                id: COLUMNS[0]?.accessorKey,
                desc: !!COLUMNS[0]?.sortDescFirst,
              },
            ],
            pagination: {
              pageSize: 9,
            },
          },
        }}
      />
    </CardLoader>
  );
};
