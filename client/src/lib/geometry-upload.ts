import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import ArcGISPoint from "@arcgis/core/geometry/Point";
import ArcGISPolygon from "@arcgis/core/geometry/Polygon";
import ArcGISPolyline from "@arcgis/core/geometry/Polyline";
import { project } from "@arcgis/core/geometry/projection";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import { selectLoader, load, parse } from "@loaders.gl/core";
import { _GeoJSONLoader as GeoJSONLoader } from "@loaders.gl/json";
import { KMLLoader } from "@loaders.gl/kml";
import { Loader } from "@loaders.gl/loader-utils";
import { ShapefileLoader } from "@loaders.gl/shapefile";
import { ZipLoader } from "@loaders.gl/zip";
import { geojsonToArcGIS } from "@terraformer/arcgis";
import { featureCollection } from "@turf/turf";
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

import { DATASETS } from "@/constants/datasets";

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
export function geojsonToArcGISCustom(geojson: Feature<ValidGeometryType>): __esri.Geometry {
  const geometry = geojson.geometry;

  if (!geometry) {
    throw new Error("Invalid geometry");
  }

  const arcgisGeometry = geojsonToArcGIS(geojson) as {
    attributes?: Record<string, unknown>;
    geometry: Record<string, unknown>;
  };

  let arcgisGeometryInstance: __esri.Geometry;

  switch (geometry.type) {
    case "Point":
      arcgisGeometryInstance = new ArcGISPoint(arcgisGeometry.geometry);
      break;
    case "MultiPoint":
      arcgisGeometryInstance = new ArcGISPoint(arcgisGeometry.geometry);
      break;
    case "LineString":
      arcgisGeometryInstance = new ArcGISPolyline(arcgisGeometry.geometry);
      break;
    case "MultiLineString":
      arcgisGeometryInstance = new ArcGISPolyline(arcgisGeometry.geometry);
      break;
    case "Polygon":
      arcgisGeometryInstance = new ArcGISPolygon(arcgisGeometry.geometry);
      break;
    case "MultiPolygon":
      arcgisGeometryInstance = new ArcGISPolygon(arcgisGeometry.geometry);
      break;
    default:
      throw new Error("Unsupported geometry type");
  }

  // Project from WGS84 (4326) to Web Mercator (102100)
  const projected = project(arcgisGeometryInstance, { wkid: 102100 });
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
  ...["zip"],
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

/**
 * Validate geometry size using ArcGIS geometryEngine geodesicArea
 * @param geometry ArcGIS geometry to validate
 * @param maxSize Maximum area size in square meters
 * @returns true if area is within limit
 */
export const validateGeometrySize = (geometry: __esri.Polygon, maxSize: number): boolean => {
  const areaSize = Math.abs(geometryEngine.geodesicArea(geometry, "square-kilometers"));
  return areaSize <= maxSize;
};

/**
 * Validate if geometry intersects with area_afp dataset bounds
 * @param geometry ArcGIS geometry to validate
 * @returns true if geometry intersects with area_afp
 */
export const validateGeometryBounds = async (geometry: __esri.Geometry): Promise<boolean> => {
  try {
    // Create a FeatureLayer from the area_afp dataset
    const afpLayer = new FeatureLayer({
      url: DATASETS.area_afp.layer.url,
    });

    // Query all features from the area_afp dataset
    const queryResult = await afpLayer.queryFeatures({
      where: "1=1",
      outFields: ["*"],
      returnGeometry: true,
    });

    // Check if the uploaded geometry intersects with any feature in area_afp
    if (queryResult.features.length === 0) {
      return false;
    }

    // Check intersection with each feature (usually there's only one)
    for (const feature of queryResult.features) {
      if (feature.geometry && geometryEngine.intersects(geometry, feature.geometry)) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Error validating geometry bounds:", error);
    return false;
  }
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
 * @returns Error code if the conversion fails
 */
export async function convertFilesToGeojson(files: File[]): Promise<Feature<ValidGeometryType>> {
  // Handle zipped shapefiles
  if (files.length === 1 && files[0].type === "application/zip") {
    try {
      const fileMap = (await load(files[0], ZipLoader, {
        log: {
          log: () => {},
          warn: () => {},
          error: () => {}, // Suppress zip loader errors for missing/irrelevant files
        },
      })) as Record<string, ArrayBuffer>;

      // Check if this is a shapefile archive
      const hasShp = Object.keys(fileMap).some((name) => name.toLowerCase().endsWith(".shp"));

      if (hasShp) {
        // Convert the file map to File objects for processing
        const extractedFiles: File[] = [];
        for (const [filename, content] of Object.entries(fileMap)) {
          // Skip directories and system files
          if (filename.endsWith("/") || filename.includes("__MACOSX") || !content) {
            continue;
          }

          const ext = filename.split(".").pop()?.toLowerCase();
          if (["shp", "shx", "dbf", "prj", "cpg"].includes(ext || "")) {
            const blob = new Blob([content]);
            const file = new File([blob], filename.split("/").pop() || filename, {
              type: "application/octet-stream",
            });
            extractedFiles.push(file);
          }
        }

        // Replace files array with extracted files for shapefile processing
        files = extractedFiles;
      }
    } catch (_e) {
      return Promise.reject(UploadErrorType.UnsupportedFile);
    }
  }
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

/**
 * Convert uploaded files directly to ArcGIS geometry
 * Combines convertFilesToGeojson and geojsonToArcGISCustom into a single operation
 * @param files Files to convert
 * @param options Define a maximum area size in square meters or validate bounds against area_afp
 * @returns ArcGIS geometry ready for use with Esri maps
 */
export async function convertFilesToGeometry(
  files: File[],
  options?: { maxAreaSize?: number; validateBounds?: boolean },
): Promise<__esri.Geometry> {
  // First convert files to GeoJSON
  const geojson = await convertFilesToGeojson(files);

  // Then convert GeoJSON to ArcGIS geometry
  const arcgisGeometry = geojsonToArcGISCustom(geojson);
  console.log("convertFilesToGeometry", { arcgisGeometry });

  // Validate area size using geodesicArea
  if (
    options?.maxAreaSize !== undefined &&
    arcgisGeometry.type === "polygon" &&
    !validateGeometrySize(arcgisGeometry as __esri.Polygon, options.maxAreaSize)
  ) {
    return Promise.reject(UploadErrorType.AreaTooBig);
  }

  // Validate bounds by checking intersection with area_afp
  if (options?.validateBounds && !(await validateGeometryBounds(arcgisGeometry))) {
    return Promise.reject(UploadErrorType.OutsideOfBounds);
  }

  return arcgisGeometry;
}
