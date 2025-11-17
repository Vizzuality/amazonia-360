import { useMemo } from "react";

import { AccessorKeyColumnDefBase } from "@tanstack/react-table";

import { formatNumber } from "@/lib/formats";
import { useQueryFeatureId } from "@/lib/indicators";
import { useLocationGeometry } from "@/lib/location";

import { Indicator, ResourceFeature } from "@/types/indicator";

import { CardLoader } from "@/containers/card";
import { useIndicator } from "@/containers/indicators/provider";
import { DataTable } from "@/containers/widgets/table";

import { Report } from "@/payload-types";

export interface TableIndicatorsFeatureProps extends Indicator {
  location: Report["location"];
  resource: ResourceFeature;
}

export const TableIndicatorsFeature = ({ id, resource, location }: TableIndicatorsFeatureProps) => {
  const GEOMETRY = useLocationGeometry(location);

  const { onIndicatorViewLoading, onIndicatorViewLoaded, onIndicatorViewError } = useIndicator();

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

  useMemo(() => {
    if (query.isLoading) {
      onIndicatorViewLoading(id);
    }

    if (query.isError) {
      onIndicatorViewError(id);
    }

    if (query.isSuccess) {
      onIndicatorViewLoaded(id);
    }
  }, [query, id, onIndicatorViewLoading, onIndicatorViewLoaded, onIndicatorViewError]);

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
