import ArcGISPoint from "@arcgis/core/geometry/Point";
import ArcGISPolygon from "@arcgis/core/geometry/Polygon";
import ArcGISPolyline from "@arcgis/core/geometry/Polyline";
import { project } from "@arcgis/core/geometry/projection";
import { selectLoader, load, parse } from "@loaders.gl/core";
import { _GeoJSONLoader as GeoJSONLoader } from "@loaders.gl/json";
import { KMLLoader } from "@loaders.gl/kml";
import { Loader } from "@loaders.gl/loader-utils";
import { ShapefileLoader } from "@loaders.gl/shapefile";
import { ZipLoader } from "@loaders.gl/zip";
// import turfIntersect from "@turf/boolean-intersects";
import { area, featureCollection } from "@turf/turf";
import {
  Feature,
  FeatureCollection,
  GeoJSON,
  GeometryCollection,
  LineString,
  MultiLineString,
  MultiPoint,
  MultiPolygon,
  Point,
  Polygon,
} from "geojson";

export type ValidGeometryType =
  | Point
  | MultiPoint
  | LineString
  | MultiLineString
  | Polygon
  | MultiPolygon
  | GeometryCollection;

export enum UploadErrorType {
  Generic = "generic-error",
  InvalidXMLSyntax = "invalid-xml-syntax",
  SHPMissingFile = "shp-missing-file",
  UnsupportedFile = "unsupported-file",
  AreaTooBig = "area-too-big",
  OutsideOfBounds = "outside-of-bounds",
}

/**
 * Convert GeoJSON geometry to ArcGIS JSON geometry
 * Based on terraformer-arcgis-parser conversion logic
 * Automatically reprojects from WGS84 (4326) to Web Mercator (102100)
 */
export function geojsonToArcGIS(geojson: Feature<ValidGeometryType>): __esri.Geometry {
  const geometry = geojson.geometry;

  if (!geometry) {
    throw new Error("Invalid geometry");
  }

  let arcgisGeometry: __esri.Geometry;

  switch (geometry.type) {
    case "Point": {
      arcgisGeometry = new ArcGISPoint({
        x: geometry.coordinates[0],
        y: geometry.coordinates[1],
        spatialReference: { wkid: 4326 },
      });
      break;
    }

    case "LineString": {
      arcgisGeometry = new ArcGISPolyline({
        paths: [geometry.coordinates],
        spatialReference: { wkid: 4326 },
      });
      break;
    }

    case "MultiLineString": {
      arcgisGeometry = new ArcGISPolyline({
        paths: geometry.coordinates,
        spatialReference: { wkid: 4326 },
      });
      break;
    }

    case "Polygon": {
      arcgisGeometry = new ArcGISPolygon({
        rings: geometry.coordinates,
        spatialReference: { wkid: 4326 },
      });
      break;
    }

    case "MultiPolygon": {
      const rings: number[][][] = [];
      geometry.coordinates.forEach((polygon) => {
        polygon.forEach((ring) => {
          rings.push(ring);
        });
      });
      arcgisGeometry = new ArcGISPolygon({
        rings,
        spatialReference: { wkid: 4326 },
      });
      break;
    }

    default: {
      throw new Error(`Unsupported geometry type`);
    }
  }

  // Project from WGS84 (4326) to Web Mercator (102100)
  const projected = project(arcgisGeometry, { wkid: 102100 });
  const projectedGeometry = Array.isArray(projected) ? projected[0] : projected;

  return {
    type: projectedGeometry.type,
    ...projectedGeometry.toJSON(),
  };
}

export const supportedFileformats = [
  ...KMLLoader.extensions,
  ...["geojson"],
  ...["kmz"],
  ...["shp", "prj", "shx", "dbf", "cpg"],
];

/**
 * Return the text content of a file
 * @param file File to read as text
 * @returns Text content of the file
 */
const readFileAsText = (file: File | ArrayBuffer): Promise<string> => {
  if (file instanceof ArrayBuffer) {
    return Promise.resolve(new TextDecoder().decode(file));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };

    reader.onerror = (e) => {
      reject(e);
    };

    reader.readAsText(file);
  });
};

export const validateGeoJSONSize = (geojson: Feature<ValidGeometryType>, maxSize: number) => {
  const areaSize = area(geojson);
  return areaSize <= maxSize;
};

export const validateGeoJSONBounds = (
  _geojson: Feature<ValidGeometryType>,
  _bounds: [[number, number], [number, number]],
) => {
  return true; // Temporarily disable bounds check
  // return turfIntersect(US_BOUNDARY_GEOJSON.features[0], geojson);
};

/**
 * Validate a file and return an error message if it fails
 * @param file File to validate
 * @param loader Loader used to parse the file
 * @returns Error code if the validation fails
 */
export const validateFile = async (
  file: File | ArrayBuffer,
  loader: Loader,
): Promise<UploadErrorType | undefined> => {
  switch (loader) {
    case KMLLoader: {
      // For the KML files, we're checking whether they are valid XML files. For this, we verify:
      // 1. that we can parse them with `DOMParser`
      // 2. that they don't contain parse errors using the technique described in
      //    https://stackoverflow.com/a/20294226
      try {
        const xml = new DOMParser().parseFromString(await readFileAsText(file), "text/xml");

        const xmlWithError = new DOMParser().parseFromString("invalid", "text/xml");

        const parseErrorNS = xmlWithError.getElementsByTagName("parsererror")[0].namespaceURI;

        if (xml.getElementsByTagNameNS(parseErrorNS, "parsererror").length > 0) {
          return UploadErrorType.InvalidXMLSyntax;
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        return UploadErrorType.Generic;
      }
      return;
    }

    default:
      return;
  }
};

/**
 * Convert files to a GeoJSON
 * @param files Files to convert
 * @param options Define a maximum area size in square meters or bounds
 * @returns Error code if the convertion fails
 */
export async function convertFilesToGeojson(
  files: File[],
  options?: { maxAreaSize?: number; bounds?: [[number, number], [number, number]] },
): Promise<Feature<ValidGeometryType>> {
  // If multiple files are uploaded and one of them is a ShapeFile, this is the one we pass to the
  // loader because it is the one `ShapefileLoader` expects (out of the .prj, .shx, etc. other
  // Shapefile-related files). If the user uploaded files of a different extension, we just take the
  // first one.
  let fileToParse: File | ArrayBuffer =
    files.find((f) => f.name.toLowerCase().endsWith(".shp")) ?? files[0];

  let loader: Loader | null = null;

  // We check that we have all the mandatory files to process a ShapeFile
  if (
    fileToParse.name.toLowerCase().endsWith(".shp") ||
    fileToParse.name.toLowerCase().endsWith(".shx") ||
    fileToParse.name.toLowerCase().endsWith(".dbf") ||
    fileToParse.name.toLowerCase().endsWith(".prj")
  ) {
    const hasShp = files.some((f) => f.name.toLowerCase().endsWith(".shp"));
    const hasShx = files.some((f) => f.name.toLowerCase().endsWith(".shx"));
    const hasDbf = files.some((f) => f.name.toLowerCase().endsWith(".dbf"));
    const hasPrj = files.some((f) => f.name.toLowerCase().endsWith(".prj"));

    if (!hasShp || !hasShx || !hasDbf || !hasPrj) {
      return Promise.reject(UploadErrorType.SHPMissingFile);
    }
  }

  if (fileToParse.name.toLowerCase().endsWith(".kmz")) {
    // In most of the cases, a .kmz file is just a zipped .kml file, but it can still contain
    // multiple files
    const fileMap = (await parse(fileToParse, ZipLoader)) as Awaited<
      ReturnType<typeof ZipLoader.parse>
    >;

    const kmlFileName = Object.keys(fileMap).find((name) => name.toLowerCase().endsWith(".kml"));

    if (kmlFileName) {
      fileToParse = fileMap[kmlFileName];
      loader = KMLLoader;
    }
  } else {
    try {
      loader = await selectLoader(fileToParse, [
        ShapefileLoader,
        KMLLoader,
        GeoJSONLoader,
      ] as Loader[]);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return Promise.reject(UploadErrorType.UnsupportedFile);
    }
  }

  if (!loader) {
    return Promise.reject(UploadErrorType.UnsupportedFile);
  }

  const validationError = await validateFile(fileToParse, loader);
  if (validationError) {
    return Promise.reject(validationError);
  }

  let content:
    | Awaited<ReturnType<typeof KMLLoader.parse>>
    | Awaited<ReturnType<typeof ShapefileLoader.parse>>["data"][0]
    | Awaited<ReturnType<typeof GeoJSONLoader.parse>>;

  try {
    content = (await load(fileToParse, loader, {
      gis: {
        format: "geojson",
        // In case of Shapefile, if a .prj file is uploaded, we want to reproject the geometry
        reproject: true,
      },
      shp: {
        // Shapefiles can hold up to 4 dimensions (XYZM). By default all dimensions are parsed;
        // when set to 2 only the X and Y dimensions are parsed. If not set, the resulting geometry
        // will not match the GeoJSON Specification (RFC 7946) and Google Maps will crash.
        // See: https://datatracker.ietf.org/doc/html/rfc7946#appendix-A.2
        _maxDimensions: 2,
      },
      // By default, some loaders like `ShapefileLoader` will fetch the companion files (.prj, .shx,
      // etc.) relative to where the .shp file is located. Yet, they are not served by an external
      // server so we reroute loaders.gl to the files the user uploaded.
      fetch: async (url: string | File): Promise<Response> => {
        let file: File | undefined;

        if (typeof url === "string") {
          const extension = url.split(".").pop()!;
          file = files.find((f) => f.name.toLowerCase().endsWith(extension.toLowerCase()));
        } else {
          file = url;
        }

        if (file) {
          return Promise.resolve(new Response(file));
        }

        return Promise.resolve(new Response(null, { status: 404 }));
      },
    })) as Awaited<ReturnType<typeof KMLLoader.parse | typeof ShapefileLoader.parse>>;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return Promise.reject(UploadErrorType.UnsupportedFile);
  }

  if (loader === ShapefileLoader) {
    content = (content as Awaited<ReturnType<typeof ShapefileLoader.parse>>).data[0];
  }

  let cleanedGeoJSON: Feature<ValidGeometryType> | null = null;

  try {
    cleanedGeoJSON = cleanupGeoJSON(content as GeoJSON);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return Promise.reject(UploadErrorType.UnsupportedFile);
  }

  if (cleanedGeoJSON === null) {
    return Promise.reject(UploadErrorType.UnsupportedFile);
  }

  if (
    options?.maxAreaSize !== undefined &&
    !validateGeoJSONSize(cleanedGeoJSON, options.maxAreaSize)
  ) {
    return Promise.reject(UploadErrorType.AreaTooBig);
  }

  if (options?.bounds !== undefined && !validateGeoJSONBounds(cleanedGeoJSON, options.bounds)) {
    return Promise.reject(UploadErrorType.OutsideOfBounds);
  }

  return cleanedGeoJSON;
}

function cleanupGeoJSON(geoJSON: GeoJSON): Feature<ValidGeometryType> | null {
  const isFeature = (geoJSON: GeoJSON): geoJSON is Feature => geoJSON.type === "Feature";

  const isFeatureCollection = (geoJSON: GeoJSON): geoJSON is FeatureCollection =>
    geoJSON.type === "FeatureCollection";

  let collection: FeatureCollection;
  if (isFeature(geoJSON)) {
    collection = featureCollection([geoJSON]);
  } else if (isFeatureCollection(geoJSON)) {
    collection = geoJSON;
  } else {
    return null;
  }

  const features: Feature<ValidGeometryType>[] = collection.features.filter(
    (f) =>
      f.geometry?.type === "Point" ||
      f.geometry?.type === "MultiPoint" ||
      f.geometry?.type === "LineString" ||
      f.geometry?.type === "MultiLineString" ||
      f.geometry?.type === "Polygon" ||
      f.geometry?.type === "MultiPolygon" ||
      f.geometry?.type === "GeometryCollection",
  ) as Feature<ValidGeometryType>[];

  // NOTE: Only the first feature is imported
  const feature = features[0];
  if (!feature) {
    // No valid geometry found in geojson
    throw new Error();
  }

  return feature;
}
