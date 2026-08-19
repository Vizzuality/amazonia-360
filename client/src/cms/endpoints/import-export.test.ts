import type { Endpoint, PayloadRequest } from "payload";

import { vi } from "vitest";

import { getAdminOnlyEndpoints } from "./import-export";

const getRequest = (user: unknown) => ({ user }) as unknown as PayloadRequest;

describe("getAdminOnlyEndpoints", () => {
  const getEndpoints = (handler: Endpoint["handler"]): Endpoint[] => [
    { path: "/download", method: "post", handler },
  ];

  it("passes an admin through to the plugin handler", async () => {
    const handler = vi.fn(() => Response.json({ ok: true }));
    const [endpoint] = getAdminOnlyEndpoints(getEndpoints(handler));

    const response = await endpoint.handler(getRequest({ id: "1", collection: "admins" }));

    expect(handler).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it("rejects a signed-in frontend user without calling the plugin handler", async () => {
    const handler = vi.fn(() => Response.json({ ok: true }));
    const [endpoint] = getAdminOnlyEndpoints(getEndpoints(handler));

    const response = await endpoint.handler(getRequest({ id: "1", collection: "users" }));

    expect(handler).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });

  it("rejects an unauthenticated request", async () => {
    const handler = vi.fn(() => Response.json({ ok: true }));
    const [endpoint] = getAdminOnlyEndpoints(getEndpoints(handler));

    const response = await endpoint.handler(getRequest(undefined));

    expect(handler).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });

  it("returns an empty list when the collection declares no endpoints", () => {
    expect(getAdminOnlyEndpoints(undefined)).toEqual([]);
    expect(getAdminOnlyEndpoints(false)).toEqual([]);
  });
});
