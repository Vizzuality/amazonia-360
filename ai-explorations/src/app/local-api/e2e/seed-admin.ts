import { createFileRoute } from "@tanstack/react-router";

async function getPayloadInstance() {
  const [{ getPayload }, { default: config }] = await Promise.all([
    import("payload"),
    import("@payload-config"),
  ]);
  return getPayload({ config });
}

export const Route = createFileRoute("/local-api/e2e/seed-admin")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.E2E_SEED_SECRET;
        if (!secret) {
          return Response.json({ error: "Not found" }, { status: 404 });
        }

        let body: { email?: string; password?: string; secret?: string };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        const { email, password, secret: requestSecret } = body;

        if (!requestSecret || requestSecret !== secret) {
          return Response.json({ error: "Not found" }, { status: 404 });
        }

        if (!email || !password) {
          return Response.json({ error: "email and password are required" }, { status: 400 });
        }

        const payload = await getPayloadInstance();

        const exists = async () =>
          (
            await payload.find({
              collection: "admins",
              where: { email: { equals: email } },
              limit: 1,
              overrideAccess: true,
            })
          ).docs.length > 0;

        if (await exists()) {
          return Response.json({ status: "existing" });
        }

        try {
          await payload.create({
            collection: "admins",
            data: { email, password },
            overrideAccess: true,
          });

          return Response.json({ status: "created" });
        } catch (error) {
          // A parallel worker may have created it between the find and the create.
          if (await exists()) {
            return Response.json({ status: "existing" });
          }

          return Response.json(
            { error: "Failed to create admin", details: (error as Error).message },
            { status: 500 },
          );
        }
      },
    },
  },
});
