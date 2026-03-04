import type { Page } from "@playwright/test";

/**
 * Mock ArcGIS FeatureServer requests to avoid external dependencies during
 * file upload tests. Intercepts both the /query endpoint used by
 * validateGeometryBounds and the default layer metadata endpoint.
 */
export async function mockArcGISFeatureServer(page: Page) {
  await page.route("**/services6.arcgis.com/**", async (route) => {
    const url = route.request().url();

    if (url.includes("/query")) {
      // Mock the AFP area query used by validateGeometryBounds
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          objectIdFieldName: "FID",
          fields: [{ name: "FID", type: "esriFieldTypeOID", alias: "FID" }],
          features: [
            {
              attributes: { FID: 1 },
              geometry: {
                rings: [
                  [
                    [-8500000, -2200000],
                    [-3500000, -2200000],
                    [-3500000, 1200000],
                    [-8500000, 1200000],
                    [-8500000, -2200000],
                  ],
                ],
                spatialReference: { wkid: 102100 },
              },
            },
          ],
        }),
      });
      return;
    }

    // Default: fulfill with minimal layer metadata
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        currentVersion: 11.1,
        id: 0,
        name: "MockLayer",
        type: "Feature Layer",
        geometryType: "esriGeometryPolygon",
        fields: [{ name: "FID", type: "esriFieldTypeOID" }],
      }),
    });
  });
}
