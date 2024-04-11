"use client";

import { useMemo } from "react";

import {
  AdministrativeBoundary,
  City,
} from "@/containers/widgets/overview/administrative-boundaries/types";

interface WidgetAdministrativeBoundariesHeaderProps {
  administrativeBoundaries: AdministrativeBoundary[];
  cities: City[];
}

export default function WidgetAdministrativeBoundariesHeader({
  administrativeBoundaries,
  cities,
}: WidgetAdministrativeBoundariesHeaderProps) {
  const STATISTICS = useMemo(() => {
    return {
      states: new Set(administrativeBoundaries.map((a) => a.NAME_1)),
      municipalities: new Set(administrativeBoundaries.map((a) => a.NAME_2)),
      countries: new Set(administrativeBoundaries.map((a) => a.NAME_0)),
      capitals: new Set(cities.map((c) => c.NOMBCAP)),
    };
  }, [administrativeBoundaries, cities]);

  const { states, municipalities, countries, capitals } = STATISTICS;

  return (
    <p className="text-sm font-medium">
      The selected area intersects {countries.size} countries, {states.size}{" "}
      states, {municipalities.size} municipalities and {capitals.size} capital
      cities.
    </p>
  );
}
