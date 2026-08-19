import type { Endpoint, PayloadHandler } from "payload";

// Payload runs custom collection endpoints without any access control
// (payload/dist/utilities/handleEndpoints.js calls `handler(req)` directly), so the plugin's
// /download, /export-preview and /preview-data routes are reachable by every authenticated
// user unless each handler is gated here.
const getAdminOnlyHandler = (handler: PayloadHandler): PayloadHandler => {
  return (req) => {
    if (req.user?.collection !== "admins") {
      return Response.json({ errors: [{ message: "Forbidden." }] }, { status: 403 });
    }

    return handler(req);
  };
};

export const getAdminOnlyEndpoints = (endpoints: Endpoint[] | false | undefined): Endpoint[] => {
  if (!endpoints) {
    return [];
  }

  return endpoints.map((endpoint) => ({
    ...endpoint,
    handler: getAdminOnlyHandler(endpoint.handler),
  }));
};
