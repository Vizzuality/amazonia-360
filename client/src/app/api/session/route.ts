import { session } from "@/actions/session";

export async function GET() {
  await session({ refresh: false });

  return Response.json(true);
}


export async function POST() {
  await session({ refresh: true });
}