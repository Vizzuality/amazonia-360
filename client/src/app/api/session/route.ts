import { session } from "@/actions/session";

export async function GET() {
  await session();

  return Response.json({});
}
