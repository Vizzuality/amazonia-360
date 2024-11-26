import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { getQueryFeatureIdKey, getQueryImageryTileIdKey } from "@/lib/indicators";

import {
  Indicator,
  ResourceFeature,
  ResourceImageryTile,
  VisualizationType,
} from "@/app/api/indicators/route";

import { ChartIndicators } from "@/containers/indicators/chart";
import { ChartImageryIndicators } from "@/containers/indicators/chart/imagery";
import { MapIndicators } from "@/containers/indicators/map";
import { NumericIndicators } from "@/containers/indicators/numeric";
import { TableIndicators } from "@/containers/indicators/table";

import { Button } from "@/components/ui/button";

export const ResourceMap = (props: Indicator) => {
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

      <div className="not-prose">{enabled && <MapIndicators {...props} />}</div>
    </div>
  );
};

export const ResourceQueryFeature = (
  props: Indicator & {
    type: VisualizationType;
    resource: ResourceFeature;
  },
) => {
  const { resource, type } = props;
  const queryClient = useQueryClient();
  const [enabled, setEnabled] = useState(false);

  return (
    <div className="space-y-5">
      <div>
        <pre>{JSON.stringify(resource[`query_${type}`], null, 2)}</pre>
        <Button
          size="sm"
          onClick={() => {
            const key = getQueryFeatureIdKey({ resource, type });
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
        {type === "table" && enabled && <TableIndicators resource={resource} />}
        {type === "chart" && enabled && <ChartIndicators resource={resource} />}
        {type === "numeric" && enabled && <NumericIndicators resource={resource} />}
      </div>
    </div>
  );
};

export const ResourceQueryImageryTile = (
  props: Indicator & {
    type: VisualizationType;
    resource: ResourceImageryTile;
  },
) => {
  const { resource, type } = props;
  const queryClient = useQueryClient();
  const [enabled, setEnabled] = useState(false);

  return (
    <div className="space-y-5">
      <div>
        <Button
          size="sm"
          onClick={() => {
            const key = getQueryImageryTileIdKey({ resource, type });
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
        {type === "chart" && enabled && <ChartImageryIndicators {...props} />}
      </div>
    </div>
  );
};
