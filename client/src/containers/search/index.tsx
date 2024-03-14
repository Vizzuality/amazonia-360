import { useCallback, useState } from "react";

import { useSetAtom } from "jotai";

import { getGeometryWithBuffer } from "@/lib/location";
import { useGetMutationSearch, useGetSuggestions } from "@/lib/search";

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

  const q = useGetSuggestions(
    { text: search },
    {
      enabled: !!search,
      keepPreviousData: !!search,
    },
  );

  const m = useGetMutationSearch();

  const handleSelect = useCallback(
    (value: Option) => {
      m.mutate(
        {
          key: value.key,
          sourceIndex: value.sourceIndex,
          text: value.label,
        },
        {
          onSuccess: (data) => {
            setLocation({
              type: "search",
              key: value.key,
              sourceIndex: value.sourceIndex,
              text: value.label,
            });
            setSearch("");

            if (data?.results[0].results[0].feature) {
              const g = getGeometryWithBuffer(
                data.results[0].results[0].feature,
              );

              if (g) {
                setTmpBbox(g.extent);
              }
            }
          },
        },
      );
    },
    [m, setLocation, setTmpBbox],
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
                  value: r1.key,
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
