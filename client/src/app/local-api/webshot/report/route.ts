import { NextResponse, NextRequest } from "next/server";

import { env } from "@/env.mjs";

export async function POST(req: NextRequest) {
  const body = await req.json();

  try {
    const upstream = await fetch(`${env.NEXT_PUBLIC_WEBSHOT_URL}/webshot/api/v1/report/pdf`, {
      method: "POST",
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
