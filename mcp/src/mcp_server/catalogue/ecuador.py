from mcp_server.catalogue.models import IndicatorMetadata, Layer

_BASE = "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services"


def _layer(service: str, category_field: str) -> Layer:
    return Layer(
        service_url=f"{_BASE}/{service}/FeatureServer",
        layer_id=0,
        category_field=category_field,
    )


def _miscount(documented: int, published: int) -> str:
    return (
        f"The consultant's file documents {documented} final records inside the "
        f"module; the published service has {published} records."
    )


INDICATORS: tuple[IndicatorMetadata, ...] = (
    IndicatorMetadata(
        id=202,
        name_en="Areas under restoration actions (Ecuador module)",
        name_es="Área Bajo Acciones de Restauración del módulo ecuatoriano",
        subtopic_id=4,
        value_type="count",
        aggregation="sum",
        unit="restoration actions",
        ai_answerable=True,
        available=True,
        layer=_layer(
            "03_%C3%81rea_Bajo_Acciones_de_Restauraci%C3%B3n_del_m%C3%B3dulo_ecuatoriano",
            "Practica",
        ),
        arcgis_item_id="356deac90503414f9ad6d600e352d808",
    ),
    IndicatorMetadata(
        id=203,
        name_en="Restoration priority areas (Ecuador module)",
        name_es="Área Prioritaria de Restauración del módulo ecuatoriano",
        subtopic_id=4,
        value_type="categorical",
        aggregation="none",
        unit="ha",
        ai_answerable=True,
        available=True,
        layer=_layer(
            "l_04_area_prioritaria_de_restauracion_del_modulo_ecuatoriano", "Prioridad"
        ),
        arcgis_item_id="6f8055ee6abe4e2495f5f5d457597a4e",
    ),
    IndicatorMetadata(
        id=204,
        name_en="Bioclimates (Ecuador module)",
        name_es="Bioclimas del módulo ecuatoriano",
        subtopic_id=8,
        value_type="categorical",
        aggregation="none",
        unit="ha",
        ai_answerable=True,
        available=True,
        layer=_layer("l_05_bioclimas_del_modulo_ecuatoriano", "Bioclima"),
        arcgis_item_id="4cb214dd5e834c29a1a3d8dd7dc239bf",
        caveats=(_miscount(7, 3),),
    ),
    IndicatorMetadata(
        id=206,
        name_en="Carbon by forest stratum (Ecuador module)",
        name_es="Carbono por estrato de bosque del módulo ecuatoriano",
        subtopic_id=4,
        value_type="categorical",
        aggregation="none",
        unit="ha",
        ai_answerable=False,
        available=False,
        layer=None,
        arcgis_item_id="20e987e39350434e992f66f7ec745dba",
        caveats=(
            "Not published: the ArcGIS item returns HTTP 403 and no service exists.",
        ),
    ),
    IndicatorMetadata(
        id=208,
        name_en="Deforestation 2020-2022 (Ecuador module)",
        name_es="Deforestación 2020-2022 del módulo ecuatoriano",
        subtopic_id=4,
        value_type="categorical",
        aggregation="none",
        unit="ha",
        ai_answerable=True,
        available=True,
        layer=_layer(
            "l_09_deforestacion_2020_2022_del_modulo_ecuatoriano", "Transicion"
        ),
        arcgis_item_id="9ba21668575c4ded909816b18703841b",
        caveats=(_miscount(7, 8),),
    ),
    IndicatorMetadata(
        id=209,
        name_en="Hydrographic Demarcations (Ecuador module)",
        name_es="Demarcaciones Hidrográficas del módulo ecuatoriano",
        subtopic_id=1,
        value_type="categorical",
        aggregation="none",
        unit="ha",
        ai_answerable=True,
        available=True,
        layer=_layer(
            "l_10_demarcaciones_hidrograficas_del_modulo_ecuatoriano", "Nombre"
        ),
        arcgis_item_id="4e1cf951ff284164b3875c25fe03e9c9",
    ),
    IndicatorMetadata(
        id=210,
        name_en="Ecosystems (Ecuador module)",
        name_es="Ecosistemas del módulo Ecuador",
        subtopic_id=5,
        value_type="categorical",
        aggregation="none",
        unit="ha",
        ai_answerable=True,
        available=True,
        layer=_layer("l_11_ecosistemas_del_modulo_ecuador", "Ecosistema"),
        arcgis_item_id="1108a9956a9b4076931c5a35e9decf3a",
    ),
    IndicatorMetadata(
        id=211,
        name_en="Geomorphology (Ecuador module)",
        name_es="Geomorfología del módulo ecuatoriano",
        subtopic_id=1,
        value_type="categorical",
        aggregation="none",
        unit="ha",
        ai_answerable=True,
        available=True,
        layer=_layer("l_12_geomorfologia_del_modulo_ecuatoriano", "Relieve"),
        arcgis_item_id="6612307cd48f47efb455e567a1a7d289",
    ),
    IndicatorMetadata(
        id=214,
        name_en="Flooding Regime (Ecuador module)",
        name_es="Régimen de Inundación del módulo ecuatoriano",
        subtopic_id=5,
        value_type="categorical",
        aggregation="none",
        unit="ha",
        ai_answerable=True,
        available=True,
        layer=_layer("l_15_regimen_de_inundacion_del_modulo_ecuatoriano", "Regimen"),
        arcgis_item_id="c692c9533c3844dcb06b81721d3ad4d7",
        caveats=(_miscount(7, 14137),),
    ),
    IndicatorMetadata(
        id=217,
        name_en="Thermotypes (Ecuador module)",
        name_es="Termotipos del módulo ecuatoriano",
        subtopic_id=8,
        value_type="categorical",
        aggregation="none",
        unit="ha",
        ai_answerable=True,
        available=True,
        layer=_layer("l_18_termotipos_del_modulo_ecuatoriano", "Termotipo"),
        arcgis_item_id="56bdc6d89df345f2b5ffffa5959068e9",
        caveats=(_miscount(7, 11),),
    ),
    IndicatorMetadata(
        id=218,
        name_en="Climate Types (Ecuador module)",
        name_es="Tipos de clima del módulo ecuatoriano",
        subtopic_id=8,
        value_type="categorical",
        aggregation="none",
        unit="ha",
        ai_answerable=True,
        available=True,
        layer=_layer("l_19_ecu_mod_tipos_de_clima", "TIPO_CLIMA"),
        arcgis_item_id="1cb06063ec0c4e65b73ee2e57b302a65",
    ),
    IndicatorMetadata(
        id=219,
        name_en="Biogeographic Units (Ecuador module)",
        name_es="Unidades Biogeográficas del módulo ecuatoriano",
        subtopic_id=5,
        value_type="categorical",
        aggregation="none",
        unit="ha",
        ai_answerable=True,
        available=True,
        layer=_layer(
            "l_20_unidades_biogeograficas_del_modulo_ecuatoriano", "Sector_bio"
        ),
        arcgis_item_id="7f30afe4c9524140b6a06540955acc70",
        caveats=(_miscount(7, 11),),
    ),
    IndicatorMetadata(
        id=222,
        name_en="Water Recharge Zone (Ecuador module)",
        name_es="Zona de Recarga Hídrica del módulo ecuatoriano",
        subtopic_id=1,
        value_type="categorical",
        aggregation="none",
        unit="ha",
        ai_answerable=True,
        available=True,
        layer=_layer("l_23_zona_de_recarga_hidrica_del_modulo_ecuatoriano", "Nombre"),
        arcgis_item_id="86b76ac2a4c345569d1e08466792f67e",
    ),
)
