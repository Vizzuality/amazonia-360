import { NextRequest } from "next/server";

import { env } from "@/env.mjs";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const incomingHeaders = Object.fromEntries(req.headers.entries());

  const acceptLanguage = incomingHeaders["accept-language"]?.trim() || "en-US,en;q=0.9";

  const outgoingHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept-Language": acceptLanguage,
  };

  console.log("Forwarding Accept-Language header:", JSON.stringify(acceptLanguage));
  console.log("Generating PDF report with body:", JSON.stringify(body));

  return await fetch(`${env.NEXT_PUBLIC_WEBSHOT_URL}/report/pdf`, {
    method: "POST",
    headers: outgoingHeaders,
    body: JSON.stringify(body),
  });
}
