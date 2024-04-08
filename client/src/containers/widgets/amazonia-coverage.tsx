"use client";

import { useMemo } from "react";

import { useFormatPercentage } from "@/lib/formats";

import { Card, CardWidgetNumber, CardTitle } from "@/containers/card";

export default function WidgetAmazoniaCoverage() {
  const { format } = useFormatPercentage({
    maximumFractionDigits: 0,
  });

  const COVERAGE = useMemo(() => {
    return format(1);
  }, [format]);

  return (
    <Card>
      <CardTitle>Amazonia coverage</CardTitle>
      <CardWidgetNumber value={COVERAGE} unit="is in Amazonia" />
    </Card>
  );
}
