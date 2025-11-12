import { env } from "@/env.mjs";

export async function GET() {
  try {
    const res = await fetch(env.NEXT_PUBLIC_API_URL + "/health", {
      cache: "no-cache",
    });
    if (res.status === 200) {
      return new Response("OK", {
        status: 200,
        headers: { "Cache-Control": "max-age=5, must-revalidate" },
      });
    } else {
      return new Response("KO", {
        status: 503,
        headers: { "Cache-Control": "max-age=5, must-revalidate" },
      });
    }
  } catch (error) {
    return new Response("KO", {
      status: 503,
      headers: { "Cache-Control": "max-age=5, must-revalidate" },
      statusText: (error as Error).message,
    });
  }
}
