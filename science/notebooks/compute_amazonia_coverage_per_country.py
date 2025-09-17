import json

MOSAIC_DATA = [
    {
        "country": "Brazil",
        "country_total_cartographic_area_sqkm": 8471712.92,
        "amazonia_area_by_country_cartographic_area_sqkm": 5194159.82,
        "proportion_of_amazonia_area_by_country_percentage": 0.6131,
        "proportion_of_total_area_of_the_afp_by_country_percentage": 0.6252,
        "total_population_by_country_ghspop25": 216853567,
        "population_of_the_amazonia_zone_by_country_ghspop25": 31448141,
        "proportion_of_the_population_of_the_amazonia_zone_by_country_percentage": 0.145,
        "proportion_of_the_population_of_the_afp_by_country_percentage": 0.5245,
        "population_density_of_the_afp_zones_by_country_inhabitants_per_sqkm": 0.0605,
    },
    {
        "country": "Peru",
        "country_total_cartographic_area_sqkm": 1292369.62,
        "amazonia_area_by_country_cartographic_area_sqkm": 962663.13,
        "proportion_of_amazonia_area_by_country_percentage": 0.7449,
        "proportion_of_total_area_of_the_afp_by_country_percentage": 0.1159,
        "total_population_by_country_ghspop25": 34463536,
        "population_of_the_amazonia_zone_by_country_ghspop25": 11169785,
        "proportion_of_the_population_of_the_amazonia_zone_by_country_percentage": 0.3241,
        "proportion_of_the_population_of_the_afp_by_country_percentage": 0.1863,
        "population_density_of_the_afp_zones_by_country_inhabitants_per_sqkm": 0.116,
    },
    {
        "country": "Colombia",
        "country_total_cartographic_area_sqkm": 1135809.61,
        "amazonia_area_by_country_cartographic_area_sqkm": 482648.89,
        "proportion_of_amazonia_area_by_country_percentage": 0.4249,
        "proportion_of_total_area_of_the_afp_by_country_percentage": 0.581,
        "total_population_by_country_ghspop25": 52283101,
        "population_of_the_amazonia_zone_by_country_ghspop25": 1565224,
        "proportion_of_the_population_of_the_amazonia_zone_by_country_percentage": 0.0299,
        "proportion_of_the_population_of_the_afp_by_country_percentage": 0.0261,
        "population_density_of_the_afp_zones_by_country_inhabitants_per_sqkm": 0.0234,
    },
    {
        "country": "Bolivia",
        "country_total_cartographic_area_sqkm": 1083796.77,
        "amazonia_area_by_country_cartographic_area_sqkm": 711729.62,
        "proportion_of_amazonia_area_by_country_percentage": 0.6567,
        "proportion_of_total_area_of_the_afp_by_country_percentage": 0.0857,
        "total_population_by_country_ghspop25": 12788910,
        "population_of_the_amazonia_zone_by_country_ghspop25": 8518321,
        "proportion_of_the_population_of_the_amazonia_zone_by_country_percentage": 0.6661,
        "proportion_of_the_population_of_the_afp_by_country_percentage": 0.1421,
        "population_density_of_the_afp_zones_by_country_inhabitants_per_sqkm": 0.1197,
    },
    {
        "country": "Venezuela",
        "country_total_cartographic_area_sqkm": 911914.89,
        "amazonia_area_by_country_cartographic_area_sqkm": 468934.77,
        "proportion_of_amazonia_area_by_country_percentage": 0.5142,
        "proportion_of_total_area_of_the_afp_by_country_percentage": 0.0564,
        "total_population_by_country_ghspop25": 29709777,
        "population_of_the_amazonia_zone_by_country_ghspop25": 2119466,
        "proportion_of_the_population_of_the_amazonia_zone_by_country_percentage": 0.0713,
        "proportion_of_the_population_of_the_afp_by_country_percentage": 0.0353,
        "population_density_of_the_afp_zones_by_country_inhabitants_per_sqkm": 0.0452,
    },
    {
        "country": "Ecuador",
        "country_total_cartographic_area_sqkm": 255019.9,
        "amazonia_area_by_country_cartographic_area_sqkm": 131414.99,
        "proportion_of_amazonia_area_by_country_percentage": 0.5153,
        "proportion_of_total_area_of_the_afp_by_country_percentage": 0.0158,
        "total_population_by_country_ghspop25": 18301185,
        "population_of_the_amazonia_zone_by_country_ghspop25": 3688679,
        "proportion_of_the_population_of_the_amazonia_zone_by_country_percentage": 0.2016,
        "proportion_of_the_population_of_the_afp_by_country_percentage": 0.0615,
        "population_density_of_the_afp_zones_by_country_inhabitants_per_sqkm": 0.2807,
    },
    {
        "country": "Guyana",
        "country_total_cartographic_area_sqkm": 210740.45,
        "amazonia_area_by_country_cartographic_area_sqkm": 210939.36,
        "proportion_of_amazonia_area_by_country_percentage": 1,
        "proportion_of_total_area_of_the_afp_by_country_percentage": 0.0254,
        "total_population_by_country_ghspop25": 827247,
        "population_of_the_amazonia_zone_by_country_ghspop25": 827247,
        "proportion_of_the_population_of_the_amazonia_zone_by_country_percentage": 1,
        "proportion_of_the_population_of_the_afp_by_country_percentage": 0.0138,
        "population_density_of_the_afp_zones_by_country_inhabitants_per_sqkm": 0.0392,
    },
    {
        "country": "Suriname",
        "country_total_cartographic_area_sqkm": 145784.53,
        "amazonia_area_by_country_cartographic_area_sqkm": 145487.02,
        "proportion_of_amazonia_area_by_country_percentage": 1,
        "proportion_of_total_area_of_the_afp_by_country_percentage": 0.175,
        "total_population_by_country_ghspop25": 628406,
        "population_of_the_amazonia_zone_by_country_ghspop25": 628406,
        "proportion_of_the_population_of_the_amazonia_zone_by_country_percentage": 1,
        "proportion_of_the_population_of_the_afp_by_country_percentage": 0.0105,
        "population_density_of_the_afp_zones_by_country_inhabitants_per_sqkm": 0.0432,
    },
]


if __name__ == "__main__":
    result = MOSAIC_DATA.copy()
    amz_total_area = sum(e["amazonia_area_by_country_cartographic_area_sqkm"] for e in MOSAIC_DATA)
    amz_total_population = sum(
        e["population_of_the_amazonia_zone_by_country_ghspop25"] for e in MOSAIC_DATA
    )
    for entry in result:
        entry["proportion_of_total_area_of_the_afp_by_country_percentage"] = round(
            entry["amazonia_area_by_country_cartographic_area_sqkm"] / amz_total_area, 3
        )

    print(json.dumps(result, indent=2))
