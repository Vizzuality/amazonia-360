import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { getQueryFeatureIdKey, getQueryImageryTileIdKey } from "@/lib/indicators";
import { useLocationGeometry } from "@/lib/location";

import {
  Indicator,
  ResourceFeature,
  ResourceImageryTile,
  ResourceWebTile,
  VisualizationTypes,
} from "@/app/local-api/indicators/route";
import { useSyncLocation } from "@/app/store";

import { ChartIndicators } from "@/containers/indicators/chart";
import { ChartImageryIndicators } from "@/containers/indicators/chart/imagery";
import { MapIndicators } from "@/containers/indicators/map";
import { NumericIndicators } from "@/containers/indicators/numeric";
import { NumericImageryIndicators } from "@/containers/indicators/numeric/imagery";
import { TableIndicators } from "@/containers/indicators/table";

import { Button } from "@/components/ui/button";

export const ResourceMap = (
  props: Omit<Indicator, "resource"> & {
    resource: ResourceWebTile | ResourceFeature | ResourceImageryTile;
  },
) => {
  const [enabled, setEnabled] = useState(false);

  return (
    <div className="space-y-5">
      <div>
        <Button
          size="sm"
          onClick={() => {
            setEnabled(true);
          }}
        >
          Show
        </Button>
      </div>

      <div className="not-prose">
        {enabled && (
          <div className="h-72">
            <MapIndicators {...props} />
          </div>
        )}
      </div>
    </div>
  );
};

export const ResourceQueryFeature = (
  props: Indicator & {
    type: VisualizationTypes;
    resource: ResourceFeature;
  },
) => {
  const [location] = useSyncLocation();
  const GEOMETRY = useLocationGeometry(location);

  const { id, resource, type } = props;
  const queryClient = useQueryClient();
  const [enabled, setEnabled] = useState(false);

  return (
    <div className="space-y-5">
      <div>
        <pre>{JSON.stringify(resource[`query_${type}`], null, 2)}</pre>
        <Button
          size="sm"
          onClick={() => {
            const key = getQueryFeatureIdKey({ id, resource, type, geometry: GEOMETRY });
            queryClient.invalidateQueries({
              queryKey: key,
            });
            setEnabled(true);
          }}
        >
          Run Query
        </Button>
      </div>

      <div className="not-prose">
        {type === "table" && enabled && <TableIndicators {...props} />}
        {type === "chart" && enabled && (
          <div className="flex h-60 flex-col">
            <ChartIndicators {...props} />
          </div>
        )}
        {type === "numeric" && enabled && <NumericIndicators {...props} />}
      </div>
    </div>
  );
};

export const ResourceQueryImageryTile = (
  props: Indicator & {
    type: VisualizationTypes;
    resource: ResourceImageryTile;
  },
) => {
  const [location] = useSyncLocation();
  const GEOMETRY = useLocationGeometry(location);

  const { id, resource, type } = props;
  const queryClient = useQueryClient();
  const [enabled, setEnabled] = useState(false);

  return (
    <div className="space-y-5">
      <div>
        <Button
          size="sm"
          onClick={() => {
            const key = getQueryImageryTileIdKey({
              id,
              resource,
              type,
              geometry: GEOMETRY,
            });
            queryClient.invalidateQueries({
              queryKey: key,
            });
            setEnabled(true);
          }}
        >
          Run Query
        </Button>
      </div>

      <div className="not-prose">
        {type === "numeric" && enabled && <NumericImageryIndicators {...props} />}
        {type === "chart" && enabled && (
          <div className="flex h-60 flex-col">
            <ChartImageryIndicators {...props} />
          </div>
        )}
      </div>
    </div>
  );
};
