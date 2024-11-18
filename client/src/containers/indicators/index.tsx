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

import { Button } from "@/components/ui/button";

export const ResourceQueryFeature = ({
  type,
  resource,
}: {
  type: VisualizationType;
  resource: ResourceFeature;
}) => {
  const queryClient = useQueryClient();
  const [enabled, setEnabled] = useState(false);
  const { data } = useQueryFeatureId({ resource, type }, { enabled });

  console.info(data);

  return (
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
  );
};

export const IndicatorItem = ({ id }: { id: Indicator["id"] }) => {
  const indicator = useIndicatorsId(id);

  return (
    <div className="space-y-2">
      <h2 className="text-xl">{indicator?.name}</h2>
      <div className="prose prose-sm max-w-none">
        <table className="w-full">
          <tbody>
            <tr>
              <td>Topic</td>
              <td>
                {indicator?.topic_id} - {indicator?.topic_name}
              </td>
            </tr>
            <tr>
              <td>Resource</td>
              <td>{indicator?.resource.name}</td>
            </tr>
            <tr>
              <td>Resource Type</td>
              <td>{indicator?.resource.type}</td>
            </tr>
            <tr>
              <td>Resource URL</td>
              <td>
                <a href={indicator?.resource.url} target="_blank" rel="noreferrer">
                  {indicator?.resource.url}
                </a>
              </td>
            </tr>
            <tr>
              <td>Visualization Types</td>
              <td>{indicator?.visualization_types.join(", ")}</td>
            </tr>
            {indicator?.visualization_types.map((type) => {
              if (indicator?.resource.type === "feature") {
                const r = indicator.resource;

                return (
                  <tr key={type}>
                    <td>Query {type[0].toUpperCase() + type.slice(1)}</td>
                    <td>
                      <ResourceQueryFeature type={type} resource={r} />
                    </td>
                  </tr>
                );
              }

              return null;
            })}
            <tr>
              <td>H3 Grid Column Name</td>
              <td>{indicator?.h3_grid_column_name || "-"}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const Indicators = () => {
  const { data } = useIndicators();

  return (
    <section className="py-10">
      <div className="container">
        <ul className="flex flex-col gap-6">
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
