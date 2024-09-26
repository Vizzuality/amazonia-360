"use client";

import { formatPercentage } from "@/lib/formats";

import { ProtectedAreas } from "@/containers/widgets/protection/protected-areas/types";

interface WidgetProtectedAreasHeaderProps {
  protectedAreas: ProtectedAreas[];
  protectedAreaCoverage: number;
}

export default function WidgetProtectedAreasHeader({
  protectedAreas,
  protectedAreaCoverage,
}: WidgetProtectedAreasHeaderProps) {
  return (
    <p className="text-sm font-medium">
      There are <strong>{protectedAreas.length} protected areas</strong> in the selected region,
      which represents{" "}
      <strong>
        {formatPercentage(protectedAreaCoverage, {
          maximumFractionDigits: 0,
        })}{" "}
        of the selected area
      </strong>
      .
    </p>
  );
}
