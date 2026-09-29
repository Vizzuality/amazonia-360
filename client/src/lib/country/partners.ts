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
