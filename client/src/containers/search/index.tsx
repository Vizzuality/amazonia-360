import { useCallback, useState } from "react";

import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import { useSetAtom } from "jotai";

import { useGetArcGISSuggestions, useGetSearch } from "@/lib/search";

import { tmpBboxAtom, useSyncLocation } from "@/app/store";

import { Search } from "@/components/ui/search";

type Option = {
  label: string;
  value: string;
  key: string;
  sourceIndex: number;
};

export default function SearchC() {
  const [search, setSearch] = useState("");
  const [, setLocation] = useSyncLocation();
  const setTmpBbox = useSetAtom(tmpBboxAtom);

  const q = useGetArcGISSuggestions(
    { text: search },
    {
      enabled: !!search,
      keepPreviousData: !!search,
    },
  );

  const s = useGetSearch();

  const handleSelect = useCallback(
    (value: Option) => {
      s.mutate(
        {
          text: value.value,
          key: value.key,
          sourceIndex: value.sourceIndex,
        },
        {
          onSuccess: (data) => {
            if (data.numResults !== 1)
              throw new Error("Invalid number of results");

            const TYPE = data.results[0].results[0].feature.geometry.type;
            const FID = data.results[0].results[0].feature.getAttribute("FID");
            const SOURCE = data.results[0].source.layer.id;

            if (TYPE !== "point") {
              setLocation({
                type: "feature",
                FID,
                SOURCE,
              });
            }

            if (TYPE === "point") {
              const g = geometryEngine.geodesicBuffer(
                data.results[0].results[0].feature.geometry,
                30,
                "kilometers",
                true,
              );

              if (!Array.isArray(g)) {
                setLocation({
                  type: "custom",
                  GEOMETRY: g.toJSON(),
                });
              }
            }

            setSearch("");

            setTmpBbox(data.results[0].results[0].extent);
          },
        },
      );
    },
    [setLocation, setTmpBbox, s],
  );

  return (
    <>
      <h1 className="text-2xl">Search</h1>

      <div className="w-full">
        <Search
          value={search}
          placeholder="Search location..."
          options={
            (q.data?.results
              .map((r) =>
                r.results.map((r1) => ({
                  label: r1.text,
                  value: r1.text,
                  key: r1.key,
                  sourceIndex: r.sourceIndex,
                })),
              )
              .flat() as Option[]) || ([] as Option[])
          }
          {...q}
          onChange={setSearch}
          onSelect={handleSelect}
        />
      </div>
    </>
  );
}
