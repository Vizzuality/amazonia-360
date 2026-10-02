import { useTranslations } from "next-intl";

import { COUNTRIES } from "@/lib/country";
import {
  getCountryCoveragePercent,
  getCountryCoverageRatio,
  useGetCountryAmazoniaBoundary,
} from "@/lib/country/coverage";
import { useLocationGeometryWithStatus } from "@/lib/location";
import { useReportCountry } from "@/lib/report/use-report-country";

import { useSyncLocation } from "@/app/(frontend)/store";

export type ModuleCoverageNote =
  | { key: "edit-location-confirm-dialog-module-outside"; values: { name: string } }
  | {
      key: "edit-location-confirm-dialog-module-partial";
      values: { name: string; percent: number };
    };

const getOutsidePercent = (ratio: number): number =>
  Math.min(100 - getCountryCoveragePercent(ratio), 99);

export function useModuleCoverageNote(): ModuleCoverageNote | null {
  const t = useTranslations();
  const reportCountry = useReportCountry();
  const [location] = useSyncLocation();
  const { geometry, isCalculating } = useLocationGeometryWithStatus(location);

  const code = reportCountry?.[0] ?? null;
  const entry = COUNTRIES.find((candidate) => candidate.code === code);

  const { data: boundary } = useGetCountryAmazoniaBoundary(code ?? "", {
    enabled: !!entry && !!location,
  });

  if (!entry || isCalculating || !geometry || !boundary) return null;

  const name = t(entry.moduleNameKey);
  const ratio = getCountryCoverageRatio(geometry, boundary);

  if (ratio === 0) return { key: "edit-location-confirm-dialog-module-outside", values: { name } };

  const percent = getOutsidePercent(ratio);
  if (percent === 0) return null;

  return { key: "edit-location-confirm-dialog-module-partial", values: { name, percent } };
}
