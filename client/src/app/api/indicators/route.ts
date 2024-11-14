import INDICATORS from "./indicators.json";

export async function GET() {
  return Response.json(INDICATORS);
}
