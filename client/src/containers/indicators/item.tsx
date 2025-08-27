"use client";

import { useLocale, useTranslations } from "next-intl";

import { useGetIndicatorsId } from "@/lib/indicators";

import { Indicator } from "@/types/indicator";
import { ResourceFeature, ResourceImageryTile, ResourceWebTile } from "@/types/indicator";

import {
  ResourceMap,
  ResourceQueryFeature,
  ResourceQueryImagery,
  ResourceQueryImageryTile,
} from "@/containers/indicators/resources";

export const IndicatorItem = ({ id }: { id: Indicator["id"] }) => {
  const t = useTranslations();
  const locale = useLocale();
  const indicator = useGetIndicatorsId(id, locale);

  return (
    <div className="space-y-5">
      <h2 className="text-3xl">{indicator?.name}</h2>
      <div className="prose prose-sm max-w-none">
        <table className="w-full">
          <tbody>
            <tr>
              <td className="w-60">{t("topic")}</td>
              <td>
                {indicator?.topic.id} - {indicator?.topic.name}
              </td>
            </tr>
            <tr>
              <td className="w-60">{t("resource")}</td>
              <td>{indicator?.resource.name}</td>
            </tr>
            <tr>
              <td className="w-60">{t("resource-type")}</td>
              <td>{indicator?.resource.type}</td>
            </tr>

            {"url" in indicator!.resource && (
              <tr>
                <td className="w-60">{t("resource-url")}</td>
                <td>
                  <a href={indicator?.resource.url} target="_blank" rel="noreferrer">
                    {indicator?.resource.url}
                  </a>
                </td>
              </tr>
            )}
            <tr>
              <td className="w-60">{t("visualization-type")}</td>
              <td>{(indicator?.visualization_types || [])?.join(", ")}</td>
            </tr>
            {}
            {indicator?.resource.type !== "h3" &&
              indicator?.visualization_types
                .filter((t) => t === "map")
                .map((type) => {
                  return (
                    <tr key={type}>
                      <td>{t("map")}</td>
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
                        <td>
                          {t("query")} {type[0].toUpperCase() + type.slice(1)}
                        </td>
                        <td>
                          <ResourceQueryFeature {...indicator} type={type} resource={r} />
                        </td>
                      </tr>
                    );
                  }

                  if (indicator?.resource.type === "imagery") {
                    const r = indicator.resource;
                    return (
                      <tr key={type}>
                        <td>
                          {t("query")} {type[0].toUpperCase() + type.slice(1)}
                        </td>
                        <td>
                          <ResourceQueryImagery {...indicator} type={type} resource={r} />
                        </td>
                      </tr>
                    );
                  }

                  if (indicator?.resource.type === "imagery-tile") {
                    const r = indicator.resource;
                    return (
                      <tr key={type}>
                        <td>
                          {t("query")} {type[0].toUpperCase() + type.slice(1)}
                        </td>
                        <td>
                          <ResourceQueryImageryTile {...indicator} type={type} resource={r} />
                        </td>
                      </tr>
                    );
                  }

                  return null;
                })}
            <tr>
              <td className="w-60">{t("h3-grid-column-name")}</td>
              {/* <td>{indicator?.h3_grid_column_name || "-"}</td> */}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
