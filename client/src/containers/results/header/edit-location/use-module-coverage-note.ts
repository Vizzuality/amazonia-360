import {
  getCountryCoveragePercent,
  getCountryCoverageRatio,
  useGetCountryAmazoniaBoundary,
} from "@/lib/country/coverage";
import { getCountryModuleBySlug, useGetCountryModules } from "@/lib/country-modules";
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
  const modules = useGetCountryModules();
  const reportCountry = useReportCountry();
  const [location] = useSyncLocation();
  const { geometry, isCalculating } = useLocationGeometryWithStatus(location);

  const reportModule = getCountryModuleBySlug(modules, reportCountry?.[0] ?? null);

  const { data: boundary } = useGetCountryAmazoniaBoundary(reportModule?.country ?? "", {
    enabled: !!reportModule && !!location,
  });

  if (!reportModule || isCalculating || !geometry || !boundary) return null;

  const name = reportModule.moduleName;
  const ratio = getCountryCoverageRatio(geometry, boundary);

  if (ratio === 0) return { key: "edit-location-confirm-dialog-module-outside", values: { name } };

  const percent = getOutsidePercent(ratio);
  if (percent === 0) return null;

  return { key: "edit-location-confirm-dialog-module-partial", values: { name, percent } };
}
