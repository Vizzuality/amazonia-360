import { NextRequest } from "next/server";

import { env } from "@/env.mjs";

export async function POST(req: NextRequest) {
  const body = await req.json();

  return await fetch(`${env.NEXT_PUBLIC_WEBSHOT_URL}/report/pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
