"use client";

import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import {
  getQueryFeatureIdKey,
  useIndicators,
  useIndicatorsId,
  useQueryFeatureId,
} from "@/lib/indicators";

import { Indicator, ResourceFeature, VisualizationType } from "@/app/api/indicators/route";

import { ChartIndicators } from "@/containers/indicators/chart";
import { NumericIndicators } from "@/containers/indicators/numeric";
import { TableIndicators } from "@/containers/indicators/table";

import { Button } from "@/components/ui/button";

export const ResourceQueryFeature = ({
  type,
  resource,
}: Indicator & {
  type: VisualizationType;
  resource: ResourceFeature;
}) => {
  const queryClient = useQueryClient();
  const [enabled, setEnabled] = useState(false);
  const { data } = useQueryFeatureId({ resource, type }, { enabled });

  console.info(data);

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

export const IndicatorItem = ({ id }: { id: Indicator["id"] }) => {
  const indicator = useIndicatorsId(id);

  return (
    <div className="space-y-5">
      <h2 className="text-3xl">{indicator?.name}</h2>
      <div className="prose prose-sm max-w-none">
        <table className="w-full">
          <tbody>
            <tr>
              <td className="w-60">Topic</td>
              <td>
                {indicator?.topic_id} - {indicator?.topic_name}
              </td>
            </tr>
            <tr>
              <td className="w-60">Resource</td>
              <td>{indicator?.resource.name}</td>
            </tr>
            <tr>
              <td className="w-60">Resource Type</td>
              <td>{indicator?.resource.type}</td>
            </tr>
            <tr>
              <td className="w-60">Resource URL</td>
              <td>
                <a href={indicator?.resource.url} target="_blank" rel="noreferrer">
                  {indicator?.resource.url}
                </a>
              </td>
            </tr>
            <tr>
              <td className="w-60">Visualization Types</td>
              <td>{indicator?.visualization_types.join(", ")}</td>
            </tr>
            {indicator?.visualization_types.map((type) => {
              if (indicator?.resource.type === "feature") {
                const r = indicator.resource;

                return (
                  <tr key={type}>
                    <td>Query {type[0].toUpperCase() + type.slice(1)}</td>
                    <td>
                      <ResourceQueryFeature {...indicator} type={type} resource={r} />
                    </td>
                  </tr>
                );
              }

              return null;
            })}
            <tr>
              <td className="w-60">H3 Grid Column Name</td>
              <td>{indicator?.h3_grid_column_name || "-"}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const Indicators = () => {
  const { data } = useIndicators({
    refetchOnWindowFocus: "always",
    refetchOnMount: "always",
    refetchOnReconnect: "always",
  });

  return (
    <section className="py-10">
      <div className="container">
        <ul className="flex flex-col gap-20">
          {data?.map((indicator) => (
            <li key={indicator.id}>
              <IndicatorItem id={indicator.id} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
