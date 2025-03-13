"use client";

import { useCallback, useState } from "react";

import { useSetAtom } from "jotai";

import { getGeometryByType, getGeometryWithBuffer } from "@/lib/location";
import { useGetMutationSearch, useGetSuggestions } from "@/lib/search";

import { tmpBboxAtom, useSyncLocation } from "@/app/store";

import { BUFFERS } from "@/constants/map";

import { Search } from "@/components/ui/search";

type Option = {
  label: string;
  value: string;
  key: string;
  sourceIndex: number;
};

export default function SearchC() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [, setLocation] = useSyncLocation();
  const setTmpBbox = useSetAtom(tmpBboxAtom);

  const q = useGetSuggestions({ text: search }, { enabled: !!search });

  const m = useGetMutationSearch();

  const handleSearch = useCallback(
    (value: string) => {
      setOpen(true);
      setSearch(value);
    },
    [setSearch],
  );

  const handleSelect = useCallback(
    (value: Option | null) => {
      if (!value) {
        setLocation(null);
        setOpen(false);
        setSearch("");
        return;
      }

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

            if (data) {
              const geo = getGeometryByType({
                type: data.type,
                geometry: data.geometry,
                buffer: BUFFERS[data.type],
              });

              if (!geo) return;

              const g = getGeometryWithBuffer(geo, BUFFERS[data.type]);

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
      <div className="w-full">
        <Search
          value={search}
          open={open}
          placeholder="Search location..."
          size="sm"
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
          onChange={handleSearch}
          onSelect={handleSelect}
        />
      </div>
    </>
  );
}
