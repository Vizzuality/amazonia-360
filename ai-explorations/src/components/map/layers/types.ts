export type LayerProps = Partial<
  | (__esri.WebTileLayerProperties & { type: "web-tile" })
  | (__esri.ImageryLayerProperties & { type: "imagery" })
  | (__esri.ImageryTileLayerProperties & { type: "imagery-tile" })
  | (__esri.FeatureLayerProperties & { type: "feature" })
  | __esri.GraphicsLayer
  | (__esri.VectorTileLayerProperties & { type: "vector-tile" })
>;
