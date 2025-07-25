export type MosaicIds =
  | "amazonia_area_by_country_cartographic_area_sqkm"
  | "proportion_of_amazonia_area_by_country_percentage"
  | "proportion_of_total_area_of_the_afp_by_country_percentage"
  | "proportion_of_the_population_of_the_amazonia_zone_by_country_percentage"
  | "proportion_of_the_population_of_the_afp_by_country_percentage"
  | "population_density_of_the_afp_zones_by_country_inhabitants_per_sqkm";

export const MOSAIC_OPTIONS = [
  {
    key: "amazonia_area_by_country_cartographic_area_sqkm",
    label_en: "Country Amazonia Area (km²)",
    description_en: "Total area of the Amazonia Forever work area within a country",
    label_pt: "Área da Amazônia por país (km²)",
    description_pt: "Área total da região de atuação da Amazônia Forever dentro de um país",
    label_es: "Área amazónica por país (km²)",
    description_es: "Área total de la región de trabajo de Amazonia Forever dentro de un país",
  },
  {
    key: "proportion_of_amazonia_area_by_country_percentage",
    label_en: "Country Amazonia Coverage (%)",
    description_en: "Percentage of a country covered by the Amazonia Forever work area",
    label_pt: "Cobertura amazônica no país (%)",
    description_pt: "Porcentagem de um país coberta pela região de atuação da Amazônia Forever",
    label_es: "Cobertura amazónica en el país (%)",
    description_es: "Porcentaje de un país cubierto por la región de trabajo de Amazonia Forever",
  },
  {
    key: "proportion_of_total_area_of_the_afp_by_country_percentage",
    label_en: "Country Share of Total Amazonia (%)",
    description_en: "Percentage of the total Amazonia Forever work area located within a country",
    label_pt: "Participação do país na Amazônia total (%)",
    description_pt: "Porcentagem da região de atuação da Amazônia Forever localizada em um país",
    label_es: "Participación del país en la Amazonía total (%)",
    description_es: "Porcentaje de la región de trabajo de Amazonia Forever ubicada en un país",
  },
  {
    key: "population_density_of_the_afp_zones_by_country_inhabitants_per_sqkm",
    label_en: "Country Amazonia Population Density (inhabitants/km²)",
    description_en: "Population density within a country's Amazonia Forever work area",
    label_pt: "Densidade populacional da Amazônia no país (habitantes/km²)",
    description_pt: "Densidade populacional na região amazônica de um país",
    label_es: "Densidad poblacional amazónica en el país (habitantes/km²)",
    description_es: "Densidad poblacional en la región amazónica de un país",
  },
  {
    key: "proportion_of_the_population_of_the_amazonia_zone_by_country_percentage",
    label_en: "Country Amazonia Population (%)",
    description_en:
      "Percentage of a country's population residing in its Amazonia Forever work area",
    label_pt: "População amazônica no país (%)",
    description_pt: "Porcentagem da população do país que reside na região da Amazônia Forever",
    label_es: "Población amazónica en el país (%)",
    description_es:
      "Porcentaje de la población del país que reside en la región de Amazonia Forever",
  },
  {
    key: "proportion_of_the_population_of_the_afp_by_country_percentage",
    label_en: "Country Share of Total Amazonia Population (%)",
    description_en:
      "Percentage of the total Amazonia Forever work area population residing within a country",
    label_pt: "Participação do país na população amazônica total (%)",
    description_pt: "Porcentagem da população total da Amazônia Forever que reside em um país",
    label_es: "Participación del país en la población amazónica total (%)",
    description_es: "Porcentaje de la población total de Amazonia Forever que reside en un país",
  },
] as const;

export const MOSAIC_DATA = [
  {
    country: "Brazil",
    country_total_cartographic_area_sqkm: 8471712.92,
    amazonia_area_by_country_cartographic_area_sqkm: 5194159.82,
    proportion_of_amazonia_area_by_country_percentage: 0.6131,
    proportion_of_total_area_of_the_afp_by_country_percentage: 0.6252,
    total_population_by_country_ghspop25: 216853567,
    population_of_the_amazonia_zone_by_country_ghspop25: 31448141,
    proportion_of_the_population_of_the_amazonia_zone_by_country_percentage: 0.145,
    proportion_of_the_population_of_the_afp_by_country_percentage: 0.5245,
    population_density_of_the_afp_zones_by_country_inhabitants_per_sqkm: 0.0605,
  },
  {
    country: "Peru",
    country_total_cartographic_area_sqkm: 1292369.62,
    amazonia_area_by_country_cartographic_area_sqkm: 962663.13,
    proportion_of_amazonia_area_by_country_percentage: 0.7449,
    proportion_of_total_area_of_the_afp_by_country_percentage: 0.1159,
    total_population_by_country_ghspop25: 34463536,
    population_of_the_amazonia_zone_by_country_ghspop25: 11169785,
    proportion_of_the_population_of_the_amazonia_zone_by_country_percentage: 0.3241,
    proportion_of_the_population_of_the_afp_by_country_percentage: 0.1863,
    population_density_of_the_afp_zones_by_country_inhabitants_per_sqkm: 0.116,
  },
  {
    country: "Colombia",
    country_total_cartographic_area_sqkm: 1135809.61,
    amazonia_area_by_country_cartographic_area_sqkm: 482648.89,
    proportion_of_amazonia_area_by_country_percentage: 0.4249,
    proportion_of_total_area_of_the_afp_by_country_percentage: 0.581,
    total_population_by_country_ghspop25: 52283101,
    population_of_the_amazonia_zone_by_country_ghspop25: 1565224,
    proportion_of_the_population_of_the_amazonia_zone_by_country_percentage: 0.0299,
    proportion_of_the_population_of_the_afp_by_country_percentage: 0.0261,
    population_density_of_the_afp_zones_by_country_inhabitants_per_sqkm: 0.0234,
  },
  {
    country: "Bolivia",
    country_total_cartographic_area_sqkm: 1083796.77,
    amazonia_area_by_country_cartographic_area_sqkm: 711729.62,
    proportion_of_amazonia_area_by_country_percentage: 0.6567,
    proportion_of_total_area_of_the_afp_by_country_percentage: 0.0857,
    total_population_by_country_ghspop25: 12788910,
    population_of_the_amazonia_zone_by_country_ghspop25: 8518321,
    proportion_of_the_population_of_the_amazonia_zone_by_country_percentage: 0.6661,
    proportion_of_the_population_of_the_afp_by_country_percentage: 0.1421,
    population_density_of_the_afp_zones_by_country_inhabitants_per_sqkm: 0.1197,
  },
  {
    country: "Venezuela",
    country_total_cartographic_area_sqkm: 911914.89,
    amazonia_area_by_country_cartographic_area_sqkm: 468934.77,
    proportion_of_amazonia_area_by_country_percentage: 0.5142,
    proportion_of_total_area_of_the_afp_by_country_percentage: 0.0564,
    total_population_by_country_ghspop25: 29709777,
    population_of_the_amazonia_zone_by_country_ghspop25: 2119466,
    proportion_of_the_population_of_the_amazonia_zone_by_country_percentage: 0.0713,
    proportion_of_the_population_of_the_afp_by_country_percentage: 0.0353,
    population_density_of_the_afp_zones_by_country_inhabitants_per_sqkm: 0.0452,
  },
  {
    country: "Ecuador",
    country_total_cartographic_area_sqkm: 255019.9,
    amazonia_area_by_country_cartographic_area_sqkm: 131414.99,
    proportion_of_amazonia_area_by_country_percentage: 0.5153,
    proportion_of_total_area_of_the_afp_by_country_percentage: 0.0158,
    total_population_by_country_ghspop25: 18301185,
    population_of_the_amazonia_zone_by_country_ghspop25: 3688679,
    proportion_of_the_population_of_the_amazonia_zone_by_country_percentage: 0.2016,
    proportion_of_the_population_of_the_afp_by_country_percentage: 0.0615,
    population_density_of_the_afp_zones_by_country_inhabitants_per_sqkm: 0.2807,
  },
  {
    country: "Guyana",
    country_total_cartographic_area_sqkm: 210740.45,
    amazonia_area_by_country_cartographic_area_sqkm: 210939.36,
    proportion_of_amazonia_area_by_country_percentage: 1,
    proportion_of_total_area_of_the_afp_by_country_percentage: 0.0254,
    total_population_by_country_ghspop25: 827247,
    population_of_the_amazonia_zone_by_country_ghspop25: 827247,
    proportion_of_the_population_of_the_amazonia_zone_by_country_percentage: 1,
    proportion_of_the_population_of_the_afp_by_country_percentage: 0.0138,
    population_density_of_the_afp_zones_by_country_inhabitants_per_sqkm: 0.0392,
  },
  {
    country: "Suriname",
    country_total_cartographic_area_sqkm: 145784.53,
    amazonia_area_by_country_cartographic_area_sqkm: 145487.02,
    proportion_of_amazonia_area_by_country_percentage: 1,
    proportion_of_total_area_of_the_afp_by_country_percentage: 0.175,
    total_population_by_country_ghspop25: 628406,
    population_of_the_amazonia_zone_by_country_ghspop25: 628406,
    proportion_of_the_population_of_the_amazonia_zone_by_country_percentage: 1,
    proportion_of_the_population_of_the_afp_by_country_percentage: 0.0105,
    population_density_of_the_afp_zones_by_country_inhabitants_per_sqkm: 0.0432,
  },
];

export const FEEDBACK_URL = "https://cloud.mail.iadb.org/amazonia-360";
