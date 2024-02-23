import Layer from "@/components/map/layers";

export default function LayerManager() {
  return (
    <>
      <Layer
        id="area-de-trabajo-panamazonia"
        url="https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_AREA_DE_TRABAJO_PANAMAZONIA/FeatureServer/0"
      />
      <Layer
        id="climas"
        url="https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_Tipos_climaticos_KOEPEN/FeatureServer/0"
      />
      <Layer
        id="protected-areas"
        url="https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_Areas_protegidas/FeatureServer/0"
      />
    </>
  );
}
