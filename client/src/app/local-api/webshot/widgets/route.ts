import { NextRequest } from "next/server";

import { env } from "@/env.mjs";

export async function POST(req: NextRequest) {
  const body = await req.json();

  return await fetch(`${env.NEXT_PUBLIC_WEBSHOT_URL}/webshot/api/v1/widgets/png`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  // try {

  //   if (!upstream.ok || !upstream.body) {
  //     return new Response(null, {
  //       status: upstream.status,
  //       statusText: upstream.statusText,
  //     });
  //   }

  //   const arrayBuffer = await upstream.arrayBuffer();

  //   return new NextResponse(arrayBuffer, {
  //     headers: {
  //       "Content-Type": "application/png",
  //       "Cache-Control": "no-store",
  //     },
  //   });
  // } catch (error) {
  //   console.error("Error generating PDF:", error);
  //   return new Response(JSON.stringify({ error: "Failed to generate PDF" }), {
  //     status: 500,
  //     headers: { "Content-Type": "application/json" },
  //   });
  // }
}
