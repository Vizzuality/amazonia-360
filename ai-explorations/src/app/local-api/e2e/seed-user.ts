import { createFileRoute } from "@tanstack/react-router";

async function getPayloadInstance() {
  const [{ getPayload }, { default: config }] = await Promise.all([
    import("payload"),
    import("@payload-config"),
  ]);
  return getPayload({ config });
}

export const Route = createFileRoute("/local-api/e2e/seed-user")({
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

        const existing = await payload.find({
          collection: "users",
          where: { email: { equals: email } },
          limit: 1,
          overrideAccess: true,
        });

        if (existing.docs.length > 0) {
          const user = existing.docs[0];

          if (!user._verified) {
            await payload.update({
              collection: "users",
              id: user.id,
              data: { _verified: true },
              overrideAccess: true,
            });
          }

          return Response.json({ status: "existing" });
        }

        try {
          const created = await payload.create({
            collection: "users",
            disableVerificationEmail: true,
            data: {
              email,
              password,
              name: "E2E Test User",
            },
            overrideAccess: true,
          });

          await payload.update({
            collection: "users",
            id: created.id,
            data: { _verified: true },
            overrideAccess: true,
          });

          return Response.json({ status: "created" });
        } catch (error) {
          const retryFind = await payload.find({
            collection: "users",
            where: { email: { equals: email } },
            limit: 1,
            overrideAccess: true,
          });

          if (retryFind.docs.length > 0) {
            const user = retryFind.docs[0];

            if (!user._verified) {
              await payload.update({
                collection: "users",
                id: user.id,
                data: { _verified: true },
                overrideAccess: true,
              });
            }

            return Response.json({ status: "existing" });
          }

          return Response.json(
            { error: "Failed to create user", details: (error as Error).message },
            { status: 500 },
          );
        }
      },
    },
  },
});
