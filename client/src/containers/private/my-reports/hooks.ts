import { useState, useMemo } from "react";

import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";

import { sdk } from "@/services/sdk";

const ITEMS_PER_PAGE = 6;

export const useMyReports = () => {
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("-createdAt");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-reports", page, search, sort, locale],
    queryFn: async () => {
      const result = await sdk.find({
        collection: "reports",
        locale,
        limit: ITEMS_PER_PAGE,
        page,
        where: {
          and: [
            {
              _status: {
                equals: "published",
              },
            },
            ...(search
              ? [
                  {
                    title: {
                      contains: search,
                    },
                  },
                ]
              : []),
          ],
        },
        sort,
      });

      return result;
    },
  });

  const reports = useMemo(() => data?.docs ?? [], [data?.docs]);
  const totalPages = data?.totalPages ?? 1;
  const totalDocs = data?.totalDocs ?? 0;
  const hasNextPage = data?.hasNextPage ?? false;
  const hasPrevPage = data?.hasPrevPage ?? false;

  return {
    data: reports,
    isLoading,
    isError,
    search,
    setSearch,
    sort,
    setSort,
    page,
    setPage,
    totalPages,
    totalDocs,
    hasNextPage,
    hasPrevPage,
  };
};
