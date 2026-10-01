import { NextResponse } from "next/server";

import { getPayload } from "payload";

import config from "@payload-config";

/**
 * Creates the CMS admin the E2E suite signs into `/admin` with. Gated exactly like
 * `seed-user`: without `E2E_SEED_SECRET` in the server's environment the route does not exist.
 */
export async function POST(request: Request) {
  const secret = process.env.E2E_SEED_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: { email?: string; password?: string; secret?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email, password, secret: requestSecret } = body;

  if (!requestSecret || requestSecret !== secret) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: "email and password are required" }, { status: 400 });
  }

  const payload = await getPayload({ config });

  const exists = async () =>
    (
      await payload.find({
        collection: "admins",
        where: { email: { equals: email } },
        limit: 1,
      })
    ).docs.length > 0;

  if (await exists()) {
    return NextResponse.json({ status: "existing" });
  }

  try {
    await payload.create({ collection: "admins", data: { email, password } });

    return NextResponse.json({ status: "created" });
  } catch (error) {
    // A parallel worker may have created it between the find and the create.
    if (await exists()) {
      return NextResponse.json({ status: "existing" });
    }

    return NextResponse.json(
      { error: "Failed to create admin", details: (error as Error).message },
      { status: 500 },
    );
  }
}
