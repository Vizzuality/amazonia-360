import { NextResponse } from "next/server";

import { getPayload } from "payload";

import config from "@payload-config";

import { Report } from "@/payload-types";

interface SeedReportBody {
  secret?: string;
  title?: string;
  location?: Report["location"];
  topics?: Report["topics"];
  status?: "draft" | "published";
  userEmail?: string;
}

export async function POST(request: Request) {
  const secret = process.env.E2E_SEED_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: SeedReportBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { secret: requestSecret, title, location, topics, status, userEmail } = body;

  if (!requestSecret || requestSecret !== secret) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!location) {
    return NextResponse.json({ error: "location is required" }, { status: 400 });
  }

  const payload = await getPayload({ config });

  // Look up the user if userEmail is provided
  let user: Report["user"];
  if (userEmail) {
    const existing = await payload.find({
      collection: "users",
      where: { email: { equals: userEmail } },
      limit: 1,
    });

    if (existing.docs.length === 0) {
      return NextResponse.json({ error: `User not found: ${userEmail}` }, { status: 404 });
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
    });

    return NextResponse.json({ status: "created", id: report.id });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create report", details: (error as Error).message },
      { status: 500 },
    );
  }
}
