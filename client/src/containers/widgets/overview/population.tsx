"use client";

import { useMemo } from "react";

import { formatNumber } from "@/lib/formats";

import { Card, CardWidgetNumber, CardTitle } from "@/containers/card";

export default function WidgetPopulation() {
  const POPULATION = useMemo(() => {
    return formatNumber(265000, {
      maximumFractionDigits: 0,
    });
  }, []);

  return (
    <Card>
      <CardTitle>Population</CardTitle>
      <CardWidgetNumber value={POPULATION} unit="inhabitants" />
    </Card>
  );
}
