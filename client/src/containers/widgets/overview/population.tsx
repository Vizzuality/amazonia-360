"use client";

import { useMemo } from "react";

import { useFormatNumber } from "@/lib/formats";

import { Card, CardWidgetNumber, CardTitle } from "@/containers/card";

export default function WidgetPopulation() {
  const { format } = useFormatNumber({
    maximumFractionDigits: 0,
  });

  const POPULATION = useMemo(() => {
    return format(265000);
  }, [format]);

  return (
    <Card>
      <CardTitle>Population</CardTitle>
      <CardWidgetNumber value={POPULATION} unit="inhabitants" />
    </Card>
  );
}
