"use client";

import { useFormatPercentage } from "@/lib/formats";

import { ProtectedAreas } from "@/containers/widgets/protection/protected-areas/types";

interface WidgetProtectedAreasHeaderProps {
  protectedAreas: ProtectedAreas[];
  protectedAreaCoverage: number;
}

export default function WidgetProtectedAreasHeader({
  protectedAreas,
  protectedAreaCoverage,
}: WidgetProtectedAreasHeaderProps) {
  const { format } = useFormatPercentage({
    maximumFractionDigits: 0,
  });

  return (
    <p className="text-sm font-medium">
      There are <strong>{protectedAreas.length} protected areas</strong> in the
      selected region, which represents{" "}
      <strong>{format(protectedAreaCoverage)} of the selected area</strong>.
    </p>
  );
}
