"use client";

import GridActive from "@/containers/report/grid/footer/active";
import GridClear from "@/containers/report/grid/footer/clear";

export default function GridFooter() {
  return (
    <div className="flex items-center justify-between">
      <GridActive />

      <GridClear />
    </div>
  );
}
