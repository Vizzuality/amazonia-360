import { NextResponse, NextRequest } from "next/server";

import { env } from "@/env.mjs";

const webshotUrl = env.NEXT_PUBLIC_WEBSHOT_URL;
const authUser = env.BASIC_AUTH_USER ?? "";
const authPass = env.BASIC_AUTH_PASSWORD ?? "";

const WEBSHOT_AUTH =
  authUser || authPass ? "Basic " + Buffer.from(`${authUser}:${authPass}`).toString("base64") : "";

export async function POST(req: NextRequest) {
  const body = await req.json();

  try {
    const upstream = await fetch(webshotUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(!!WEBSHOT_AUTH && {
          Authorization: WEBSHOT_AUTH,
        }),
      },
      body: JSON.stringify(body),
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({
        error: "Failed to generate PDF",
        status: upstream.status,
        message: upstream.statusText,
      });
    }

    const cd = upstream.headers.get("Content-Disposition") ?? 'attachment; filename="report.pdf"';
    const arrayBuffer = await upstream.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": cd,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return new Response(JSON.stringify({ error: "Failed to generate PDF" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
