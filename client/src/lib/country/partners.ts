import { COUNTRIES, type CountryCode } from "@/lib/country";

export type CountryModulePartnerLogo = { src: string; alt: string };
export type CountryModulePartner = CountryModulePartnerLogo & { label: string };

const COUNTRY_MODULE_PARTNER_LOGOS: Record<string, CountryModulePartner[]> = {
  ECU: [
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
};

export function getCountryModulePartnerLogos(code: string | null): CountryModulePartner[] {
  return code ? (COUNTRY_MODULE_PARTNER_LOGOS[code] ?? []) : [];
}

export function getPartnerCountryCodes(): CountryCode[] {
  return COUNTRIES.map((c) => c.code).filter(
    (code) => getCountryModulePartnerLogos(code).length > 0,
  );
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
