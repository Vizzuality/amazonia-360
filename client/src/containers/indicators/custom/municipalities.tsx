import { useMemo } from "react";

import { AccessorKeyColumnDefBase } from "@tanstack/react-table";

import { formatNumber } from "@/lib/formats";
import { useGetIndicators, useQueryFeatures, useQueryFeatureId } from "@/lib/indicators";
import { useLocationGeometry } from "@/lib/location";

import { Indicator, ResourceFeature } from "@/app/local-api/indicators/route";
import { useSyncLocation } from "@/app/store";

import { CardLoader } from "@/containers/card";
import { DataTable } from "@/containers/widgets/table";

const INDICATORS = [
  { id: 8, name_en: "Administrative Capitals" },
  { id: 3, name_en: "Countries" },
  { id: 5, name_en: "Municipalities" },
  { id: 4, name_en: "States" },
];

export const Municipalities = ({ indicator }: { indicator: Indicator }) => {
  const [location] = useSyncLocation();
  const GEOMETRY = useLocationGeometry(location);

  const { data: indicatorsData } = useGetIndicators({
    select: (data) => data.filter((i) => INDICATORS.some((indicator) => indicator.id === i.id)),
  });

  const { id, resource } = indicator;

  const indicatorsTotals = useQueryFeatures(indicatorsData ?? [], GEOMETRY);

  const query = useQueryFeatureId({
    id,
    resource: resource as ResourceFeature,
    type: "table",
    geometry: GEOMETRY,
  });

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
      <p className="pb-4 pt-2 text-sm font-medium text-muted-foreground">
        The selected area intersects{" "}
        <span className="font-bold">
          {indicatorsTotals[3] || indicatorsTotals["Countries"]}{" "}
          {indicatorsTotals[3] || indicatorsTotals["Countries"] !== 1 ? "countries" : "country"},{" "}
          {indicatorsTotals[4] || indicatorsTotals["States"]}{" "}
          {indicatorsTotals[4] || indicatorsTotals["States"] !== 1 ? "states" : "state"},{" "}
          {indicatorsTotals[5] || indicatorsTotals["Municipalities"]}{" "}
          {indicatorsTotals[5] || indicatorsTotals["Municipalities"] !== 1
            ? "municipalities"
            : "municipality"}
          ,
        </span>{" "}
        and{" "}
        <span className="font-bold">
          {indicatorsTotals[8] || indicatorsTotals["Administrative Capitals"]}{" "}
          {indicatorsTotals[8] || indicatorsTotals["Administrative Capitals"] !== 1
            ? "capital cities"
            : "capital city"}
        </span>{" "}
        .
      </p>
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
          },
        }}
      />
    </CardLoader>
  );
};
