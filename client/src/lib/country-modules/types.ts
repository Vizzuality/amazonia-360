import type { CountryCode } from "@/constants/countries";

export type CountryModule = {
  id: string;
  slug: string;
  country: CountryCode;
  name: string;
  moduleName: string;
  partnersDescription: string | null;
  bbox: readonly [number, number, number, number] | null;
};

export type Partner = {
  id: string;
  name: string;
  label: string | null;
  logo: string;
  logoSize: "default" | "large";
  regional: boolean;
  moduleIds: readonly string[];
};
