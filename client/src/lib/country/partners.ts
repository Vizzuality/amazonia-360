import { COUNTRIES, type CountryCode } from "@/lib/country";

import type messages from "@/i18n/translations/en.json";

export type CountryModulePartnerLogo = { src: string; alt: string; className?: string };
export type CountryModulePartner = CountryModulePartnerLogo & { label: string };

type CountryModulePartners = {
  descriptionKey: keyof typeof messages;
  partners: CountryModulePartner[];
};

const COUNTRY_MODULES_PARTNERS: Partial<Record<CountryCode, CountryModulePartners>> = {
  ECU: {
    descriptionKey: "partners-country-module-ECU-description",
    partners: [
      {
        src: "/partners/ecu/gobierno-del-ecuador.avif",
        alt: "Gobierno del Ecuador",
        label: "Gobierno del Ecuador",
      },
      {
        src: "/partners/ecu/ministerio-del-ambiente.avif",
        alt: "Ministerio del Ambiente",
        label: "MAE",
      },
      {
        src: "/partners/ecu/instituto-geografico-militar.avif",
        alt: "Instituto Geográfico Militar",
        label: "IGM",
      },
      { src: "/partners/ecu/inabio.avif", alt: "INABIO", label: "INABIO" },
      {
        src: "/partners/ecu/the-nature-conservancy.avif",
        alt: "The Nature Conservancy",
        label: "TNC",
      },
    ],
  },
};

const COUNTRY_MODULES_BY_CODE: Partial<Record<string, CountryModulePartners>> =
  COUNTRY_MODULES_PARTNERS;

export function getCountryModulePartnerLogos(code: string | null): CountryModulePartner[] {
  return code ? (COUNTRY_MODULES_BY_CODE[code]?.partners ?? []) : [];
}

export function getCountryModuleDescriptionKey(
  code: string | null,
): CountryModulePartners["descriptionKey"] | null {
  return code ? (COUNTRY_MODULES_BY_CODE[code]?.descriptionKey ?? null) : null;
}

export function getPartnerCountries(): (typeof COUNTRIES)[number][] {
  return COUNTRIES.filter((entry) => getCountryModulePartnerLogos(entry.code).length > 0);
}

export function getPartnersHref(country: string | null): {
  pathname: string;
  query?: { country: string };
} {
  const hasPartners = !!country && getCountryModulePartnerLogos(country).length > 0;
  return hasPartners ? { pathname: "/partners", query: { country } } : { pathname: "/partners" };
}

const ATCO_LOCALES: ReadonlySet<string> = new Set(["en", "es", "pt"]);

const DDP_LOGO: CountryModulePartnerLogo = {
  src: "/partners/ddp.avif",
  alt: "Development Data Partnership",
};
const IDB_ATLAS_LOGO: CountryModulePartnerLogo = {
  src: "/partners/idb-atlas.avif",
  alt: "IDB Atlas",
};
const GREEN_CLIMATE_FUND_LOGO: CountryModulePartnerLogo = {
  src: "/partners/green-climate-fund.avif",
  alt: "Green Climate Fund",
  className: "h-[72px]",
};
const ESRI_LOGO: CountryModulePartnerLogo = { src: "/partners/esri.avif", alt: "Esri" };
const VIZZUALITY_LOGO: CountryModulePartnerLogo = {
  src: "/partners/vizzuality.avif",
  alt: "Vizzuality",
};

function getAtcoLocale(locale: string): string {
  return ATCO_LOCALES.has(locale) ? locale : "en";
}

function getAtcoLogo(locale: string): CountryModulePartnerLogo {
  return { src: `/partners/atco-${getAtcoLocale(locale)}.avif`, alt: "ACTO ARO" };
}

export function getRegionalPartnerLogos(locale: string): CountryModulePartnerLogo[] {
  return [
    getAtcoLogo(locale),
    DDP_LOGO,
    IDB_ATLAS_LOGO,
    GREEN_CLIMATE_FUND_LOGO,
    ESRI_LOGO,
    VIZZUALITY_LOGO,
  ];
}

export function getOtherPartnerLogoRows(locale: string): CountryModulePartnerLogo[][] {
  return [
    [getAtcoLogo(locale)],
    [IDB_ATLAS_LOGO, DDP_LOGO],
    [ESRI_LOGO, VIZZUALITY_LOGO],
    [GREEN_CLIMATE_FUND_LOGO],
  ];
}
