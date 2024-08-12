"use client";

import GridFilters from "@/containers/grid/filters";

export default function Sidebar() {
  return (
    <div className="w-96 border-r border-gray-200 bg-white p-5">
      <GridFilters />
    </div>
  );
}
