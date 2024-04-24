"use client";

import Image from "next/image";

import { UseQueryResult } from "@tanstack/react-query";

export function NoData({
  query,
}: {
  query: UseQueryResult<unknown, unknown>[];
}) {
  if (
    query.map((q) => q.isFetched) &&
    query.map((q) => q.data).flat().length === 0
  ) {
    console.log("Data", query);
    return (
      <div className="flex flex-col items-center space-y-6 py-12">
        <Image
          src={"/images/no-data.png"}
          alt="No data"
          width={141}
          height={94}
        />
        <p className="text-sm text-blue-900 font-medium text-center">
          No results for this location at the moment. <br /> Feel free to adjust
          your search criteria or check back later!
        </p>
      </div>
    );
  }
}
