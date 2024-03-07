import { useState } from "react";

import { useGetArcGISSuggestions, useGetSearch } from "@/lib/search";

import { useSyncLocation } from "@/app/store";

import { Search } from "@/components/ui/search";

export default function SearchC() {
  const [search, setSearch] = useState("");
  const [, setLocation] = useSyncLocation();

  const q = useGetArcGISSuggestions(
    { text: search },
    {
      enabled: !!search,
      keepPreviousData: !!search,
    },
  );

  const s = useGetSearch();

  return (
    <>
      <h1 className="text-2xl">Search</h1>

      <div className="w-full">
        <Search
          value={search}
          placeholder="Search location..."
          options={
            q.data?.results
              .map((r) =>
                r.results.map((r1) => ({
                  label: r1.text,
                  value: r1.text,
                  key: r1.key,
                  sourceIndex: r.sourceIndex,
                })),
              )
              .flat() || []
          }
          {...q}
          onChange={setSearch}
          onSelect={(value) => {
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

                  const FID =
                    data.results[0].results[0].feature.getAttribute("FID");
                  const SOURCE = data.results[0].source.layer.id;

                  setLocation({
                    type: "feature",
                    FID,
                    SOURCE,
                  });
                },
              },
            );
            setSearch("");
          }}
        />
      </div>
    </>
  );
}
