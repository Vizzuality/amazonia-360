import { createFileRoute } from "@tanstack/react-router";

import type { Report } from "@/payload-types";

interface SeedReportBody {
  secret?: string;
  title?: string;
  location?: Report["location"];
  topics?: Exclude<Report["topics"], undefined>;
  status?: "draft" | "published";
  userEmail?: string;
}

async function getPayloadInstance() {
  const [{ getPayload }, { default: config }] = await Promise.all([
    import("payload"),
    import("@payload-config"),
  ]);
  return getPayload({ config });
}

export const Route = createFileRoute("/local-api/e2e/seed-report")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.E2E_SEED_SECRET;
        if (!secret) {
          return Response.json({ error: "Not found" }, { status: 404 });
        }

        let body: SeedReportBody;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        const { secret: requestSecret, title, location, topics, status, userEmail } = body;

        if (!requestSecret || requestSecret !== secret) {
          return Response.json({ error: "Not found" }, { status: 404 });
        }

        if (!location) {
          return Response.json({ error: "location is required" }, { status: 400 });
        }

        const payload = await getPayloadInstance();

        let user: Report["user"];
        if (userEmail) {
          const existing = await payload.find({
            collection: "users",
            where: { email: { equals: userEmail } },
            limit: 1,
            overrideAccess: true,
          });

          if (existing.docs.length === 0) {
            return Response.json({ error: `User not found: ${userEmail}` }, { status: 404 });
          }

          user = { relationTo: "users", value: existing.docs[0].id };
        }

        try {
          const report = await payload.create({
            collection: "reports",
            data: {
              title: title ?? "E2E Test Report",
              location,
              topics: topics ?? [],
              _status: status ?? "published",
              ...(user && { user }),
            },
            overrideAccess: true,
          });

          return Response.json({ status: "created", id: report.id });
        } catch (error) {
          return Response.json(
            { error: "Failed to create report", details: (error as Error).message },
            { status: 500 },
          );
        }
      },
    },
  },
});
