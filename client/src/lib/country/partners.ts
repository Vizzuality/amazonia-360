export type CountryModulePartnerLogo = { src: string; alt: string };

const COUNTRY_MODULE_PARTNER_LOGOS: Record<string, CountryModulePartnerLogo[]> = {
  ECU: [
    { src: "/partners/ecu/gobierno-del-ecuador.avif", alt: "Gobierno del Ecuador" },
    { src: "/partners/ecu/ministerio-del-ambiente.avif", alt: "Ministerio del Ambiente" },
    { src: "/partners/ecu/instituto-geografico-militar.avif", alt: "Instituto Geográfico Militar" },
    { src: "/partners/ecu/inabio.avif", alt: "INABIO" },
    { src: "/partners/ecu/the-nature-conservancy.avif", alt: "The Nature Conservancy" },
  ],
};

export function getCountryModulePartnerLogos(code: string | null): CountryModulePartnerLogo[] {
  return code ? (COUNTRY_MODULE_PARTNER_LOGOS[code] ?? []) : [];
}

const ATCO_LOCALES = ["en", "es", "pt"];

const STATIC_REGIONAL_PARTNER_LOGOS: CountryModulePartnerLogo[] = [
  { src: "/partners/ddp.avif", alt: "Development Data Partnership" },
  { src: "/partners/idb-atlas.avif", alt: "IDB Atlas" },
  { src: "/partners/green-climate-fund.avif", alt: "Green Climate Fund" },
  { src: "/partners/esri.avif", alt: "Esri" },
  { src: "/partners/vizzuality.avif", alt: "Vizzuality" },
];

function getAtcoLocale(locale: string): string {
  return ATCO_LOCALES.includes(locale) ? locale : "en";
}

function getAtcoLogo(locale: string): CountryModulePartnerLogo {
  return { src: `/partners/atco-${getAtcoLocale(locale)}.avif`, alt: "ACTO ARO" };
}

export function getRegionalPartnerLogos(locale: string): CountryModulePartnerLogo[] {
  return [getAtcoLogo(locale), ...STATIC_REGIONAL_PARTNER_LOGOS];
}
