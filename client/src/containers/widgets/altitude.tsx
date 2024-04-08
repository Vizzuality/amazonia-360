"use client";

import { useMemo } from "react";

import { useFormatNumber } from "@/lib/formats";

import { Card, CardWidgetNumber, CardTitle } from "@/containers/card";

export default function WidgetAltitude() {
  const { format } = useFormatNumber({
    maximumFractionDigits: 0,
  });

  const ALTITUDE = useMemo(() => {
    return `${format(100)} - ${format(200)}`;
  }, [format]);

  return (
    <Card>
      <CardTitle>Altitude</CardTitle>
      <CardWidgetNumber value={ALTITUDE} unit="meters" />
    </Card>
  );
}
