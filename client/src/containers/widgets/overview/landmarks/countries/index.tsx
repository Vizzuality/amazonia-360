"use client";

import Flag from "react-world-flags";

import { useLocationGeometry } from "@/lib/location";
import { useGetFeatures } from "@/lib/query";

import { useSyncLocation } from "@/app/store";

import { DATASETS } from "@/constants/datasets";

import { CardLoader } from "@/containers/card";

export default function WidgetLandmarksCountries() {
  const [location] = useSyncLocation();

  const GEOMETRY = useLocationGeometry(location);

  const query = useGetFeatures(
    {
      query: DATASETS.admin.getFeatures({
        ...(!!GEOMETRY && {
          orderByFields: ["NAME_0"],
          geometry: GEOMETRY,
        }),
      }),
      feature: DATASETS.admin.layer,
    },
    {
      enabled: !!DATASETS.admin.getFeatures && !!GEOMETRY,
      select(data) {
        const countries = data.features.map((feature) => ({
          NAME: feature.attributes.NAME_0,
          ISO: feature.attributes.GID_0,
        }));

        const response = Array.from(
          new Set(countries.map((country) => country.ISO)),
        ).map((iso) => {
          return countries.find((country) => country.ISO === iso);
        });

        return response;
      },
    },
  );

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium text-gray-500">Countries</h3>
      <CardLoader query={query} className="h-12">
        <ul className="flex space-x-5">
          {query.data?.map((c) => (
            <li className="flex space-x-2 items-center" key={c?.ISO}>
              <div className="w-8 rounded-sm overflow-hidden">
                <Flag code={c?.ISO} className="block" />
              </div>
              <span>{c?.NAME}</span>
            </li>
          ))}
        </ul>
      </CardLoader>
    </div>
  );
}
