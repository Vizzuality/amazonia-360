"use client";

import GridFilters from "@/containers/grid/filters";

export default function Sidebar() {
  return (
    <div className="w-96 p-5 bg-white border-r border-gray-200">
      <GridFilters />
    </div>
  );
}
