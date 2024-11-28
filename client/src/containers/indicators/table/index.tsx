import { useMemo, MouseEvent } from "react";

import { useQueryFeatureId } from "@/lib/indicators";

import { Indicator, ResourceFeature } from "@/app/api/indicators/route";

import {
  Card,
  CardContent,
  CardSettings,
  CardLoader,
  CardTitle,
  CardInfo,
  CardHeader,
  CardControls,
} from "@/containers/card";
import InfoArcGis from "@/containers/info/arcgis";
import { DataTable } from "@/containers/table";

export interface TableIndicatorsProps extends Indicator {
  resource: ResourceFeature;
  onEdit?: (e: MouseEvent<HTMLElement>) => void;
}

export const TableIndicators = ({ id, name, resource, onEdit }: TableIndicatorsProps) => {
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
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardControls>
          <CardInfo>
            <InfoArcGis id={id} />
          </CardInfo>
          {onEdit && <CardSettings id={id} onClick={onEdit} />}
        </CardControls>
      </CardHeader>
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
