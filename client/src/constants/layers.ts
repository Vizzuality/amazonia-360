// -1 Ubicación

// REFERENCIA LIMITE DEL ÁREA AFP.shp

// https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_AREA_DE_TRABAJO_PANAMAZONIA/FeatureServer/0

// REFERENCIA VECTORES FRONTERA INTERNACIONAL.shp

// https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/REFERENCIA_FRONTERA_INTERNACIONAL/FeatureServer/0

// -------------------------------------

// -2 Admin

// AFP IDENTIFICA ADM2.shp

// https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_ADM2/FeatureServer/0

// --------------------------------------

// - 3 Ciudades CAPITALES

// AFP CAPITALES ADMIN.shp

// https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_CAPITALES_ADMIN/FeatureServer/0

// ----------------------------------------

// - 4 Tierras indígenas

// AFP TIERRAS INDIGENAS.shp

// https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_Tierras_indigenas/FeatureServer/0

// ----------------------------------------

// MEDIO FÍSICO NATURAL

// ----------------------------------------

// -5 Tipos climáticos (Koepen

// AFP TIPOS CLIMATICOS KOEPEN.shp

// https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_Tipos_climaticos_KOEPEN/FeatureServer/0

// ----------------------------------------

// -6 Biomas, Ecosistemas

// AFP BIOMAS.shp

// https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_Biomas/FeatureServer/0

// AFP ECOSISTEMAS.shp

// https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_Ecosistemas/FeatureServer/0

// ---------------------------------------

// -7 Cuenca hidrográfica, pertenencia a grandes cuencas

// AFP GRANDES CUENCAS HIDROGRAFICAS.shp

// https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_Grandes_cuencas_hidrograficas/FeatureServer/0

// ----------------------------------------

// -9 Protección

// AFP AREAS PROTEGIDAS.shp

// https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_Areas_protegidas/FeatureServer/0

export const LAYERS = [
  {
    url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_AREA_DE_TRABAJO_PANAMAZONIA/FeatureServer/0",
    title: "Límite del área AFP",
    id: "area_afp",
  },
  {
    url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/REFERENCIA_FRONTERA_INTERNACIONAL/FeatureServer/0",
    title: "Vectores frontera internacional",
    id: "frontera_internacional",
  },
  {
    url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_ADM2/FeatureServer/0",
    title: "Admin",
    id: "admin",
  },
  {
    url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_CAPITALES_ADMIN/FeatureServer/0",
    title: "Ciudades capitales",
    id: "ciudades_capitales",
  },
  {
    url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_Tierras_indigenas/FeatureServer/0",
    title: "Tierras indígenas",
    id: "tierras_indigenas",
  },
  {
    url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_Tipos_climaticos_KOEPEN/FeatureServer/0",
    title: "Tipos climáticos (Koepen)",
    id: "tipos_climaticos",
  },
  {
    url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_Biomas/FeatureServer/0",
    title: "Biomas",
    id: "biomas",
  },
  {
    url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_Ecosistemas/FeatureServer/0",
    title: "Ecosistemas",
    id: "ecosistemas",
  },
  {
    url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_Grandes_cuencas_hidrograficas/FeatureServer/0",
    title: "Cuenca hidrográfica, pertenencia a grandes cuencas",
    id: "cuencas_hidrograficas",
  },
  {
    url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_Areas_protegidas/FeatureServer/0",
    title: "Áreas protegidas",
    id: "areas_protegidas",
  },
];
