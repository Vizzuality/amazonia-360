import { createFileRoute } from "@tanstack/react-router";

import { notFound } from "@/lib/navigation";

export const Route = createFileRoute("/$locale/{-$country}/_app/auth/")({
  beforeLoad: () => notFound(),
});
