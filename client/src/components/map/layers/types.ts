export type LayerProps = Partial<
  | (__esri.ImageryLayerProperties & { type: "imagery" })
  | (__esri.FeatureLayerProperties & { type: "feature" })
  | __esri.GraphicsLayer
  | (__esri.VectorTileLayerProperties & { type: "vector-tile" })
>;
