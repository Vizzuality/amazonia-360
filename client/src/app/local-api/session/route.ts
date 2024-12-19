import { session } from "@/actions/session";

export async function GET() {
  const data = await session({ refresh: true });

  return Response.json(data || {});
}

export async function POST() {
  const data = await session({ refresh: true });

  return Response.json(data || {});
}
