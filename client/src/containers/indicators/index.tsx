"use client";

import { useIndicators, useIndicatorsId } from "@/lib/indicators";

import { Indicator } from "@/app/api/indicators/route";

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
              <td>{indicator?.resource_name}</td>
            </tr>
            <tr>
              <td>Resource Type</td>
              <td>{indicator?.resource_type}</td>
            </tr>
            <tr>
              <td>Resource URL</td>
              <td>
                <a href={indicator?.resource_url} target="_blank" rel="noreferrer">
                  {indicator?.resource_url}
                </a>
              </td>
            </tr>
            <tr>
              <td>Visualization Types</td>
              <td>{indicator?.visualization_types.join(", ")}</td>
            </tr>
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
