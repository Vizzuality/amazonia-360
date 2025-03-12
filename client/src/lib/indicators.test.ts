import axios from "axios";

import INDICATORS from "@/app/local-api/indicators/indicators.json";
import {
  ResourceFeature,
  ResourceImagery,
  ResourceImageryTile,
} from "@/app/local-api/indicators/route";
import TOPICS from "@/app/local-api/topics/topics.json";

import { mockQueryFeatures, mockComputeStatisticsHistograms } from "@/jest.setup";

import {
  getIndicators,
  getResourceId,
  getResourceFeatureLayerId,
  getResourceImageryLegendId,
  getQueryFeatureId,
  getQueryImageryId,
  getQueryImageryTileId,
} from "./indicators";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("indicators", () => {
  describe("getIndicators", () => {
    it("should return sorted indicators with topics", async () => {
      const result = await getIndicators();
      expect(result).toEqual(
        INDICATORS.map((indicator) => ({
          ...indicator,
          topic: TOPICS.find((topic) => topic.id === indicator.topic),
        })).sort((a, b) => (a.name_en || "").localeCompare(b.name_en || "")),
      );
    });
  });

  describe("getResourceId", () => {
    it("should fetch resource data", async () => {
      const resource = { url: "http://example.com/resource" } as ResourceFeature;
      const data = { id: 1, name: "Resource" };
      mockedAxios.get.mockResolvedValueOnce({ data });

      const result = await getResourceId({ resource });
      expect(result).toEqual(data);
      expect(mockedAxios.get).toHaveBeenCalledWith(resource.url, { params: { f: "json" } });
    });
  });

  describe("getResourceFeatureLayerId", () => {
    it("should fetch resource feature layer data", async () => {
      const resource = { url: "http://example.com/resource", layer_id: 1 } as ResourceFeature;
      const data = { id: 1, name: "FeatureLayer" };
      mockedAxios.get.mockResolvedValueOnce({ data });

      const result = await getResourceFeatureLayerId({ resource });
      expect(result).toEqual(data);
      expect(mockedAxios.get).toHaveBeenCalledWith(`${resource.url}/${resource.layer_id}`, {
        params: { f: "json" },
      });
    });
  });

  describe("getResourceImageryLegendId", () => {
    it("should fetch resource imagery legend data", async () => {
      const resource = { url: "http://example.com/resource" } as ResourceImagery;
      const data = {
        layers: [{ id: 1, title: "Legend", legend: [{ label: "Label", imageData: "data" }] }],
      };
      mockedAxios.get.mockResolvedValueOnce({ data });

      const result = await getResourceImageryLegendId({ resource });
      expect(result).toEqual(data);
      expect(mockedAxios.get).toHaveBeenCalledWith(`${resource.url}/legend`, {
        params: { f: "json" },
      });
    });
  });

  describe("getQueryFeatureId", () => {
    it("should fetch query feature data", async () => {
      const resource = {
        url: "http://example.com/resource",
        layer_id: 1,
        query_numeric: {},
      } as ResourceFeature;
      const geometry = { type: "polygon" } as __esri.Polygon;
      const data = {
        features: [{ attributes: { value: 1 } }],
        geometryType: "polygon",
        fields: [],
      };
      mockQueryFeatures.mockResolvedValueOnce(data);

      const result = await getQueryFeatureId({ id: 1, type: "numeric", resource, geometry });
      expect(result).toEqual(data);
    });
  });

  describe("getQueryImageryId", () => {
    it("should fetch query imagery data", async () => {
      const resource = { url: "http://example.com/resource" } as ResourceImagery;
      const geometry = { type: "polygon" } as __esri.Polygon;
      const data = { histograms: [], statistics: [] };
      mockComputeStatisticsHistograms.mockResolvedValueOnce(data);

      const result = await getQueryImageryId({ id: 1, type: "numeric", resource, geometry });
      expect(result).toEqual(data);
    });
  });

  describe("getQueryImageryTileId", () => {
    it("should fetch query imagery tile data", async () => {
      const resource = { url: "http://example.com/resource" } as ResourceImageryTile;
      const geometry = { type: "polygon" } as __esri.Polygon;
      const data = { RAT: { features: [] }, histograms: [], statistics: [] };
      mockedAxios.get.mockResolvedValueOnce({ data: data.RAT });

      mockComputeStatisticsHistograms.mockResolvedValueOnce(data);

      const result = await getQueryImageryTileId({ id: 1, type: "numeric", resource, geometry });
      expect(result).toEqual(data);
    });
  });
});
