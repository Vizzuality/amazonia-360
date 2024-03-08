import { useCallback, useState } from "react";

import { useGetSuggestions } from "@/lib/search";

import { useSyncLocation } from "@/app/store";

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

  const q = useGetSuggestions(
    { text: search },
    {
      enabled: !!search,
      keepPreviousData: !!search,
    },
  );

  const handleSelect = useCallback(
    (value: Option) => {
      setLocation({
        type: "search",
        key: value.key,
        sourceIndex: value.sourceIndex,
        text: value.value,
      });
      setSearch("");
    },
    [setLocation],
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
