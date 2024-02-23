import FeatureLayer from "@arcgis/core/layers/FeatureLayer";

export const LAYERS = [
  {
    id: "area_afp",
    title: "Límite del área AFP",
    url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_AREA_DE_TRABAJO_PANAMAZONIA/FeatureServer/0",
  },
  {
    id: "frontera_internacional",
    title: "Vectores frontera internacional",
    url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/REFERENCIA_FRONTERA_INTERNACIONAL/FeatureServer/0",
  },
  {
    id: "admin",
    title: "Admin",
    url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_ADM2/FeatureServer/0",
  },
  {
    id: "ciudades_capitales",
    title: "Ciudades capitales",
    url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_CAPITALES_ADMIN/FeatureServer/0",
  },
  {
    id: "tierras_indigenas",
    title: "Tierras indígenas",
    url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_Tierras_indigenas/FeatureServer/0",
  },
  {
    id: "tipos_climaticos",
    title: "Tipos climáticos (Koepen)",
    url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_Tipos_climaticos_KOEPEN/FeatureServer/0",
  },
  {
    id: "biomas",
    title: "Biomas",
    url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_Biomas/FeatureServer/0",
  },
  {
    id: "ecosistemas",
    title: "Ecosistemas",
    url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_Ecosistemas/FeatureServer/0",
  },
  {
    id: "cuencas_hidrograficas",
    title: "Cuenca hidrográfica, pertenencia a grandes cuencas",
    url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_Grandes_cuencas_hidrograficas/FeatureServer/0",
  },
  {
    id: "areas_protegidas",
    title: "Áreas protegidas",
    url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_Areas_protegidas/FeatureServer/0",
  },
] as const satisfies Partial<FeatureLayer>[];
