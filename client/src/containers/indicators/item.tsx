import { useIndicatorsId } from "@/lib/indicators";

import { Indicator } from "@/app/local-api/indicators/route";
import {
  ResourceFeature,
  ResourceImageryTile,
  ResourceWebTile,
} from "@/app/local-api/indicators/route";

import {
  ResourceMap,
  ResourceQueryFeature,
  ResourceQueryImageryTile,
} from "@/containers/indicators/resources";

export const IndicatorItem = ({ id }: { id: Indicator["id"] }) => {
  const indicator = useIndicatorsId(id);

  return (
    <div className="space-y-5">
      <h2 className="text-3xl">{indicator?.name_en}</h2>
      <div className="prose prose-sm max-w-none">
        <table className="w-full">
          <tbody>
            <tr>
              <td className="w-60">Topic</td>
              <td>
                {indicator?.topic.id} - {indicator?.topic.name_en}
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
              <td>{(indicator?.visualization_types || [])?.join(", ")}</td>
            </tr>
            {}
            {indicator?.resource.type !== "h3" &&
              indicator?.visualization_types
                .filter((t) => t === "map")
                .map((type) => {
                  return (
                    <tr key={type}>
                      <td>Map</td>
                      <td>
                        <ResourceMap
                          {...indicator}
                          resource={
                            indicator.resource as
                              | ResourceFeature
                              | ResourceWebTile
                              | ResourceImageryTile
                          }
                        />
                      </td>
                    </tr>
                  );
                })}

            {indicator?.resource.type !== "h3" &&
              indicator?.visualization_types
                .filter((t) => t !== "map")
                .map((type) => {
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

                  if (indicator?.resource.type === "imagery-tile") {
                    const r = indicator.resource;
                    return (
                      <tr key={type}>
                        <td>Query {type[0].toUpperCase() + type.slice(1)}</td>
                        <td>
                          <ResourceQueryImageryTile {...indicator} type={type} resource={r} />
                        </td>
                      </tr>
                    );
                  }

                  return null;
                })}
            <tr>
              <td className="w-60">H3 Grid Column Name</td>
              {/* <td>{indicator?.h3_grid_column_name || "-"}</td> */}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
