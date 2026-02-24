import { NextResponse } from "next/server";
import { getPayload } from "payload";

import config from "@payload-config";

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

  // Check if user already exists
  const existing = await payload.find({
    collection: "users",
    where: { email: { equals: email } },
    limit: 1,
  });

  if (existing.docs.length > 0) {
    const user = existing.docs[0];

    // Ensure the user is verified
    if (!user._verified) {
      await payload.update({
        collection: "users",
        id: user.id,
        data: { _verified: true },
      });
    }

    return NextResponse.json({ status: "existing" });
  }

  // Create the user
  try {
    const created = await payload.create({
      collection: "users",
      disableVerificationEmail: true,
      data: {
        email,
        password,
        name: "E2E Test User",
      },
    });

    await payload.update({
      collection: "users",
      id: created.id,
      data: { _verified: true },
    });

    return NextResponse.json({ status: "created" });
  } catch (error) {
    // Handle race condition: another request may have created the user
    const retryFind = await payload.find({
      collection: "users",
      where: { email: { equals: email } },
      limit: 1,
    });

    if (retryFind.docs.length > 0) {
      const user = retryFind.docs[0];

      if (!user._verified) {
        await payload.update({
          collection: "users",
          id: user.id,
          data: { _verified: true },
        });
      }

      return NextResponse.json({ status: "existing" });
    }

    return NextResponse.json(
      { error: "Failed to create user", details: (error as Error).message },
      { status: 500 },
    );
  }
}
