import { isSavedReportPathname, isUnscopedPathname } from "@/lib/country";
import { getCountryCoverageRatio, useGetCountryAmazoniaBoundary } from "@/lib/country/coverage";
import { useLocationGeometry } from "@/lib/location";

import { useSyncLocation } from "@/app/(frontend)/store";

import { usePathname } from "@/i18n/navigation";
import { useCountry } from "@/i18n/use-country";

export type CountryModuleCoverageStatus = "no-area" | "pending" | "outside" | "inside";

export function useCountryModuleCoverage() {
  const pathname = usePathname();
  const country = useCountry();
  const [location] = useSyncLocation();
  const geometry = useLocationGeometry(location);

  const enabled =
    country !== null && !isUnscopedPathname(pathname) && !isSavedReportPathname(pathname);

  const { data: boundary } = useGetCountryAmazoniaBoundary(country ?? "", {
    enabled: enabled && !!location,
  });

  if (!enabled || !location) {
    return { status: "no-area" as CountryModuleCoverageStatus, ratio: 0, geometry: null };
  }

  // An unresolved boundary makes the ratio 0, which reads as "outside" — the opposite of
  // the truth — so nothing is reported as outside until geometry and boundary both exist.
  if (!geometry || !boundary) {
    return { status: "pending" as CountryModuleCoverageStatus, ratio: 0, geometry };
  }

  const ratio = getCountryCoverageRatio(geometry, boundary);
  const status: CountryModuleCoverageStatus = ratio === 0 ? "outside" : "inside";

  return { status, ratio, geometry };
}
