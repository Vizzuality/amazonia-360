import type { APIRequestContext } from "@playwright/test";

import { getTestUser, getSeedSecret } from "./credentials";

type Credentials = { email: string; password: string };

async function postSeed(request: APIRequestContext, route: string, data: object) {
  const response = await request.post(`/local-api/e2e/${route}`, {
    data: { ...data, secret: getSeedSecret() },
  });

  if (!response.ok()) {
    throw new Error(`Seed ${route} returned ${response.status()}: ${await response.text()}`);
  }

  return response.json();
}

export async function seedUser(request: APIRequestContext, credentials: Credentials) {
  await postSeed(request, "seed-user", credentials);
}

export async function seedAdmin(request: APIRequestContext, credentials: Credentials) {
  await postSeed(request, "seed-admin", credentials);
}

export async function seedReport(request: APIRequestContext, data: object): Promise<string> {
  const { id } = (await postSeed(request, "seed-report", data)) as { id: string };
  return id;
}

const SAMPLE_LOCATION = {
  type: "point" as const,
  geometry: {
    x: -7013128,
    y: -334111,
    spatialReference: { wkid: 102100 },
  },
  buffer: 60,
};

const SAMPLE_TOPICS = [
  {
    topic_id: 1,
    indicators: [
      {
        indicator_id: 1,
        type: "numeric",
        x: 0,
        y: 0,
        w: 2,
        h: 1,
      },
    ],
  },
];

export function seedOwnReport(request: APIRequestContext, title = "E2E Test Report") {
  return seedReport(request, {
    title,
    location: SAMPLE_LOCATION,
    topics: SAMPLE_TOPICS,
    status: "published",
    userEmail: getTestUser().email,
  });
}
